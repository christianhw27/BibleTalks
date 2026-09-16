import { supabase } from '../lib/supabase'
import { getMasterCategories, getResolvedShowcaseCards } from './categoryService'

/**
 * Mengambil seluruh master kategori pakaian yang tersedia
 */
export async function getCategories() {
  return await getMasterCategories()
}

export { getResolvedShowcaseCards }

/**
 * Mengambil daftar produk untuk katalog (dengan filter kategori, tag, fitur, dan pencarian)
 */
export async function getProducts(options = {}) {
  const {
    categorySlug = null,
    tag = null,
    featuredOnly = false,
    search = '',
    limit = 20,
    offset = 0,
    sortBy = 'created_at',
    ascending = false,
  } = options

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      variants:product_variants(id, size, stock, sku)
    `)
    .neq('status', 'draft')

  if (categorySlug) {
    // Filter via category slug
    const { data: catData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (catData) {
      query = query.eq('category_id', catData.id)
    }
  }

  if (featuredOnly) {
    query = query.eq('is_featured', true)
  }

  if (tag) {
    query = query.contains('tags', [tag])
  }

  if (search && search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`)
  }

  query = query
    .order(sortBy, { ascending })
    .range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    throw error
  }

  return data || []
}

/**
 * Mengambil detail satu produk berdasarkan slug URL
 */
export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      variants:product_variants(id, size, stock, sku)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error(`Error fetching product by slug (${slug}):`, error)
    throw error
  }

  // Urutkan varian ukuran agar rapi: S, M, L, XL, XXL, All Size
  if (data?.variants?.length) {
    const sizeOrder = ['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'All Size', 'OS']
    data.variants.sort((a, b) => {
      const idxA = sizeOrder.indexOf(a.size)
      const idxB = sizeOrder.indexOf(b.size)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.size.localeCompare(b.size)
    })
  }

  return data
}

/**
 * Mengambil galeri lookbook / editorial collection
 */
export async function getLookbooks() {
  const { data, error } = await supabase
    .from('lookbooks')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching lookbooks:', error)
    throw error
  }

  return data || []
}

/**
 * Mengambil informasi brand dan pengaturan profil toko
 */
export async function getStoreSettings() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 'general')
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching store settings:', error)
  }

  return data || {
    brand_name: 'Bible Talk',
    tagline: 'Subculture & Contemporary Streetwear',
    whatsapp_number: '',
    announcement_bar: 'NEW ARRIVALS AVAILABLE',
  }
}

export { getBundles, DEFAULT_BUNDLES } from './bundleService'

