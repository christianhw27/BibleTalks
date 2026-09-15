import { supabase } from '../lib/supabase'

// ==============================================================================
// AUTHENTICATION
// ==============================================================================

export async function loginAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentAdmin() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

export async function getAdminSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) return null
  return session
}

// ==============================================================================
// PRODUCT CRUD (CMS)
// ==============================================================================

export async function adminGetProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name, slug),
      variants:product_variants(id, size, stock, sku)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createProduct(productData, variants = []) {
  // 1. Insert product
  const { data: product, error: prodError } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()

  if (prodError) throw prodError

  // 2. Insert variants jika ada
  if (variants && variants.length > 0) {
    const variantsPayload = variants.map((v) => ({
      product_id: product.id,
      size: v.size,
      stock: Number(v.stock) || 0,
      sku: v.sku || null,
    }))

    const { error: varError } = await supabase
      .from('product_variants')
      .insert(variantsPayload)

    if (varError) throw varError
  }

  return product
}

export async function updateProduct(productId, productData, variants = null) {
  // 1. Update product data
  const { data: updatedProduct, error: prodError } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .select()
    .single()

  if (prodError) throw prodError

  // 2. Sync variants jika disediakan
  if (variants !== null) {
    // Hapus varian lama lalu masukkan kembali (clean sync)
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId)

    if (variants.length > 0) {
      const variantsPayload = variants.map((v) => ({
        product_id: productId,
        size: v.size,
        stock: Number(v.stock) || 0,
        sku: v.sku || null,
      }))

      const { error: varError } = await supabase
        .from('product_variants')
        .insert(variantsPayload)

      if (varError) throw varError
    }
  }

  return updatedProduct
}

export async function deleteProduct(productId) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw error
  return true
}

export async function updateVariantStock(variantId, newStock) {
  const { data, error } = await supabase
    .from('product_variants')
    .update({ stock: Math.max(0, Number(newStock)) })
    .eq('id', variantId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ==============================================================================
// STORAGE & IMAGE UPLOADS
// ==============================================================================

/**
 * Mengunggah gambar ke Supabase Storage bucket
 * @param {File} file - Berkas gambar dari input file
 * @param {string} bucket - Nama bucket ('products' atau 'lookbooks')
 * @returns {string} Public URL gambar
 */
export async function uploadImage(file, bucket = 'products') {
  const fileExt = file.name.split('.').pop()
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_')
  const filePath = `${Date.now()}_${cleanFileName}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return publicUrl
}

/**
 * Menghapus gambar dari storage berdasarkan URL
 */
export async function deleteImage(imageUrl, bucket = 'products') {
  try {
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`)
    if (pathParts.length > 1) {
      const filePath = decodeURIComponent(pathParts[1])
      await supabase.storage.from(bucket).remove([filePath])
    }
  } catch (err) {
    console.warn('Gagal menghapus file dari storage:', err)
  }
}

// ==============================================================================
// CATEGORIES MANAGEMENT
// ==============================================================================

export async function createCategory(data) {
  const { data: newCat, error } = await supabase
    .from('categories')
    .insert([data])
    .select()
    .single()

  if (error) throw error
  return newCat
}

export async function deleteCategory(categoryId) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error
  return true
}

// ==============================================================================
// STORE SETTINGS UPDATE
// ==============================================================================

export async function updateStoreSettings(settings) {
  const { data, error } = await supabase
    .from('store_settings')
    .upsert({ id: 'general', ...settings })
    .select()
    .single()

  if (error) throw error
  return data
}

// ==============================================================================
// LOOKBOOKS MANAGEMENT
// ==============================================================================

export async function adminGetLookbooks() {
  const { data, error } = await supabase
    .from('lookbooks')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function updateLookbook(id, lookbookData) {
  const { data, error } = await supabase
    .from('lookbooks')
    .update(lookbookData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createLookbook(lookbookData) {
  const { data, error } = await supabase
    .from('lookbooks')
    .insert([lookbookData])
    .select()
    .single()

  if (error) throw error
  return data
}
