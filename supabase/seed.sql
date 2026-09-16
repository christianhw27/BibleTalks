-- ==============================================================================
-- BIBLE TALK - SEED DATA (SAMPLE DISTRO CATALOG)
-- Jalankan ini di Supabase SQL Editor SETELAH menjalankan schema.sql
-- ==============================================================================

-- 1. SEED CATEGORIES (Menggunakan prefix valid hex 'c')
insert into public.categories (id, name, slug, description, sort_order)
values
  ('c1111111-1111-1111-1111-111111111111', 'T-Shirts & Oversized', 't-shirts', 'Heavyweight cotton tees with signature boxy drop-shoulder cut.', 1),
  ('c2222222-2222-2222-2222-222222222222', 'Hoodies & Outerwear', 'hoodies-outerwear', 'Fleece zip hoodies, coaches jackets, and heavyweight knitwear.', 2),
  ('c3333333-3333-3333-3333-333333333333', 'Pants & Cargos', 'pants-cargos', 'Utility parachute trousers, denim, and relaxed cargo pants.', 3),
  ('c4444444-4444-4444-4444-444444444444', 'Aksesoris & Lain-Lain', 'accessories', 'Caps, beanies, tote bags, and curated lifestyle goods.', 4)
on conflict (id) do nothing;

-- 2. SEED PRODUCTS (Menggunakan prefix valid hex 'b')
insert into public.products (id, title, slug, description, details, price, category_id, images, tags, status, is_featured)
values
  (
    'b1111111-1111-1111-1111-111111111111',
    'Heavyweight Boxy Tee - ''Grace & Chaos''',
    'heavyweight-boxy-tee-grace-chaos',
    'T-shirt oversized khas street culture dengan material katun 16s tebal, kerah rib rapat, dan sablon grafis plastisol berkarakter tajam.',
    '{"material": "100% Heavyweight Cotton 16s (235 GSM)", "fit": "Boxy Oversized with Drop Shoulder", "print": "High-Density Distressed Plastisol", "care": "Hand wash cold, do not iron on print", "origin": "Bandung, ID"}'::jsonb,
    185000,
    'c1111111-1111-1111-1111-111111111111',
    array[
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80'
    ],
    array['oversized', 'bestseller', 'drop-01'],
    'active',
    true
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Vintage Washed Acid Tee - ''Holy Rebel''',
    'vintage-washed-acid-tee-holy-rebel',
    'Kaos dengan teknik acid wash otentik bertekstur vintage rock tees era 90-an. Setiap helai memiliki motif pudar yang unik dan tidak identik.',
    '{"material": "Cotton Combed 20s Vintage Acid Treated", "fit": "Relaxed Regular Boxy", "print": "Discharge Soft-Hand Feel", "care": "Cold wash inside out", "origin": "Bandung, ID"}'::jsonb,
    195000,
    'c1111111-1111-1111-1111-111111111111',
    array[
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80'
    ],
    array['vintage', 'acid-wash', 'drop-01'],
    'active',
    true
  ),
  (
    'b3333333-3333-3333-3333-333333333333',
    'Distressed Heavy Zip Hoodie - ''Underground Psalms''',
    'distressed-heavy-zip-hoodie-underground-psalms',
    'Heavyweight fleece zip hoodie 380 GSM dengan aksen raw-edge distressing di bagian manset dan saku kangaroo. Zipper YKK metal antik 2 arah.',
    '{"material": "Cotton Fleece Ultra-Heavy 380 GSM", "hardware": "YKK 2-Way Antique Silver Zipper", "fit": "Oversized Boxy Silhouette", "care": "Dry clean recommended or gentle machine wash", "origin": "Bandung, ID"}'::jsonb,
    385000,
    'c2222222-2222-2222-2222-222222222222',
    array[
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80'
    ],
    array['outerwear', 'heavyweight', 'winter-drop'],
    'active',
    true
  ),
  (
    'b4444444-4444-4444-4444-444444444444',
    'Tactical Parachute Cargo Pants - ''Concrete Charcoal''',
    'tactical-parachute-cargo-pants-concrete',
    'Celana kargo berpotongan wide-leg dengan material nilon parasut ripstop tahan percikan air ringan. Dilengkapi adjustable bungeecord di ankle.',
    '{"material": "Water-Repellent Ripstop Nylon", "fit": "Relaxed Wide Leg with Adjustable Hem", "pockets": "6 Ergonomic Utility Compartments", "care": "Machine wash cold gentle", "origin": "Bandung, ID"}'::jsonb,
    320000,
    'c3333333-3333-3333-3333-333333333333',
    array[
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
    ],
    array['cargos', 'utility', 'pants'],
    'active',
    false
  ),
  (
    'b5555555-5555-5555-5555-555555555555',
    'Corduroy Unstructured 6-Panel Cap',
    'corduroy-unstructured-6-panel-cap',
    'Topi 6-panel corduroy tebal vintage dengan bordir logo Bible Talk micro di panel depan dan strap pengatur kulit sintetis di belakang.',
    '{"material": "Premium 8-Wale Cotton Corduroy", "strap": "Adjustable Strap with Metal Buckle", "crown": "Low-Profile Unstructured Fit", "care": "Spot clean with damp cloth", "origin": "Bandung, ID"}'::jsonb,
    135000,
    'c4444444-4444-4444-4444-444444444444',
    array[
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80'
    ],
    array['headwear', 'accessories'],
    'active',
    false
  )
on conflict (id) do nothing;

-- 3. SEED PRODUCT VARIANTS (SIZES & REALISTIC STOCK)
insert into public.product_variants (product_id, size, stock, sku)
values
  -- Variants for Tee Grace & Chaos
  ('b1111111-1111-1111-1111-111111111111', 'S', 8, 'BT-GC-01-S'),
  ('b1111111-1111-1111-1111-111111111111', 'M', 20, 'BT-GC-01-M'),
  ('b1111111-1111-1111-1111-111111111111', 'L', 18, 'BT-GC-01-L'),
  ('b1111111-1111-1111-1111-111111111111', 'XL', 6, 'BT-GC-01-XL'),

  -- Variants for Acid Tee Holy Rebel
  ('b2222222-2222-2222-2222-222222222222', 'S', 5, 'BT-HR-02-S'),
  ('b2222222-2222-2222-2222-222222222222', 'M', 14, 'BT-HR-02-M'),
  ('b2222222-2222-2222-2222-222222222222', 'L', 10, 'BT-HR-02-L'),
  ('b2222222-2222-2222-2222-222222222222', 'XL', 0, 'BT-HR-02-XL'), -- Sold out demo

  -- Variants for Zip Hoodie
  ('b3333333-3333-3333-3333-333333333333', 'M', 8, 'BT-ZH-03-M'),
  ('b3333333-3333-3333-3333-333333333333', 'L', 12, 'BT-ZH-03-L'),
  ('b3333333-3333-3333-3333-333333333333', 'XL', 4, 'BT-ZH-03-XL'),

  -- Variants for Cargo Pants
  ('b4444444-4444-4444-4444-444444444444', 'S', 7, 'BT-CP-04-S'),
  ('b4444444-4444-4444-4444-444444444444', 'M', 12, 'BT-CP-04-M'),
  ('b4444444-4444-4444-4444-444444444444', 'L', 10, 'BT-CP-04-L'),

  -- Variants for Cap
  ('b5555555-5555-5555-5555-555555555555', 'All Size', 25, 'BT-CP-05-OS')
on conflict (product_id, size) do nothing;

-- 4. SEED LOOKBOOK (Menggunakan prefix valid hex 'd')
insert into public.lookbooks (id, title, slug, season, description, cover_image, gallery, is_active, sort_order)
values
  (
    'd1111111-1111-1111-1111-111111111111',
    'Drop 01 // Genesis & Concrete Youth',
    'drop-01-genesis-concrete-youth',
    'Season 2026 Editorial',
    'Eksplorasi kontras antara visual scripture klasik dan lanskap urban underground brutalist. Didokumentasikan di jalanan urban malam hari.',
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1200&q=80',
    array[
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80'
    ],
    true,
    1
  )
on conflict (id) do nothing;

-- 5. SEED STORE SETTINGS
insert into public.store_settings (id, brand_name, tagline, about, whatsapp_number, instagram_url, tiktok_url, address, announcement_bar)
values
  (
    'general',
    'BIBLE TALK',
    'Subculture & Contemporary Streetwear',
    'Bible Talk adalah entitas clothing independen yang memadukan estetika brutalist streetwear, potongan modern boxy fitting, dan pesan naratif yang mendalam.',
    '6281234567890',
    'https://instagram.com/bibletalk.co',
    'https://tiktok.com/@bibletalk',
    'Kabupaten Ngawi, Jawa Timur - Indonesia',
    'NEW ARRIVALS: DROP 01 NOW AVAILABLE • WORLDWIDE SHIPPING AVAILABLE'
  )
on conflict (id) do update set
  brand_name = excluded.brand_name,
  tagline = excluded.tagline,
  address = excluded.address,
  announcement_bar = excluded.announcement_bar;
