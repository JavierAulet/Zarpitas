-- ============================================================
-- Zarpitas.es — Migración: Área de clientes
-- Ejecuta en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Añadir user_id a orders (vincula pedido a cuenta de cliente)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Índice para buscar pedidos por usuario rápidamente
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);

-- 2. Tabla de reseñas
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES public.orders(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, user_id)   -- un usuario solo puede dejar una reseña por producto
);

-- 3. RLS para orders: clientes ven solo sus pedidos
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
CREATE POLICY "Users insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 4. RLS para reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer las reseñas (para mostrarlas en la ficha del producto)
CREATE POLICY "Public read reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Solo el autor puede insertar su reseña
CREATE POLICY "Users insert own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Solo el autor puede eliminar su reseña
CREATE POLICY "Users delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Activar autenticación de email en Supabase
-- Ve a: Authentication > Providers > Email > Habilitar "Confirm email"
-- (Esto no se puede hacer por SQL, hazlo desde el Dashboard)
