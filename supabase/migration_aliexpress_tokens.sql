-- aliexpress_tokens: stores OAuth access/refresh tokens for AliExpress API
create table if not exists aliexpress_tokens (
  id          uuid primary key default gen_random_uuid(),
  access_token  text not null,
  refresh_token text,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

-- Only service role can read/write (no public access)
alter table aliexpress_tokens enable row level security;

-- No public RLS policy — access via service role key only
