-- ==============================================================================
-- BIBLE TALK - MIGRATION: ADD ROLLING WHATSAPP SHIFTS (WIB BASED)
-- Jalankan query ini di Dashboard Supabase -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tambahkan kolom whatsapp_shifts_enabled dan whatsapp_shifts pada tabel store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS whatsapp_shifts_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_shifts jsonb DEFAULT '[
  {
    "id": "shift-1",
    "name": "CP 1 (Shift Pagi - Siang)",
    "start_time": "00:00",
    "end_time": "12:00",
    "whatsapp_number": "6281234567890",
    "is_active": true
  },
  {
    "id": "shift-2",
    "name": "CP 2 (Shift Siang - Malam)",
    "start_time": "12:01",
    "end_time": "23:59",
    "whatsapp_number": "6289876543210",
    "is_active": true
  }
]'::jsonb;

-- 2. Pastikan row general memiliki data default shift jika saat ini masih null
UPDATE public.store_settings
SET 
  whatsapp_shifts_enabled = COALESCE(whatsapp_shifts_enabled, true),
  whatsapp_shifts = CASE 
    WHEN whatsapp_shifts IS NULL OR jsonb_array_length(whatsapp_shifts) = 0 THEN 
      '[
        {
          "id": "shift-1",
          "name": "CP 1 (Shift Pagi - Siang)",
          "start_time": "00:00",
          "end_time": "12:00",
          "whatsapp_number": "6281234567890",
          "is_active": true
        },
        {
          "id": "shift-2",
          "name": "CP 2 (Shift Siang - Malam)",
          "start_time": "12:01",
          "end_time": "23:59",
          "whatsapp_number": "6289876543210",
          "is_active": true
        }
      ]'::jsonb
    ELSE whatsapp_shifts
  END
WHERE id = 'general';
