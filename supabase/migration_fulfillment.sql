-- ============================================================
-- Migration: AliExpress fulfillment + tracking
-- Ejecuta en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Add fulfillment columns to orders
alter table public.orders
  add column if not exists aliexpress_order_ids jsonb default '[]',
  add column if not exists needs_manual_review   boolean default false,
  add column if not exists tracking_number       text,
  add column if not exists tracking_carrier      text,
  add column if not exists tracking_events       jsonb default '[]',
  add column if not exists confirmed_at          timestamptz,
  add column if not exists shipped_at            timestamptz;

-- Add check constraint for needs_manual_review status visibility
comment on column public.orders.needs_manual_review is
  'True when AliExpress fulfillment failed — requires manual processing';

comment on column public.orders.aliexpress_order_ids is
  'Array of {product_id, aliexpress_order_id} for multi-item orders';
