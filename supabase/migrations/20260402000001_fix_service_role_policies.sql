-- ============================================================
-- Migration: 20260402000001_fix_service_role_policies
-- Agrega políticas service_role en user_credits y otras tablas
-- que el backend necesita acceder con la service role key.
-- ============================================================

-- ── user_credits: service role full access ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_credits'
      AND policyname = 'service role full access on user_credits'
  ) THEN
    CREATE POLICY "service role full access on user_credits"
      ON public.user_credits FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ── credit_transactions: service role full access ─────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'credit_transactions'
      AND policyname = 'service role full access on credit_transactions'
  ) THEN
    CREATE POLICY "service role full access on credit_transactions"
      ON public.credit_transactions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ── user_profiles: service role full access ───────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
      AND policyname = 'service role full access on user_profiles'
  ) THEN
    CREATE POLICY "service role full access on user_profiles"
      ON public.user_profiles FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ── sessions: garantizar service role access ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions'
      AND policyname = 'service role full access on sessions'
  ) THEN
    CREATE POLICY "service role full access on sessions"
      ON public.sessions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
