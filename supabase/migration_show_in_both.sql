-- Permite que un producto aparezca en ambas categorías (perros y gatos)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_in_both boolean NOT NULL DEFAULT false;
