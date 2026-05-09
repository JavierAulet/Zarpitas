-- Run this in Supabase SQL Editor
alter table public.products
  add column if not exists cost_price numeric(10,2) default null;
