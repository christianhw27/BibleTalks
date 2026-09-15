-- ==============================================================================
-- BIBLE TALKS - HOMEPAGE SHOWCASE CARDS MIGRATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.homepage_showcase (
  id text PRIMARY KEY,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug text,
  title text NOT NULL,
  tag text,
  description text,
  image text NOT NULL,
  badge text DEFAULT 'COLLECTION',
  button_text text DEFAULT 'Lihat',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.homepage_showcase ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to homepage_showcase" ON public.homepage_showcase;
CREATE POLICY "Allow public read access to homepage_showcase"
  ON public.homepage_showcase FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow full access to homepage_showcase" ON public.homepage_showcase;
CREATE POLICY "Allow full access to homepage_showcase"
  ON public.homepage_showcase FOR ALL
  USING (true)
  WITH CHECK (true);

-- DEFAULT DATA SEEDING
INSERT INTO public.homepage_showcase (id, category_slug, title, tag, description, image, badge, button_text, sort_order)
VALUES 
  (
    'showcase-outerwear',
    'hoodies-outerwear',
    'Jackets & Outerwear',
    '01 // OUTERWEAR',
    'Zip hoodies 380 GSM, coaches jacket, dan rajut katun tebal.',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    'HOT DROP',
    'Outerwear',
    1
  ),
  (
    'showcase-tshirts',
    't-shirts',
    'Heavyweight T-Shirts',
    '02 // SIGNATURE CUT',
    'Kaos katun 16s 235+ GSM kokoh berpotongan boxy drop-shoulder.',
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    'BESTSELLER',
    'Kaos Boxy',
    2
  ),
  (
    'showcase-accessories',
    'accessories',
    'Aksesoris & Lain-Lain',
    '03 // AKSESORIS & MORE',
    'Topi corduroy 6-panel, beanie, tote bag kanvas, enamel pin, dan pelengkap gaya.',
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    'ESSENTIALS',
    'Aksesoris',
    3
  ),
  (
    'showcase-bottoms',
    'pants-cargos',
    'Pants & Cargos',
    '04 // BOTTOMS',
    'Utility parachute trousers, denim, dan relaxed cargo pants.',
    'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
    'STREET CUT',
    'Celana & Cargo',
    4
  )
ON CONFLICT (id) DO NOTHING;
