-- AliExpress OAuth tokens table
create table if not exists public.aliexpress_tokens (
  id            uuid primary key default gen_random_uuid(),
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz not null,
  created_at    timestamptz default now()
);

-- Only service role can read/write tokens
alter table public.aliexpress_tokens enable row level security;
create policy "Service role full access tokens" on public.aliexpress_tokens
  using (true) with check (true);
