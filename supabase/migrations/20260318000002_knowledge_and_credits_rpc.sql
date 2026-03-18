-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Knowledge base + RAG + credit RPC functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Knowledge base table (CV chunks + user notes) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name text NOT NULL,                  -- e.g. "cv.pdf", "manual"
  content     text NOT NULL,
  embedding   vector(1536),
  metadata    jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL
);

-- Index for cosine similarity search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS knowledge_chunks_user_idx
  ON public.knowledge_chunks (user_id);

-- RLS
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own chunks"
  ON public.knowledge_chunks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own chunks"
  ON public.knowledge_chunks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own chunks"
  ON public.knowledge_chunks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "service role full access on knowledge_chunks"
  ON public.knowledge_chunks FOR ALL
  USING (auth.role() = 'service_role');

-- ── Sessions table ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sessions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at   timestamptz DEFAULT now() NOT NULL,
  ended_at     timestamptz,
  duration_sec integer,
  credits_used numeric(10,2) DEFAULT 0,
  metadata     jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role full access on sessions"
  ON public.sessions FOR ALL
  USING (auth.role() = 'service_role');

-- ── RPC: match_knowledge (vector similarity search) ──────────────────────────

CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding   vector(1536),
  match_user_id     uuid,
  match_count       int     DEFAULT 4,
  similarity_threshold float DEFAULT 0.65
)
RETURNS TABLE (
  id         uuid,
  content    text,
  source_name text,
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    kc.id,
    kc.content,
    kc.source_name,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE
    kc.user_id = match_user_id
    AND 1 - (kc.embedding <=> query_embedding) > similarity_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── RPC: deduct_session_credits (atomic credit deduction) ────────────────────

CREATE OR REPLACE FUNCTION public.deduct_session_credits(
  p_user_id    uuid,
  p_session_id uuid,
  p_amount     numeric DEFAULT 0.5,
  p_description text    DEFAULT 'Sesión activa'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance numeric;
BEGIN
  -- Lock the row to prevent races
  SELECT balance INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Insufficient credits
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
    RETURN false;
  END IF;

  -- Deduct
  UPDATE public.user_credits
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO public.credit_transactions
    (user_id, amount, type, description, session_id)
  VALUES
    (p_user_id, -p_amount, 'usage', p_description, p_session_id);

  RETURN true;
END;
$$;

-- ── user_credits view (materialized as real table for row-locking) ────────────
-- Check if user_credits view already exists from migration 1; if it's a view,
-- replace it with a real table backed by credit_transactions sum.

DO $$
BEGIN
  -- Drop view if it exists (migration 1 created user_credits as a VIEW)
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'user_credits'
  ) THEN
    DROP VIEW public.user_credits;
  END IF;

  -- Create real table only if it doesn't exist yet
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_credits'
  ) THEN
    CREATE TABLE public.user_credits (
      user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      balance    numeric(10,2) NOT NULL DEFAULT 0,
      updated_at timestamptz DEFAULT now() NOT NULL
    );

    ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "users can read own balance"
      ON public.user_credits FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "service role full access on user_credits"
      ON public.user_credits FOR ALL
      USING (auth.role() = 'service_role');

    -- Backfill balance from existing credit_transactions
    INSERT INTO public.user_credits (user_id, balance)
    SELECT user_id, COALESCE(SUM(amount), 0)
    FROM public.credit_transactions
    GROUP BY user_id
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$;

-- ── Trigger: sync user_credits balance when credit_transactions inserted ──────

CREATE OR REPLACE FUNCTION public.sync_credit_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, updated_at)
  VALUES (NEW.user_id, NEW.amount, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance    = user_credits.balance + NEW.amount,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_credit_balance ON public.credit_transactions;
CREATE TRIGGER trg_sync_credit_balance
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.sync_credit_balance();
