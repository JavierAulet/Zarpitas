-- ============================================================
-- Zarpitas.es — Migración: Variantes de producto
-- Ejecuta en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,              -- "Talla S", "Color Azul", "M / Rojo"
  sku          TEXT,
  price_modifier NUMERIC NOT NULL DEFAULT 0,  -- precio adicional sobre el base
  stock        INTEGER NOT NULL DEFAULT 0,
  active       BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants(product_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer las variantes activas
CREATE POLICY "Public read variants"
  ON public.product_variants FOR SELECT
  USING (active = true);

-- Solo service role puede escribir (admin)
