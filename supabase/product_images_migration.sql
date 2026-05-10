-- Bucket for product images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Allow public reads
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Allow service role to insert/delete (server-side upload via API route)
create policy "Service role upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images');

create policy "Service role delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images');
