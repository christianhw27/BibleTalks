import { supabase } from '../lib/supabase'

const BUNDLES_STORAGE_KEY = 'bibletalks_bundle_packages'

export const DEFAULT_BUNDLES = [
  {
    id: 'bundle-01',
    title: 'The Sabbath Essential Set',
    subtitle: 'Heavyweight Boxy Tee + Corduroy Cap + Free Sticker Pack',
    originalPrice: 320000,
    bundlePrice: 270000,
    savingsText: 'Hemat Rp50.000',
    badge: 'BEST VALUE',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    items: [
      { name: 'Heavyweight Boxy Tee (Grace & Chaos / Holy Rebel)', detail: 'Bahan 100% Katun 16s 235 GSM (Pilihan Size S-XL)' },
      { name: 'Corduroy Unstructured 6-Panel Cap', detail: 'Material corduroy vintage tebal dengan bordir micro' },
      { name: 'Bible Talk Scripture Sticker Pack', detail: 'Gratis 5 pcs stiker vinyl tahan air bertema scripture' },
    ],
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'bundle-02',
    title: 'Upper Room Outerwear Set',
    subtitle: 'Heavy Zip Hoodie 380 GSM + Tactical Cargo Pants',
    originalPrice: 705000,
    bundlePrice: 595000,
    savingsText: 'Hemat Rp110.000',
    badge: 'COLD WEATHER',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    items: [
      { name: 'Distressed Heavy Zip Hoodie (Underground Psalms)', detail: 'Fleece tebal 380 GSM dengan zipper antik 2 arah' },
      { name: 'Tactical Parachute Cargo Pants', detail: 'Material ripstop water-repellent dengan 6 saku ergonomis' },
      { name: 'Scripture Woven Lanyard / Keychain', detail: 'Gratis gantungan kunci tenun eksklusif' },
    ],
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'bundle-03',
    title: 'Fellowship & Devotion Pack',
    subtitle: 'Signature Washed Tee + Stainless Tumbler + Devotion Tote',
    originalPrice: 445000,
    bundlePrice: 375000,
    savingsText: 'Hemat Rp70.000',
    badge: 'DAILY ESSENTIAL',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    items: [
      { name: 'Vintage Washed Acid Tee (Holy Rebel)', detail: 'Kaos vintage wash otentik teknik pudar 90-an' },
      { name: 'Bible Talk Vacuum Tumbler 500ml', detail: 'Stainless SUS304 double-wall tahan panas/dingin 12 jam' },
      { name: 'Heavyweight 14oz Canvas Tote Bag', detail: 'Gratis tote bag kanvas tebal untuk buku atau Alkitab' },
    ],
    sort_order: 3,
    is_active: true,
  },
]

/**
 * Normalisasi objek bundle baik dari Supabase mau pun LocalStorage
 */
function normalizeBundle(b) {
  return {
    id: String(b.id),
    title: b.title || 'Paket Bundle',
    subtitle: b.subtitle || '',
    originalPrice: Number(b.original_price ?? b.originalPrice ?? 0),
    bundlePrice: Number(b.bundle_price ?? b.bundlePrice ?? 0),
    savingsText: b.savings_text || b.savingsText || '',
    badge: b.badge || 'SPECIAL DROP',
    image: b.image || '',
    items: Array.isArray(b.items) ? b.items : [],
    sort_order: Number(b.sort_order ?? 0),
    is_active: b.is_active !== undefined ? Boolean(b.is_active) : true,
  }
}

/**
 * Membaca dari localStorage
 */
export function getLocalBundles() {
  if (typeof window === 'undefined') return DEFAULT_BUNDLES
  try {
    const raw = localStorage.getItem(BUNDLES_STORAGE_KEY)
    if (!raw) return DEFAULT_BUNDLES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed.map(normalizeBundle)
      : DEFAULT_BUNDLES
  } catch (err) {
    console.warn('Failed to parse bundles from localStorage:', err)
    return DEFAULT_BUNDLES
  }
}

/**
 * Menyimpan array bundles ke localStorage
 */
export function saveLocalBundles(bundles) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(BUNDLES_STORAGE_KEY, JSON.stringify(bundles))
  } catch (err) {
    console.warn('Failed to save bundles to localStorage:', err)
  }
}

/**
 * Mengambil daftar bundles (mencoba Supabase terlebih dahulu, fallback ke localStorage)
 */
export async function getBundles() {
  try {
    const { data, error } = await supabase
      .from('bundles')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      // Jika tabel belum dibuat di Supabase, fallback ke localStorage
      return getLocalBundles()
    }

    if (data && data.length > 0) {
      const normalized = data.map(normalizeBundle)
      // Simpan cache lokal
      saveLocalBundles(normalized)
      return normalized
    }

    // Jika tabel ada tapi kosong, cek local storage
    return getLocalBundles()
  } catch (err) {
    console.warn('Supabase bundles query failed, using localStorage fallback:', err)
    return getLocalBundles()
  }
}

/**
 * Membuat paket bundle baru
 */
export async function createBundle(bundleData) {
  const newId = `bundle-${Date.now()}`
  const normalized = normalizeBundle({
    ...bundleData,
    id: newId,
  })

  // Simpan ke Supabase jika memungkinkan
  try {
    const dbPayload = {
      title: normalized.title,
      subtitle: normalized.subtitle,
      original_price: normalized.originalPrice,
      bundle_price: normalized.bundlePrice,
      savings_text: normalized.savingsText,
      badge: normalized.badge,
      image: normalized.image,
      items: normalized.items,
      sort_order: normalized.sort_order,
      is_active: normalized.is_active,
    }

    const { data, error } = await supabase
      .from('bundles')
      .insert([dbPayload])
      .select()
      .single()

    if (!error && data) {
      const created = normalizeBundle(data)
      const currentList = getLocalBundles()
      saveLocalBundles([...currentList, created])
      return created
    }
  } catch (err) {
    console.warn('Failed to insert bundle to Supabase, saving locally:', err)
  }

  // Local fallback
  const currentList = getLocalBundles()
  const updated = [...currentList, normalized]
  saveLocalBundles(updated)
  return normalized
}

/**
 * Mengupdate paket bundle
 */
export async function updateBundle(bundleId, bundleData) {
  const normalized = normalizeBundle({
    ...bundleData,
    id: bundleId,
  })

  // Coba update ke Supabase
  try {
    const dbPayload = {
      title: normalized.title,
      subtitle: normalized.subtitle,
      original_price: normalized.originalPrice,
      bundle_price: normalized.bundlePrice,
      savings_text: normalized.savingsText,
      badge: normalized.badge,
      image: normalized.image,
      items: normalized.items,
      sort_order: normalized.sort_order,
      is_active: normalized.is_active,
    }

    const { data, error } = await supabase
      .from('bundles')
      .update(dbPayload)
      .eq('id', bundleId)
      .select()
      .single()

    if (!error && data) {
      const updated = normalizeBundle(data)
      const currentList = getLocalBundles()
      const nextList = currentList.map((b) => (b.id === String(bundleId) ? updated : b))
      saveLocalBundles(nextList)
      return updated
    }
  } catch (err) {
    console.warn('Failed to update bundle in Supabase, saving locally:', err)
  }

  // Local fallback
  const currentList = getLocalBundles()
  const nextList = currentList.map((b) => (b.id === String(bundleId) ? normalized : b))
  saveLocalBundles(nextList)
  return normalized
}

/**
 * Menghapus paket bundle
 */
export async function deleteBundle(bundleId) {
  try {
    await supabase.from('bundles').delete().eq('id', bundleId)
  } catch (err) {
    console.warn('Supabase bundle delete error:', err)
  }

  const currentList = getLocalBundles()
  const nextList = currentList.filter((b) => b.id !== String(bundleId))
  saveLocalBundles(nextList)
  return true
}
