-- Add sku_attr column to product_variants
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sku_attr TEXT;

-- Index for lookup
CREATE INDEX IF NOT EXISTS product_variants_sku_attr_idx ON public.product_variants(sku_attr);
