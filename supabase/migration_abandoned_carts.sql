-- ============================================================
-- Zarpitas.es — Migración: Carritos abandonados
-- Ejecuta en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  items         JSONB NOT NULL DEFAULT '[]',
  recover_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  send_at       TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  email_sent    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS abandoned_carts_send_at_idx ON public.abandoned_carts(send_at) WHERE email_sent = false;
CREATE INDEX IF NOT EXISTS abandoned_carts_token_idx   ON public.abandoned_carts(recover_token);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
-- Solo service role accede (no public access)
