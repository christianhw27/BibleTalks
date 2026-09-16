-- ==============================================================================
-- BIBLE TALK - DISTRO & CLOTHING CATALOG DATABASE SCHEMA
-- Compatible with Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. ENUMS & HELPER TYPES (OPTIONAL)
-- (We use text check constraints for flexibility and ease of maintenance)

-- 3. CATEGORIES TABLE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  sort_order integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. PRODUCTS TABLE
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  details jsonb default '{}'::jsonb, -- e.g. {"material": "Heavyweight 16s Cotton", "fit": "Boxy Cut", "print": "High-density Plastisol"}
  price numeric(12, 2) not null,
  category_id uuid references public.categories(id) on delete set null,
  images text[] default '{}'::text[], -- array of image URLs from Supabase Storage
  tags text[] default '{}'::text[], -- e.g. ["oversized", "bestseller", "drop-01"]
  status text default 'active' check (status in ('active', 'coming_soon', 'sold_out', 'archived', 'draft')),
  is_featured boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. PRODUCT VARIANTS (SIZES & STOCK)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null, -- 'S', 'M', 'L', 'XL', 'XXL', 'All Size'
  stock integer not null default 0 check (stock >= 0),
  sku text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (product_id, size)
);

-- 6. LOOKBOOKS / EDITORIAL COLLECTIONS TABLE
create table if not exists public.lookbooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  season text, -- e.g. 'Drop 01 // Autumn Winter', 'Season 2026'
  description text,
  cover_image text,
  gallery text[] default '{}'::text[],
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. STORE SETTINGS & BRAND PROFILE
create table if not exists public.store_settings (
  id text primary key default 'general',
  brand_name text not null default 'Bible Talk',
  tagline text default 'Subculture & Contemporary Streetwear',
  about text,
  whatsapp_number text, -- e.g. '6281234567890' (without +)
  instagram_url text,
  tiktok_url text,
  address text,
  announcement_bar text default 'FREE SHIPPING SPECIAL DROP • WORLDWIDE DELIVERY AVAILABLE',
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. INDEXES FOR HIGH-SPEED QUERYING
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_featured on public.products(is_featured);
create index if not exists idx_product_variants_product on public.product_variants(product_id);
create index if not exists idx_lookbooks_slug on public.lookbooks(slug);

-- 9. TRIGGER FOR AUTO UPDATING 'updated_at'
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.handle_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.handle_updated_at();

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.lookbooks enable row level security;
alter table public.store_settings enable row level security;

-- CATEGORIES POLICIES
create policy "Allow public read-only access to categories"
  on public.categories for select
  using (true);

create policy "Allow authenticated admins full access to categories"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

-- PRODUCTS POLICIES
-- Public visitors can only view non-draft products. Authenticated admins see all.
create policy "Allow public to view active products"
  on public.products for select
  using (status != 'draft' or auth.role() = 'authenticated');

create policy "Allow authenticated admins full access to products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- PRODUCT VARIANTS POLICIES
create policy "Allow public read access to product variants"
  on public.product_variants for select
  using (true);

create policy "Allow authenticated admins full access to variants"
  on public.product_variants for all
  to authenticated
  using (true)
  with check (true);

-- LOOKBOOKS POLICIES
create policy "Allow public to view active lookbooks"
  on public.lookbooks for select
  using (is_active = true or auth.role() = 'authenticated');

create policy "Allow authenticated admins full access to lookbooks"
  on public.lookbooks for all
  to authenticated
  using (true)
  with check (true);

-- STORE SETTINGS POLICIES
create policy "Allow public to read store settings"
  on public.store_settings for select
  using (true);

create policy "Allow authenticated admins to update store settings"
  on public.store_settings for all
  to authenticated
  using (true)
  with check (true);

-- ==============================================================================
-- 11. SUPABASE STORAGE BUCKETS (Products & Lookbooks)
-- ==============================================================================
-- Insert buckets if not already present
insert into storage.buckets (id, name, public)
values 
  ('products', 'products', true),
  ('lookbooks', 'lookbooks', true)
on conflict (id) do nothing;

-- Storage RLS: Public can view images
create policy "Public Access to product images"
  on storage.objects for select
  using (bucket_id in ('products', 'lookbooks'));

-- Storage RLS: Authenticated users can upload and manage images
create policy "Admin upload access to product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('products', 'lookbooks'));

create policy "Admin update access to product images"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('products', 'lookbooks'));

create policy "Admin delete access to product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('products', 'lookbooks'));
