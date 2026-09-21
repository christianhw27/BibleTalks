-- ==============================================================================
-- BIBLE TALK - MIGRATION: ADD HERO SLIDES & AUTO-SLIDER INTERVAL
-- Jalankan query ini di Dashboard Supabase -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tambahkan kolom hero_slides dan hero_slide_interval pada tabel store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS hero_slides jsonb DEFAULT '[
  {
    "id": "slide-1",
    "image": "/hero-product.jpg",
    "badge": "★ 16S ULTRA HEAVY",
    "caption": "BIBLE TALK ARCHIVE // 2026",
    "tag": "REF. BT-HERO-01"
  }
]'::jsonb,
ADD COLUMN IF NOT EXISTS hero_slide_interval integer DEFAULT 4;

-- 2. Update baris general jika data saat ini masih null
UPDATE public.store_settings
SET 
  hero_slides = CASE 
    WHEN hero_slides IS NULL OR jsonb_array_length(hero_slides) = 0 THEN 
      '[
        {
          "id": "slide-1",
          "image": "/hero-product.jpg",
          "badge": "★ 16S ULTRA HEAVY",
          "caption": "BIBLE TALK ARCHIVE // 2026",
          "tag": "REF. BT-HERO-01"
        }
      ]'::jsonb
    ELSE hero_slides
  END,
  hero_slide_interval = COALESCE(hero_slide_interval, 4)
WHERE id = 'general';
