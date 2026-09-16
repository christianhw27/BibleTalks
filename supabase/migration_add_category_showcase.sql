-- ==============================================================================
-- BIBLE TALK - MIGRATION: ADD SHOWCASE COLUMNS TO CATEGORIES
-- Jalankan query ini di Dashboard Supabase -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tambah kolom showcase pada tabel public.categories jika belum ada
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS image text,
ADD COLUMN IF NOT EXISTS badge text,
ADD COLUMN IF NOT EXISTS tag text,
ADD COLUMN IF NOT EXISTS button_text text;

-- 2. Isi default data showcase untuk kategori bawaan (agar langsung sinkron dengan desain Homepage)
UPDATE public.categories SET 
  badge = 'HOT DROP',
  tag = '01 // OUTERWEAR',
  button_text = 'Outerwear',
  image = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
WHERE slug = 'hoodies-outerwear';

UPDATE public.categories SET 
  badge = 'BESTSELLER',
  tag = '02 // SIGNATURE CUT',
  button_text = 'Kaos Boxy',
  image = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
WHERE slug = 't-shirts';

UPDATE public.categories SET 
  badge = 'STREET CUT',
  tag = '03 // BOTTOMS',
  button_text = 'Celana & Cargo',
  image = 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80'
WHERE slug = 'pants-cargos';

UPDATE public.categories SET 
  badge = 'ESSENTIALS',
  tag = '04 // AKSESORIS & MORE',
  button_text = 'Aksesoris',
  image = 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80'
WHERE slug = 'accessories';
