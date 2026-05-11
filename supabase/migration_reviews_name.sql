-- ============================================================
-- Zarpitas.es — Migración: Nombre en reseñas
-- Ejecuta en: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name TEXT;
