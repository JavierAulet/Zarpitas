-- Add properties JSONB column to product_variants
-- Stores AliExpress SKU property combinations e.g. [{"name":"Color","value":"Rojo"},{"name":"Talla","value":"M"}]
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS properties JSONB DEFAULT NULL;
