-- ============================================================
-- Migration: Stripe payment integration
-- Ejecuta en: Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.orders
  add column if not exists stripe_payment_intent_id text;

comment on column public.orders.stripe_payment_intent_id is
  'Stripe PaymentIntent ID — used for refunds and webhook idempotency';
