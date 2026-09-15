-- ==============================================================================
-- BIBLE TALKS // MIGRATION: ADD BUNDLES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    original_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    bundle_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    savings_text VARCHAR(100),
    badge VARCHAR(50) DEFAULT 'SPECIAL DROP',
    image TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- Everyone can read active bundles
DROP POLICY IF EXISTS "Public can view bundles" ON public.bundles;
CREATE POLICY "Public can view bundles"
    ON public.bundles
    FOR SELECT
    USING (true);

-- Authenticated users (admin) can insert, update, delete
DROP POLICY IF EXISTS "Admin can insert bundles" ON public.bundles;
CREATE POLICY "Admin can insert bundles"
    ON public.bundles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can update bundles" ON public.bundles;
CREATE POLICY "Admin can update bundles"
    ON public.bundles
    FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admin can delete bundles" ON public.bundles;
CREATE POLICY "Admin can delete bundles"
    ON public.bundles
    FOR DELETE
    TO authenticated
    USING (true);

-- Seed initial default bundles
INSERT INTO public.bundles (title, subtitle, original_price, bundle_price, savings_text, badge, image, items, sort_order)
VALUES
(
    'The Sabbath Essential Set',
    'Heavyweight Boxy Tee + Corduroy Cap + Free Sticker Pack',
    320000,
    270000,
    'Hemat Rp50.000',
    'BEST VALUE',
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    '[
        {"name": "Heavyweight Boxy Tee (Grace & Chaos / Holy Rebel)", "detail": "Bahan 100% Katun 16s 235 GSM (Pilihan Size S-XL)"},
        {"name": "Corduroy Unstructured 6-Panel Cap", "detail": "Material corduroy vintage tebal dengan bordir micro"},
        {"name": "Bible Talks Scripture Sticker Pack", "detail": "Gratis 5 pcs stiker vinyl tahan air bertema scripture"}
    ]'::jsonb,
    1
),
(
    'Upper Room Outerwear Set',
    'Heavy Zip Hoodie 380 GSM + Tactical Cargo Pants',
    705000,
    595000,
    'Hemat Rp110.000',
    'COLD WEATHER',
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    '[
        {"name": "Distressed Heavy Zip Hoodie (Underground Psalms)", "detail": "Fleece tebal 380 GSM dengan zipper antik 2 arah"},
        {"name": "Tactical Parachute Cargo Pants", "detail": "Material ripstop water-repellent dengan 6 saku ergonomis"},
        {"name": "Scripture Woven Lanyard / Keychain", "detail": "Gratis gantungan kunci tenun eksklusif"}
    ]'::jsonb,
    2
),
(
    'Fellowship & Devotion Pack',
    'Signature Washed Tee + Stainless Tumbler + Devotion Tote',
    445000,
    375000,
    'Hemat Rp70.000',
    'DAILY ESSENTIAL',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    '[
        {"name": "Vintage Washed Acid Tee (Holy Rebel)", "detail": "Kaos vintage wash otentik teknik pudar 90-an"},
        {"name": "Bible Talks Vacuum Tumbler 500ml", "detail": "Stainless SUS304 double-wall tahan panas/dingin 12 jam"},
        {"name": "Heavyweight 14oz Canvas Tote Bag", "detail": "Gratis tote bag kanvas tebal untuk buku atau Alkitab"}
    ]'::jsonb,
    3
)
ON CONFLICT DO NOTHING;
