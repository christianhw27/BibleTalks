import { supabase } from '../lib/supabase'

const HOMEPAGE_SHOWCASE_KEY = 'bibletalks_homepage_showcase_cards'

export const DEFAULT_SHOWCASE_CARDS = [
  {
    id: 'showcase-outerwear',
    category_slug: 'hoodies-outerwear',
    title: 'Jackets & Outerwear',
    tag: '01 // OUTERWEAR',
    description: 'Zip hoodies 380 GSM, coaches jacket, dan rajut katun tebal.',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    badge: 'HOT DROP',
    button_text: 'Outerwear',
    sort_order: 1,
  },
  {
    id: 'showcase-tshirts',
    category_slug: 't-shirts',
    title: 'Heavyweight T-Shirts',
    tag: '02 // SIGNATURE CUT',
    description: 'Kaos katun 16s 235+ GSM kokoh berpotongan boxy drop-shoulder.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    badge: 'BESTSELLER',
    button_text: 'Kaos Boxy',
    sort_order: 2,
  },
  {
    id: 'showcase-accessories',
    category_slug: 'accessories',
    title: 'Aksesoris & Lain-Lain',
    tag: '03 // AKSESORIS & MORE',
    description: 'Topi corduroy 6-panel, beanie, tote bag kanvas, enamel pin, dan pelengkap gaya.',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    badge: 'ESSENTIALS',
    button_text: 'Aksesoris',
    sort_order: 3,
  },
  {
    id: 'showcase-bottoms',
    category_slug: 'pants-cargos',
    title: 'Pants & Cargos',
    tag: '04 // BOTTOMS',
    description: 'Utility parachute trousers, denim, dan relaxed cargo pants.',
    image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
    badge: 'STREET CUT',
    button_text: 'Celana & Cargo',
    sort_order: 4,
  },
]

// ==============================================================================
// 1. MASTER CATEGORIES (Supabase `categories` Table)
// ==============================================================================

/**
 * Mengambil daftar master kategori dari database
 */
export async function getMasterCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories from DB:', error)
    throw error
  }
  return data || []
}

/**
 * Menambahkan master kategori baru ke database
 */
export async function createCategory(data) {
  const payload = {
    name: data.name,
    slug: (data.slug || data.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-'),
    description: data.description || '',
    sort_order: Number(data.sort_order) || 0,
  }

  const { data: newCat, error } = await supabase
    .from('categories')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return newCat
}

/**
 * Menghapus master kategori dari database
 */
export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error
  return true
}

/**
 * Mengubah nama/slug/deskripsi master kategori
 */
export async function updateCategory(categoryId, data) {
  const payload = {
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    sort_order: Number(data.sort_order) || 0,
  }

  const { data: updatedCat, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) throw error
  return updatedCat
}

// ==============================================================================
// 2. HOMEPAGE COLLECTION SHOWCASE CARDS (Kategori Koleksi di Homepage)
// ==============================================================================

/**
 * Membaca kartu showcase koleksi untuk homepage yang sudah dikaitkan ke Master Kategori
 */
export function getLocalShowcaseCards() {
  if (typeof window === 'undefined') return DEFAULT_SHOWCASE_CARDS
  try {
    const raw = localStorage.getItem(HOMEPAGE_SHOWCASE_KEY)
    if (!raw) return DEFAULT_SHOWCASE_CARDS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SHOWCASE_CARDS
  } catch (err) {
    console.warn('Failed to parse showcase cards from localStorage:', err)
    return DEFAULT_SHOWCASE_CARDS
  }
}

/**
 * Menyimpan seluruh daftar kartu showcase ke localStorage
 */
export function saveLocalShowcaseCards(cards) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HOMEPAGE_SHOWCASE_KEY, JSON.stringify(cards))
  } catch (err) {
    console.warn('Failed to save showcase cards to localStorage:', err)
  }
}

/**
 * Mengambil daftar kartu showcase homepage dan mencocokkan dengan Master Kategori yang ada
 * @param {Array} categories - Daftar master categories dari DB
 */
export function getResolvedShowcaseCards(categories = []) {
  const rawCards = getLocalShowcaseCards()

  return rawCards.map((card, idx) => {
    // Cari master kategori yang cocok (berdasarkan category_id atau category_slug)
    const matchedCategory = categories.find(
      (c) => c.id === card.category_id || c.slug === card.category_slug
    )

    return {
      id: card.id || `showcase-${idx + 1}`,
      category_id: matchedCategory ? matchedCategory.id : card.category_id || '',
      category_slug: matchedCategory ? matchedCategory.slug : card.category_slug || '',
      category_name: matchedCategory ? matchedCategory.name : 'Kategori Tidak Ditemukan',
      title: card.title || (matchedCategory ? matchedCategory.name : 'Koleksi'),
      tag: card.tag || `0${idx + 1} // ${matchedCategory ? matchedCategory.name.toUpperCase() : 'COLLECTION'}`,
      description: card.description || (matchedCategory ? matchedCategory.description : ''),
      image: card.image || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      badge: card.badge || 'COLLECTION',
      button_text: card.button_text || (matchedCategory ? matchedCategory.name : 'Lihat'),
      sort_order: Number(card.sort_order) || idx + 1,
    }
  })
}

/**
 * Menyimpan perubahan pada satu kartu showcase homepage
 */
export function updateHomepageShowcaseCard(cardId, cardData, categories = []) {
  const cards = getResolvedShowcaseCards(categories)
  const idx = cards.findIndex((c) => c.id === cardId)

  // Cari kategori terkait untuk memastikan slug sinkron
  const matchedCategory = categories.find((c) => c.id === cardData.category_id)
  const categorySlug = matchedCategory ? matchedCategory.slug : cardData.category_slug

  const updatedItem = {
    ...cardData,
    id: cardId,
    category_slug: categorySlug,
    category_name: matchedCategory ? matchedCategory.name : cardData.category_name,
  }

  if (idx !== -1) {
    cards[idx] = updatedItem
  } else {
    cards.push(updatedItem)
  }

  // Sort by sort_order
  cards.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  saveLocalShowcaseCards(cards)
  return cards
}

/**
 * Menambah kartu showcase homepage baru
 */
export function addHomepageShowcaseCard(cardData, categories = []) {
  const cards = getResolvedShowcaseCards(categories)
  const newId = `showcase-${Date.now()}`
  
  const matchedCategory = categories.find((c) => c.id === cardData.category_id)
  const categorySlug = matchedCategory ? matchedCategory.slug : cardData.category_slug

  const newItem = {
    ...cardData,
    id: newId,
    category_slug: categorySlug,
    category_name: matchedCategory ? matchedCategory.name : '',
    sort_order: cards.length + 1,
  }

  cards.push(newItem)
  saveLocalShowcaseCards(cards)
  return cards
}

/**
 * Menghapus kartu showcase homepage
 */
export function deleteHomepageShowcaseCard(cardId, categories = []) {
  let cards = getResolvedShowcaseCards(categories)
  cards = cards.filter((c) => c.id !== cardId)
  saveLocalShowcaseCards(cards)
  return cards
}
