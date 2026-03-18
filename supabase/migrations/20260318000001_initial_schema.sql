-- ============================================================
-- Migration: 20260318000001_initial_schema
-- Tablas: user_profiles, credit_transactions
-- ============================================================

-- ── user_profiles ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name      text,
  role              text,
  target_company    text,
  preferred_language text       NOT NULL DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
  onboarding_step   integer     NOT NULL DEFAULT 0,
  avatar_url        text,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='user_profiles_select') THEN
    CREATE POLICY "user_profiles_select" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='user_profiles_insert') THEN
    CREATE POLICY "user_profiles_insert" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='user_profiles_update') THEN
    CREATE POLICY "user_profiles_update" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='user_profiles_delete') THEN
    CREATE POLICY "user_profiles_delete" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE public.user_profiles IS 'Perfil extendido del usuario con preferencias y estado de onboarding';

-- ── credit_transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount          numeric(10,2) NOT NULL,
  type            text        NOT NULL CHECK (type IN ('bonus', 'purchase', 'usage', 'refund')),
  description     text        NOT NULL,
  mp_payment_id   text,
  session_id      uuid,
  created_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='credit_transactions' AND policyname='credit_transactions_select') THEN
    CREATE POLICY "credit_transactions_select" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='credit_transactions' AND policyname='credit_transactions_insert') THEN
    CREATE POLICY "credit_transactions_insert" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='credit_transactions' AND policyname='credit_transactions_update') THEN
    CREATE POLICY "credit_transactions_update" ON public.credit_transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='credit_transactions' AND policyname='credit_transactions_delete') THEN
    CREATE POLICY "credit_transactions_delete" ON public.credit_transactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE public.credit_transactions IS 'Registro de todos los movimientos de créditos del usuario';

-- ── Vista de saldo de créditos ────────────────────────────────
CREATE OR REPLACE VIEW public.user_credits AS
SELECT
  user_id,
  COALESCE(SUM(amount), 0) AS balance
FROM public.credit_transactions
GROUP BY user_id;

-- ── Trigger: bono de bienvenida al crear perfil ───────────────
CREATE OR REPLACE FUNCTION public.grant_welcome_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.user_id, 2.0, 'bonus', 'Bono de bienvenida: 60 minutos gratis');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_welcome_credits ON public.user_profiles;
CREATE TRIGGER trigger_welcome_credits
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.grant_welcome_credits();

-- ── ROLLBACK:
-- DROP TRIGGER IF EXISTS trigger_welcome_credits ON public.user_profiles;
-- DROP FUNCTION IF EXISTS public.grant_welcome_credits();
-- DROP VIEW IF EXISTS public.user_credits;
-- DROP TABLE IF EXISTS public.credit_transactions;
-- DROP TABLE IF EXISTS public.user_profiles;
-- DROP FUNCTION IF EXISTS update_updated_at();
