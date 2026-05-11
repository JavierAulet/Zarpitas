-- ============================================================
-- Zarpitas.es — Migración: Códigos de descuento
-- Ejecuta en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value           NUMERIC NOT NULL CHECK (value > 0),
  min_order_amount NUMERIC NOT NULL DEFAULT 0,
  max_uses        INTEGER,
  used_count      INTEGER NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Los cupones solo se validan server-side (service role). Sin acceso público directo.

-- Columnas en orders para guardar el cupón aplicado
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC NOT NULL DEFAULT 0;

-- Cupones de ejemplo (modifica desde el panel de admin o Supabase)
INSERT INTO public.coupons (code, type, value, min_order_amount) VALUES
  ('BIENVENIDO10', 'percent', 10, 0),
  ('ZARPITAS20',   'percent', 20, 50),
  ('DESCUENTO5',   'fixed',   5,  30)
ON CONFLICT (code) DO NOTHING;
