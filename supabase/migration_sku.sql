-- Add SKU field to products
alter table products add column if not exists sku text unique;

-- Auto-generate SKUs for existing products that don't have one
do $$
declare
  r record;
  counter int;
  prefix text;
  new_sku text;
begin
  counter := 1;
  for r in (select id, category from products where sku is null order by created_at)
  loop
    prefix := case r.category
      when 'perros' then 'ZAR-DOG'
      when 'gatos'  then 'ZAR-CAT'
      else               'ZAR-PRO'
    end;

    -- Find next available number
    loop
      new_sku := prefix || '-' || lpad(counter::text, 3, '0');
      exit when not exists (select 1 from products where sku = new_sku);
      counter := counter + 1;
    end loop;

    update products set sku = new_sku where id = r.id;
    counter := counter + 1;
  end loop;
end $$;

-- Index for fast SKU lookups
create index if not exists products_sku_idx on products (sku);
