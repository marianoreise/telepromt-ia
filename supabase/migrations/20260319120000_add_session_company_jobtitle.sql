-- ============================================================
-- Migration: 20260319120000_add_session_company_jobtitle
-- Agrega columnas company, job_title, status a sessions.
-- Agrega políticas INSERT/UPDATE faltantes.
-- Agrega trigger de max 1 sesión activa por usuario.
-- ============================================================

-- ── 1. Nuevas columnas (idempotentes) ────────────────────────

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS company   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS job_title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status    TEXT NOT NULL DEFAULT 'active';

-- CHECK constraint en status (solo si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.sessions'::regclass
      AND conname  = 'sessions_status_check'
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_status_check
      CHECK (status IN ('active', 'ended', 'expired'));
  END IF;
END $$;

-- ── 2. Índices ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON public.sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_status_user_id
  ON public.sessions (user_id, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_started_at
  ON public.sessions (started_at DESC);

-- ── 3. RLS: políticas INSERT y UPDATE (idempotentes) ─────────

-- INSERT: el usuario solo puede crear sesiones a su propio nombre
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions'
      AND policyname = 'sessions_insert'
  ) THEN
    CREATE POLICY "sessions_insert"
      ON public.sessions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- UPDATE: el usuario solo puede actualizar sus propias sesiones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions'
      AND policyname = 'sessions_update'
  ) THEN
    CREATE POLICY "sessions_update"
      ON public.sessions FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- DELETE: el usuario puede eliminar sus propias sesiones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sessions'
      AND policyname = 'sessions_delete'
  ) THEN
    CREATE POLICY "sessions_delete"
      ON public.sessions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 4. GRANT ─────────────────────────────────────────────────

GRANT ALL ON public.sessions TO service_role;
GRANT ALL ON public.sessions TO authenticated;
GRANT SELECT ON public.sessions TO anon;

-- ── 5. Trigger: máx 1 sesión activa por usuario ──────────────

CREATE OR REPLACE FUNCTION public.enforce_single_active_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo aplica cuando se inserta o cuando status cambia a 'active'
  IF (TG_OP = 'INSERT' AND NEW.status = 'active')
  OR (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status <> 'active')
  THEN
    IF EXISTS (
      SELECT 1
      FROM public.sessions
      WHERE user_id = NEW.user_id
        AND status  = 'active'
        AND id     <> NEW.id
    ) THEN
      RAISE EXCEPTION 'El usuario ya tiene una sesión activa (id: %)',
        (SELECT id FROM public.sessions
         WHERE user_id = NEW.user_id AND status = 'active' AND id <> NEW.id
         LIMIT 1);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_active_session ON public.sessions;
CREATE TRIGGER trg_single_active_session
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_session();

-- ── 6. Comentarios ───────────────────────────────────────────

COMMENT ON COLUMN public.sessions.company   IS 'Empresa objetivo declarada al iniciar la sesión';
COMMENT ON COLUMN public.sessions.job_title IS 'Puesto objetivo declarado al iniciar la sesión';
COMMENT ON COLUMN public.sessions.status    IS 'active | ended | expired';

-- ── ROLLBACK ─────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_single_active_session ON public.sessions;
-- DROP FUNCTION IF EXISTS public.enforce_single_active_session();
-- DROP INDEX IF EXISTS idx_sessions_status_user_id;
-- DROP INDEX IF EXISTS idx_sessions_user_id;
-- DROP INDEX IF EXISTS idx_sessions_started_at;
-- ALTER TABLE public.sessions DROP COLUMN IF EXISTS status;
-- ALTER TABLE public.sessions DROP COLUMN IF EXISTS job_title;
-- ALTER TABLE public.sessions DROP COLUMN IF EXISTS company;
