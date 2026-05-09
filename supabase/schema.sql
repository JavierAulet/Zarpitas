-- ============================================================
-- Zarpitas.es — Supabase Schema
-- Ejecuta este SQL en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Products table
create table if not exists public.products (
  id            text primary key,
  name          text not null,
  price         numeric(10,2) not null,
  original_price numeric(10,2),
  image         text,
  images        text[] default '{}',
  category      text not null check (category in ('perros', 'gatos')),
  subcategory   text,
  badge         text check (badge in ('nuevo', 'oferta', 'mas-vendido')),
  rating        numeric(3,2) default 0,
  reviews       integer default 0,
  description   text,
  features      text[] default '{}',
  aliexpress_id text,
  stock         integer default 0,
  active        boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Orders table
create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  customer_email      text not null,
  customer_name       text not null,
  customer_phone      text,
  shipping_address    jsonb not null,
  items               jsonb not null,
  subtotal            numeric(10,2) not null,
  shipping            numeric(10,2) not null default 0,
  total               numeric(10,2) not null,
  status              text not null default 'pending'
                        check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  aliexpress_order_id text,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Row Level Security
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Public can read active products (for the store)
create policy "Public read active products"
  on public.products for select
  using (active = true);

-- Service role has full access (for admin panel)
create policy "Service role full access products"
  on public.products
  using (true)
  with check (true);

create policy "Service role full access orders"
  on public.orders
  using (true)
  with check (true);

-- ============================================================
-- Storage bucket for product images
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('products', 'products', true)
  on conflict (id) do nothing;

create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'products');

create policy "Service role upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products');

create policy "Service role update product images"
  on storage.objects for update
  using (bucket_id = 'products');

create policy "Service role delete product images"
  on storage.objects for delete
  using (bucket_id = 'products');

-- ============================================================
-- Seed: los 8 productos iniciales de Zarpitas
-- ============================================================
insert into public.products (id, name, price, original_price, category, subcategory, badge, rating, reviews, description, features, aliexpress_id, stock, active)
values
  ('collar-gps-perro', 'Collar GPS Premium para Perros', 49.99, 69.99, 'perros', 'Collares y Arneses', 'nuevo', 4.8, 234,
   'Mantén a tu perro siempre seguro con nuestro collar GPS de última generación.',
   ARRAY['Rastreo GPS en tiempo real','Resistente al agua IPX7','Batería de 48 horas','Zona segura configurable','Compatible con iOS y Android'],
   'ae_collar_gps_001', 45, true),

  ('cama-ortopedica-perro', 'Cama Ortopédica Premium para Perro', 89.99, null, 'perros', 'Camas y Descanso', 'mas-vendido', 4.9, 567,
   'La cama que tu perro merece. Espuma viscoelástica de alta densidad.',
   ARRAY['Espuma viscoelástica de memoria','Funda lavable a máquina','Tejido antiácaros e hipoalergénico','Base antideslizante','Disponible en 3 tallas'],
   null, 28, true),

  ('comedero-inteligente', 'Comedero Inteligente Automático', 59.99, 79.99, 'perros', 'Comederos', null, 4.6, 189,
   'Alimenta a tu mascota desde cualquier lugar del mundo.',
   ARRAY['Control por aplicación móvil','Cámara HD con micrófono','Programación de 6 comidas/día','Capacidad 6 kg de pienso','Dispensador antipaja'],
   null, 52, true),

  ('rascador-arbol-gato', 'Árbol Rascador Premium para Gatos', 79.99, null, 'gatos', 'Rascadores', 'mas-vendido', 4.7, 412,
   'El paraíso de tu gato en casa. Árbol rascador de 5 niveles.',
   ARRAY['Sisal natural 100%','5 niveles de actividad','Hamaca colgante incluida','Base extra estable','Juguete ratón de regalo'],
   null, 19, true),

  ('juguete-laser-gato', 'Juguete Interactivo Láser para Gatos', 29.99, 39.99, 'gatos', 'Juguetes', null, 4.5, 298,
   'Mantén a tu gato activo y feliz con nuestro juguete láser automático de 360°.',
   ARRAY['Movimiento 360° automático','5 patrones aleatorios','Temporizador 15 minutos','3 velocidades ajustables','Seguro para ojos de mascotas'],
   null, 87, true),

  ('arnes-antipull-perro', 'Arnés Antipull Reflectante para Perro', 34.99, null, 'perros', 'Collares y Arneses', null, 4.6, 156,
   'Paseos seguros y cómodos para ti y tu perro.',
   ARRAY['Sistema antipull patentado','Franjas reflectantes 360°','Acolchado ergonómico','Ajuste en 4 puntos','Resistente al agua'],
   null, 63, true),

  ('bebedero-fuente-gato', 'Bebedero Fuente Filtrante para Gatos', 44.99, 64.99, 'gatos', 'Comederos', 'oferta', 4.8, 334,
   'Tu gato merece agua fresca y limpia siempre.',
   ARRAY['Filtro de carbón activo','Acero inoxidable grado alimentario','Capacidad 2,5 litros','Modo nocturno silencioso','Indicador de nivel de agua'],
   null, 41, true),

  ('chubasquero-perro', 'Chubasquero Impermeable para Perro', 39.99, null, 'perros', 'Ropa y Accesorios', 'nuevo', 4.4, 98,
   'Que la lluvia no detenga vuestros paseos.',
   ARRAY['Impermeable 100% (10.000 mm)','Capucha ajustable con visera','Tira reflectante dorsal','Cierre de velcro y botón','Disponible en 6 tallas'],
   null, 34, true)

on conflict (id) do nothing;
