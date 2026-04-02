-- Migration: 20260402120000_add_transcript_to_sessions
-- Agrega columna transcript a sessions para guardar la transcripción completa de la sesión.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS transcript TEXT NULL;

COMMENT ON COLUMN public.sessions.transcript IS 'Transcripción completa de la sesión (texto plano, párrafos separados por newline)';

-- Rollback:
-- ALTER TABLE public.sessions DROP COLUMN IF EXISTS transcript;
