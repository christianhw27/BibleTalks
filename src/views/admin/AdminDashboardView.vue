<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useCatalogStore } from '../../stores/catalogStore'
import {
  adminGetProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  updateStoreSettings,
  adminGetLookbooks,
  updateLookbook,
  createLookbook,
  adminGetCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getResolvedShowcaseCards,
  updateHomepageShowcaseCard,
  addHomepageShowcaseCard,
  deleteHomepageShowcaseCard,
  getBundles,
  createBundle,
  updateBundle,
  deleteBundle,
} from '../../services/adminService'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Settings,
  Upload,
  X,
  Loader2,
  ExternalLink,
  Camera,
  Layers,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  LayoutGrid,
  FolderTree,
  Link as LinkIcon,
  Gift,
  Boxes,
  Eye,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const catalogStore = useCatalogStore()

const activeTab = ref('products') // 'products' | 'categories' | 'bundles' | 'settings' | 'lookbook'
const productsList = ref([])
const categoriesList = ref([])
const showcaseCardsList = ref([])
const bundlesList = ref([])
const loading = ref(false)
const actionLoading = ref(false)
const notification = ref({ type: '', text: '' })

// Master Category & Homepage Showcase State
const activeCategorySubTab = ref('showcase') // 'showcase' | 'master'

// Bundle State
const isBundleModalOpen = ref(false)
const isBundleEditing = ref(false)
const editBundleId = ref(null)
const isUploadingBundleImage = ref(false)

const bundleForm = ref({
  title: '',
  subtitle: '',
  originalPrice: 0,
  bundlePrice: 0,
  savingsText: '',
  badge: 'BEST VALUE',
  image: '',
  items: [{ name: '', detail: '' }],
  sort_order: 1,
  is_active: true,
})

const bundleBadgePresets = ['BEST VALUE', 'LIMITED DROP', 'COLD WEATHER', 'DAILY ESSENTIAL', 'SPECIAL SET', 'HOT DEAL']

// 1. Master Category Modal State
const isMasterCategoryModalOpen = ref(false)
const masterCategoryForm = ref({
  name: '',
  slug: '',
  description: '',
  sort_order: 1,
})

// 2. Homepage Showcase Card Modal State
const isShowcaseModalOpen = ref(false)
const isShowcaseEditing = ref(false)
const editShowcaseId = ref(null)
const isUploadingShowcaseImage = ref(false)

const showcaseForm = ref({
  category_id: '',
  category_slug: '',
  title: '',
  tag: '',
  description: '',
  image: '',
  badge: '',
  button_text: '',
  sort_order: 1,
})

const badgePresets = ['HOT DROP', 'BESTSELLER', 'ESSENTIALS', 'NEW MERCH', 'STREET CUT', 'LIMITED DROP']

function getProductCountForCategory(catId) {
  return productsList.value.filter((p) => p.category_id === catId || p.category?.id === catId).length
}

function isCategoryUsedInShowcase(cat) {
  return showcaseCardsList.value.some((c) => c.category_id === cat.id || c.category_slug === cat.slug)
}

// Modal Form State
const isModalOpen = ref(false)
const isEditing = ref(false)
const editProductId = ref(null)

const form = ref({
  title: '',
  slug: '',
  description: '',
  price: 0,
  category_id: '',
  status: 'active',
  is_featured: false,
  images: [],
  details: {
    material: '',
    fit: '',
    print: '',
    care: '',
    origin: 'Kabupaten Ngawi, Jawa Timur',
  },
  variants: [
    { size: 'S', stock: 10, sku: '' },
    { size: 'M', stock: 15, sku: '' },
    { size: 'L', stock: 15, sku: '' },
    { size: 'XL', stock: 5, sku: '' },
  ],
})

// Store Settings Form
const settingsForm = ref({
  brand_name: '',
  tagline: '',
  whatsapp_number: '',
  announcement_bar: '',
  about: '',
  address: '',
})

// Lookbook Form
const lookbookForm = ref({
  id: null,
  title: '',
  season: '',
  description: '',
  cover_image: '',
  gallery: [],
})
const isUploadingLookbookCover = ref(false)
const isUploadingLookbookGallery = ref(false)

function notify(text, type = 'success') {
  notification.value = { text, type }
  setTimeout(() => {
    notification.value = { text: '', type: '' }
  }, 4000)
}

async function loadAdminData() {
  loading.value = true
  try {
    await catalogStore.initStore()
    const [prods, books, cats, bundles] = await Promise.all([
      adminGetProducts(),
      adminGetLookbooks().catch(() => []),
      adminGetCategories().catch(() => []),
      getBundles().catch(() => []),
    ])
    productsList.value = prods
    categoriesList.value = cats
    showcaseCardsList.value = await getResolvedShowcaseCards(cats)
    bundlesList.value = bundles

    settingsForm.value = {
      brand_name: catalogStore.storeSettings.brand_name || '',
      tagline: catalogStore.storeSettings.tagline || '',
      whatsapp_number: catalogStore.storeSettings.whatsapp_number || '',
      announcement_bar: catalogStore.storeSettings.announcement_bar || '',
      about: catalogStore.storeSettings.about || '',
      address: catalogStore.storeSettings.address || 'Kabupaten Ngawi, Jawa Timur - Indonesia',
    }

    if (books && books.length > 0) {
      const current = books[0]
      lookbookForm.value = {
        id: current.id,
        title: current.title || '',
        season: current.season || '',
        description: current.description || '',
        cover_image: current.cover_image || '',
        gallery: Array.isArray(current.gallery)
          ? current.gallery.map((item) => {
              if (typeof item === 'string') {
                const trimmed = item.trim()
                if (trimmed.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(trimmed)
                    if (parsed.url) {
                      return { url: parsed.url, caption: parsed.caption || '' }
                    }
                  } catch (_) {}
                }
                return { url: trimmed, caption: '' }
              }
              return { url: item?.url || '', caption: item?.caption || '' }
            })
          : [],
      }
    }
  } catch (err) {
    console.error('Error loading admin data:', err)
    notify('Gagal memuat data: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
}

// ==============================================================================
// 1. MASTER CATEGORIES HANDLERS (Tambah & Hapus Kategori Pakaian)
// ==============================================================================

function openAddMasterCategoryModal() {
  masterCategoryForm.value = {
    name: '',
    slug: '',
    description: '',
    sort_order: categoriesList.value.length + 1,
  }
  isMasterCategoryModalOpen.value = true
}

function generateMasterCategorySlug() {
  if (masterCategoryForm.value.name) {
    masterCategoryForm.value.slug = masterCategoryForm.value.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
  }
}

async function handleSaveMasterCategory() {
  if (!masterCategoryForm.value.name) {
    notify('Mohon isi nama kategori!', 'error')
    return
  }

  actionLoading.value = true
  try {
    const payload = {
      name: masterCategoryForm.value.name,
      slug: (masterCategoryForm.value.slug || masterCategoryForm.value.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-'),
      description: masterCategoryForm.value.description || '',
      sort_order: Number(masterCategoryForm.value.sort_order) || categoriesList.value.length + 1,
    }

    await createCategory(payload)
    notify(`Kategori "${payload.name}" berhasil dibuat!`)
    isMasterCategoryModalOpen.value = false
    await catalogStore.refreshCategories()
    categoriesList.value = await adminGetCategories()
    showcaseCardsList.value = await getResolvedShowcaseCards(categoriesList.value)
  } catch (err) {
    console.error('Error creating category:', err)
    notify('Gagal membuat kategori: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteMasterCategory(cat) {
  const isUsed = productsList.value.some((p) => p.category_id === cat.id || p.category?.id === cat.id)
  const isUsedInShowcase = showcaseCardsList.value.some((c) => c.category_id === cat.id || c.category_slug === cat.slug)

  let warning = `Yakin ingin menghapus kategori "${cat.name}"?`
  if (isUsed && isUsedInShowcase) {
    warning = `Kategori "${cat.name}" sedang digunakan oleh beberapa produk pakaian dan juga ditampilkan di Homepage. Jika dihapus, produk tersebut akan menjadi Tanpa Kategori. Tetap hapus?`
  } else if (isUsed) {
    warning = `Kategori "${cat.name}" sedang digunakan oleh produk pakaian di katalog. Jika dihapus, produk tersebut menjadi Tanpa Kategori. Tetap hapus?`
  }

  if (!confirm(warning)) return

  actionLoading.value = true
  try {
    await deleteCategory(cat.id)
    notify(`Kategori "${cat.name}" berhasil dihapus!`)
    await catalogStore.refreshCategories()
    categoriesList.value = await adminGetCategories()
    showcaseCardsList.value = await getResolvedShowcaseCards(categoriesList.value)
  } catch (err) {
    console.error('Error deleting category:', err)
    notify('Gagal menghapus kategori: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==============================================================================
// 2. HOMEPAGE SHOWCASE CARDS HANDLERS (Kategori Koleksi di Homepage)
// ==============================================================================

function openEditShowcaseModal(card) {
  isShowcaseEditing.value = true
  editShowcaseId.value = card.id
  showcaseForm.value = {
    category_id: card.category_id || (categoriesList.value[0]?.id || ''),
    category_slug: card.category_slug || '',
    title: card.title || '',
    tag: card.tag || '',
    description: card.description || '',
    image: card.image || '',
    badge: card.badge || '',
    button_text: card.button_text || '',
    sort_order: card.sort_order || 1,
  }
  isShowcaseModalOpen.value = true
}

function openAddShowcaseModal() {
  isShowcaseEditing.value = false
  editShowcaseId.value = null
  const defaultCat = categoriesList.value[0] || null
  const nextOrder = showcaseCardsList.value.length + 1
  showcaseForm.value = {
    category_id: defaultCat?.id || '',
    category_slug: defaultCat?.slug || '',
    title: defaultCat?.name || '',
    tag: `0${nextOrder} // KOLEKSI BARU`,
    description: defaultCat?.description || '',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    badge: 'NEW DROP',
    button_text: defaultCat?.name || 'Koleksi',
    sort_order: nextOrder,
  }
  isShowcaseModalOpen.value = true
}

function onShowcaseCategoryChange() {
  const selectedCat = categoriesList.value.find((c) => c.id === showcaseForm.value.category_id)
  if (selectedCat) {
    showcaseForm.value.category_slug = selectedCat.slug
    if (!showcaseForm.value.title || !isShowcaseEditing.value) {
      showcaseForm.value.title = selectedCat.name
    }
    if (!showcaseForm.value.button_text || !isShowcaseEditing.value) {
      showcaseForm.value.button_text = selectedCat.name
    }
    if (!showcaseForm.value.description && selectedCat.description) {
      showcaseForm.value.description = selectedCat.description
    }
  }
}

async function handleShowcaseImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return

  isUploadingShowcaseImage.value = true
  try {
    const publicUrl = await uploadImage(file, 'products')
    showcaseForm.value.image = publicUrl
    notify('Foto kartu koleksi berhasil diunggah!')
  } catch (err) {
    notify('Gagal unggah foto: ' + err.message, 'error')
  } finally {
    isUploadingShowcaseImage.value = false
    e.target.value = ''
  }
}

async function handleSaveShowcaseCard() {
  if (!showcaseForm.value.category_id) {
    notify('Mohon pilih kategori yang ingin dihubungkan!', 'error')
    return
  }

  actionLoading.value = true
  try {
    if (isShowcaseEditing.value && editShowcaseId.value) {
      await updateHomepageShowcaseCard(editShowcaseId.value, showcaseForm.value, categoriesList.value)
      notify('Kartu Kategori Koleksi Homepage berhasil diperbarui!')
    } else {
      await addHomepageShowcaseCard(showcaseForm.value, categoriesList.value)
      notify('Kartu Kategori Koleksi Homepage berhasil ditambahkan!')
    }

    isShowcaseModalOpen.value = false
    await catalogStore.refreshCategories()
    showcaseCardsList.value = await getResolvedShowcaseCards(categoriesList.value)
  } catch (err) {
    console.error('Error saving showcase card:', err)
    notify('Gagal menyimpan kartu koleksi: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteShowcaseCard(card) {
  if (!confirm(`Hapus kartu koleksi "${card.title}" dari Homepage? (Kategori masternya tidak akan terhapus).`)) return

  await deleteHomepageShowcaseCard(card.id, categoriesList.value)
  notify(`Kartu koleksi "${card.title}" dihapus dari Homepage!`)
  await catalogStore.refreshCategories()
  showcaseCardsList.value = await getResolvedShowcaseCards(categoriesList.value)
}

onMounted(() => {
  loadAdminData()
})

// Open Add Modal
function openAddModal() {
  isEditing.value = false
  editProductId.value = null
  form.value = {
    title: '',
    slug: '',
    description: '',
    price: 185000,
    category_id: categoriesList.value[0]?.id || '',
    status: 'active',
    is_featured: false,
    images: [],
    details: {
      material: '100% Heavyweight Cotton 16s (235 GSM)',
      fit: 'Boxy Oversized with Drop Shoulder',
      print: 'High-Density Plastisol Discharge',
      care: 'Hand wash cold, do not iron on print',
      origin: 'Kabupaten Ngawi, Jawa Timur',
    },
    variants: [
      { size: 'S', stock: 10, sku: '' },
      { size: 'M', stock: 15, sku: '' },
      { size: 'L', stock: 15, sku: '' },
      { size: 'XL', stock: 5, sku: '' },
    ],
  }
  isModalOpen.value = true
}

// Open Edit Modal
function openEditModal(prod) {
  isEditing.value = true
  editProductId.value = prod.id
  form.value = {
    title: prod.title,
    slug: prod.slug,
    description: prod.description || '',
    price: Number(prod.price),
    category_id: prod.category_id || '',
    status: prod.status || 'active',
    is_featured: Boolean(prod.is_featured),
    images: Array.isArray(prod.images) ? [...prod.images] : [],
    details: {
      material: prod.details?.material || '',
      fit: prod.details?.fit || '',
      print: prod.details?.print || '',
      care: prod.details?.care || '',
      origin: prod.details?.origin || 'Bandung, ID',
    },
    variants: prod.variants?.length
      ? prod.variants.map((v) => ({ size: v.size, stock: v.stock, sku: v.sku || '' }))
      : [
          { size: 'S', stock: 0, sku: '' },
          { size: 'M', stock: 0, sku: '' },
          { size: 'L', stock: 0, sku: '' },
          { size: 'XL', stock: 0, sku: '' },
        ],
  }
  isModalOpen.value = true
}

// Auto-generate slug from title
function generateSlug() {
  if (!isEditing.value && form.value.title) {
    form.value.slug = form.value.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
  }
}

// Image upload handling
const isUploadingImage = ref(false)
async function handleImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return

  isUploadingImage.value = true
  try {
    const publicUrl = await uploadImage(file, 'products')
    form.value.images.push(publicUrl)
    notify('Foto pakaian berhasil diunggah ke Supabase Storage!')
  } catch (err) {
    console.error('Error uploading image:', err)
    notify('Gagal mengunggah foto: ' + err.message, 'error')
  } finally {
    isUploadingImage.value = false
    e.target.value = ''
  }
}

function removeImage(index) {
  form.value.images.splice(index, 1)
}

// Save Product (Create or Update)
async function handleSaveProduct() {
  if (!form.value.title || !form.value.slug || !form.value.price) {
    notify('Mohon lengkapi judul, slug URL, dan harga!', 'error')
    return
  }

  actionLoading.value = true
  try {
    const productPayload = {
      title: form.value.title,
      slug: form.value.slug,
      description: form.value.description,
      price: Number(form.value.price),
      category_id: form.value.category_id || null,
      status: form.value.status,
      is_featured: form.value.is_featured,
      images: form.value.images,
      details: form.value.details,
    }

    if (isEditing.value) {
      await updateProduct(editProductId.value, productPayload, form.value.variants)
      notify('Artikel pakaian berhasil diperbarui!')
    } else {
      await createProduct(productPayload, form.value.variants)
      notify('Artikel pakaian baru berhasil ditambahkan!')
    }

    isModalOpen.value = false
    await loadAdminData()
    await catalogStore.refreshProducts()
  } catch (err) {
    console.error('Error saving product:', err)
    notify('Gagal menyimpan: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// Delete Product
async function handleDeleteProduct(prod) {
  if (!confirm(`Hapus pakaian "${prod.title}" dari katalog? Tindakan ini tidak bisa dibatalkan.`)) {
    return
  }

  actionLoading.value = true
  try {
    await deleteProduct(prod.id)
    notify('Produk telah dihapus.')
    await loadAdminData()
    await catalogStore.refreshProducts()
  } catch (err) {
    notify('Gagal menghapus: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// Save Store Settings
async function handleSaveSettings() {
  actionLoading.value = true
  try {
    await updateStoreSettings(settingsForm.value)
    catalogStore.storeSettings = { ...catalogStore.storeSettings, ...settingsForm.value }
    notify('Pengaturan toko berhasil diperbarui!')
  } catch (err) {
    notify('Gagal memperbarui pengaturan: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==============================================================================
// LOOKBOOK ACTIONS
// ==============================================================================

async function handleLookbookCoverUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  isUploadingLookbookCover.value = true
  try {
    const publicUrl = await uploadImage(file, 'lookbooks')
    lookbookForm.value.cover_image = publicUrl
    notify('Foto cover lookbook berhasil diunggah!')
  } catch (err) {
    notify('Gagal unggah foto cover: ' + err.message, 'error')
  } finally {
    isUploadingLookbookCover.value = false
    e.target.value = ''
  }
}

async function handleLookbookGalleryUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  isUploadingLookbookGallery.value = true
  try {
    const publicUrl = await uploadImage(file, 'lookbooks')
    lookbookForm.value.gallery.push({ url: publicUrl, caption: '' })
    notify('Foto editorial berhasil ditambahkan ke galeri!')
  } catch (err) {
    notify('Gagal unggah foto galeri: ' + err.message, 'error')
  } finally {
    isUploadingLookbookGallery.value = false
    e.target.value = ''
  }
}

function removeLookbookGalleryImage(idx) {
  lookbookForm.value.gallery.splice(idx, 1)
}

async function handleSaveLookbook() {
  if (!lookbookForm.value.title) {
    notify('Mohon isi judul lookbook!', 'error')
    return
  }

  actionLoading.value = true
  try {
    // Format array gallery: jika ada caption simpan JSON string, jika tidak simpan URL string murni
    const processedGallery = (lookbookForm.value.gallery || [])
      .filter((g) => g && (g.url || typeof g === 'string'))
      .map((g) => {
        const url = typeof g === 'string' ? g : g.url
        const caption = typeof g === 'string' ? '' : (g.caption || '').trim()
        if (caption) {
          return JSON.stringify({ url, caption })
        }
        return url
      })

    const payload = {
      title: lookbookForm.value.title,
      slug: (lookbookForm.value.title || 'drop-01')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-'),
      season: lookbookForm.value.season,
      description: lookbookForm.value.description,
      cover_image: lookbookForm.value.cover_image,
      gallery: processedGallery,
      is_active: true,
    }

    if (lookbookForm.value.id) {
      await updateLookbook(lookbookForm.value.id, payload)
    } else {
      const created = await createLookbook(payload)
      lookbookForm.value.id = created.id
    }

    notify('Editorial Lookbook berhasil diperbarui!')
    // Update store state so homepage and lookbook view immediately reflect it
    await catalogStore.initStore()
    const updatedBooks = await adminGetLookbooks().catch(() => [])
    catalogStore.lookbooks = updatedBooks
  } catch (err) {
    notify('Gagal menyimpan lookbook: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==============================================================================
// BUNDLE PACKAGES ACTIONS
// ==============================================================================

function updateBundleSavingsText() {
  const orig = Number(bundleForm.value.originalPrice) || 0
  const bPrice = Number(bundleForm.value.bundlePrice) || 0
  if (orig > bPrice) {
    bundleForm.value.savingsText = `Hemat Rp${(orig - bPrice).toLocaleString('id-ID')}`
  }
}

function openAddBundleModal() {
  isBundleEditing.value = false
  editBundleId.value = null
  bundleForm.value = {
    title: '',
    subtitle: '',
    originalPrice: 300000,
    bundlePrice: 250000,
    savingsText: 'Hemat Rp50.000',
    badge: 'BEST VALUE',
    image: '',
    items: [
      { name: '', detail: '' }
    ],
    sort_order: bundlesList.value.length + 1,
    is_active: true,
  }
  isBundleModalOpen.value = true
}

function openEditBundleModal(bundle) {
  isBundleEditing.value = true
  editBundleId.value = bundle.id
  bundleForm.value = {
    title: bundle.title,
    subtitle: bundle.subtitle || '',
    originalPrice: Number(bundle.originalPrice || 0),
    bundlePrice: Number(bundle.bundlePrice || 0),
    savingsText: bundle.savingsText || '',
    badge: bundle.badge || 'BEST VALUE',
    image: bundle.image || '',
    items: Array.isArray(bundle.items) && bundle.items.length > 0
      ? bundle.items.map((i) => ({ name: i.name || '', detail: i.detail || '' }))
      : [{ name: '', detail: '' }],
    sort_order: Number(bundle.sort_order || 1),
    is_active: bundle.is_active !== false,
  }
  isBundleModalOpen.value = true
}

function addBundleItem() {
  bundleForm.value.items.push({ name: '', detail: '' })
}

function removeBundleItem(index) {
  if (bundleForm.value.items.length <= 1) {
    bundleForm.value.items[0] = { name: '', detail: '' }
    return
  }
  bundleForm.value.items.splice(index, 1)
}

async function handleBundleImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return

  isUploadingBundleImage.value = true
  try {
    const publicUrl = await uploadImage(file, 'products')
    bundleForm.value.image = publicUrl
    notify('Foto paket bundle berhasil diunggah!')
  } catch (err) {
    console.error('Error uploading bundle image:', err)
    notify('Gagal mengunggah foto bundle: ' + err.message, 'error')
  } finally {
    isUploadingBundleImage.value = false
    e.target.value = ''
  }
}

async function handleSaveBundle() {
  if (!bundleForm.value.title) {
    notify('Mohon isi judul paket bundle!', 'error')
    return
  }

  actionLoading.value = true
  try {
    const cleanItems = bundleForm.value.items
      .filter((i) => i.name && i.name.trim() !== '')
      .map((i) => ({ name: i.name.trim(), detail: i.detail ? i.detail.trim() : '' }))

    const payload = {
      title: bundleForm.value.title.trim(),
      subtitle: bundleForm.value.subtitle?.trim() || '',
      originalPrice: Number(bundleForm.value.originalPrice) || 0,
      bundlePrice: Number(bundleForm.value.bundlePrice) || 0,
      savingsText: bundleForm.value.savingsText?.trim() || '',
      badge: bundleForm.value.badge?.trim() || 'BEST VALUE',
      image: bundleForm.value.image?.trim() || '',
      items: cleanItems,
      sort_order: Number(bundleForm.value.sort_order) || 1,
      is_active: bundleForm.value.is_active,
    }

    if (isBundleEditing.value && editBundleId.value) {
      await updateBundle(editBundleId.value, payload)
      notify(`Paket bundle "${payload.title}" berhasil diperbarui!`)
    } else {
      await createBundle(payload)
      notify(`Paket bundle baru "${payload.title}" berhasil ditambahkan!`)
    }

    isBundleModalOpen.value = false
    await catalogStore.refreshBundles()
    bundlesList.value = await getBundles()
  } catch (err) {
    console.error('Error saving bundle:', err)
    notify('Gagal menyimpan bundle: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteBundle(bundle) {
  if (!confirm(`Yakin ingin menghapus paket bundle "${bundle.title}"?`)) return

  actionLoading.value = true
  try {
    await deleteBundle(bundle.id)
    notify(`Paket bundle "${bundle.title}" telah dihapus!`)
    await catalogStore.refreshBundles()
    bundlesList.value = await getBundles()
  } catch (err) {
    console.error('Error deleting bundle:', err)
    notify('Gagal menghapus bundle: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// Logout
async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
    
    <!-- TOP HEADER -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-300 pb-6">
      <div>
        <div class="flex items-center gap-2 font-mono text-xs text-brand-500 uppercase tracking-widest mb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>BIBLE TALKS // CMS MANAGEMENT</span>
        </div>
        <h1 class="font-serif font-bold text-2xl sm:text-3xl text-brand-950 uppercase">
          Katalog Pakaian & Stok
        </h1>
        <p class="font-mono text-xs text-brand-600 mt-1">
          Logged in as: <span class="text-brand-900 font-semibold">{{ authStore.user?.email || 'Admin' }}</span>
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link
          to="/"
          target="_blank"
          class="px-4 py-2 text-xs font-mono bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 rounded flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <ExternalLink class="w-3.5 h-3.5" />
          <span>Lihat Website</span>
        </router-link>

        <button
          @click="handleLogout"
          class="px-4 py-2 text-xs font-mono bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded flex items-center gap-1.5 transition-colors font-medium"
        >
          <LogOut class="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>

    <!-- NOTIFICATION TOAST -->
    <div
      v-if="notification.text"
      class="p-4 rounded text-xs font-mono flex items-center justify-between transition-all shadow-sm"
      :class="notification.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'"
    >
      <span>{{ notification.text }}</span>
      <button @click="notification.text = ''"><X class="w-4 h-4" /></button>
    </div>

    <!-- STATS OVERVIEW CARDS -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-5 bg-white border border-brand-300 rounded shadow-sm">
        <span class="font-mono text-[11px] text-brand-500 uppercase">Total Artikel</span>
        <div class="font-serif font-bold text-3xl text-brand-950 mt-1">
          {{ productsList.length }}
        </div>
      </div>

      <div class="p-5 bg-white border border-brand-300 rounded shadow-sm">
        <span class="font-mono text-[11px] text-brand-500 uppercase">Kategori Aktif</span>
        <div class="font-serif font-bold text-3xl text-brand-950 mt-1">
          {{ catalogStore.categories.length }}
        </div>
      </div>

      <div class="p-5 bg-white border border-brand-300 rounded shadow-sm">
        <span class="font-mono text-[11px] text-brand-500 uppercase">Signature Drops</span>
        <div class="font-serif font-bold text-3xl text-brand-950 mt-1">
          {{ productsList.filter(p => p.is_featured).length }}
        </div>
      </div>

      <div class="p-5 bg-white border border-brand-300 rounded shadow-sm">
        <span class="font-mono text-[11px] text-brand-500 uppercase">WhatsApp CS Channel</span>
        <div class="font-mono text-xs font-semibold text-emerald-700 mt-2 truncate">
          {{ catalogStore.storeSettings.whatsapp_number || 'Belum diisi' }}
        </div>
      </div>
    </div>

    <!-- TABS BAR -->
    <div class="flex items-center gap-6 border-b border-brand-300 font-mono text-xs overflow-x-auto">
      <button
        @click="activeTab = 'products'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
        :class="activeTab === 'products' ? 'border-brand-900 text-brand-950 font-bold' : 'border-transparent text-brand-500 hover:text-brand-800'"
      >
        <Package class="w-4 h-4" />
        <span>Katalog Pakaian ({{ productsList.length }})</span>
      </button>

      <button
        @click="activeTab = 'categories'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
        :class="activeTab === 'categories' ? 'border-brand-900 text-brand-950 font-bold' : 'border-transparent text-brand-500 hover:text-brand-800'"
      >
        <Layers class="w-4 h-4" />
        <span>Kategori Koleksi ({{ categoriesList.length }})</span>
      </button>

      <button
        @click="activeTab = 'bundles'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
        :class="activeTab === 'bundles' ? 'border-brand-900 text-brand-950 font-bold' : 'border-transparent text-brand-500 hover:text-brand-800'"
      >
        <Boxes class="w-4 h-4" />
        <span>Paket Bundling ({{ bundlesList.length }})</span>
      </button>

      <button
        @click="activeTab = 'settings'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
        :class="activeTab === 'settings' ? 'border-brand-900 text-brand-950 font-bold' : 'border-transparent text-brand-500 hover:text-brand-800'"
      >
        <Settings class="w-4 h-4" />
        <span>Profil Brand & WhatsApp</span>
      </button>

      <button
        @click="activeTab = 'lookbook'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
        :class="activeTab === 'lookbook' ? 'border-brand-900 text-brand-950 font-bold' : 'border-transparent text-brand-500 hover:text-brand-800'"
      >
        <Camera class="w-4 h-4" />
        <span>Editorial Lookbook</span>
      </button>
    </div>

    <!-- TAB 1: PRODUCTS LIST TABLE -->
    <div v-if="activeTab === 'products'" class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs text-brand-600">
          Daftar pakaian, kelola varian ukuran, dan unggah foto langsung dari browser.
        </span>
        <button
          @click="openAddModal"
          class="px-4 py-2.5 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-semibold rounded flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Artikel Pakaian</span>
        </button>
      </div>

      <!-- Table Box -->
      <div class="bg-white border border-brand-300 rounded shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left font-sans text-xs">
            <thead class="bg-brand-100/70 text-brand-700 font-mono uppercase border-b border-brand-300">
              <tr>
                <th class="p-3.5">Artikel Pakaian</th>
                <th class="p-3.5">Kategori</th>
                <th class="p-3.5">Harga</th>
                <th class="p-3.5">Stok per Ukuran</th>
                <th class="p-3.5">Status</th>
                <th class="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-200 text-brand-800">
              <tr v-if="productsList.length === 0">
                <td colspan="6" class="p-10 text-center text-brand-500 font-mono">
                  Belum ada produk di database. Klik tombol "Tambah Artikel Pakaian" untuk membuat koleksi baru.
                </td>
              </tr>
              <tr
                v-for="prod in productsList"
                :key="prod.id"
                class="hover:bg-brand-50 transition-colors"
              >
                <!-- Image & Title -->
                <td class="p-3.5 flex items-center gap-3">
                  <img
                    :src="prod.images?.[0] || 'https://via.placeholder.com/80'"
                    :alt="prod.title"
                    class="w-12 h-14 object-cover rounded bg-brand-100 border border-brand-300 flex-shrink-0"
                  />
                  <div>
                    <span class="font-serif font-bold text-brand-950 block text-sm">{{ prod.title }}</span>
                    <span class="font-mono text-[10px] text-brand-500">/{{ prod.slug }}</span>
                  </div>
                </td>

                <!-- Category -->
                <td class="p-3.5 font-mono text-brand-600">
                  {{ prod.category?.name || 'Uncategorized' }}
                </td>

                <!-- Price -->
                <td class="p-3.5 font-mono font-semibold text-brand-950">
                  {{ catalogStore.formatPrice(prod.price) }}
                </td>

                <!-- Variants / Stock Summary -->
                <td class="p-3.5 font-mono">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-for="v in prod.variants"
                      :key="v.id"
                      class="px-1.5 py-0.5 rounded text-[10px] border"
                      :class="v.stock > 0 ? 'bg-brand-100 text-brand-800 border-brand-300' : 'bg-rose-50 text-rose-700 border-rose-200'"
                    >
                      {{ v.size }}: {{ v.stock }}
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td class="p-3.5">
                  <span
                    class="px-2.5 py-0.5 rounded font-mono text-[10px] uppercase font-semibold border"
                    :class="[
                      prod.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      prod.status === 'sold_out' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                      'bg-brand-100 text-brand-600 border-brand-300'
                    ]"
                  >
                    {{ prod.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="p-3.5 text-right space-x-2">
                  <button
                    @click="openEditModal(prod)"
                    class="p-1.5 text-brand-600 hover:text-brand-900 bg-brand-100 hover:bg-brand-200 border border-brand-300 rounded shadow-sm"
                    title="Edit Produk"
                  >
                    <Edit class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDeleteProduct(prod)"
                    class="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded shadow-sm"
                    title="Hapus Produk"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: STORE SETTINGS & WHATSAPP -->
    <div v-else-if="activeTab === 'settings'" class="max-w-2xl bg-white border border-brand-300 rounded shadow-sm p-6 space-y-6">
      <h2 class="font-serif font-bold text-lg text-brand-950 uppercase">
        Profil Brand & Kontak Pemesanan
      </h2>

      <form @submit.prevent="handleSaveSettings" class="space-y-4 font-sans text-xs">
        <div class="space-y-1">
          <label class="block font-mono text-brand-700 uppercase">Nama Brand Pakaian</label>
          <input
            v-model="settingsForm.brand_name"
            type="text"
            required
            class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-medium"
          />
        </div>

        <div class="space-y-1">
          <label class="block font-mono text-brand-700 uppercase">Tagline / Slogan</label>
          <input
            v-model="settingsForm.tagline"
            type="text"
            class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950"
          />
        </div>

        <div class="space-y-1">
          <label class="block font-mono text-brand-700 uppercase">Nomor WhatsApp CS (Tanpa simbol +)</label>
          <input
            v-model="settingsForm.whatsapp_number"
            type="text"
            placeholder="6281234567890"
            required
            class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
          />
          <p class="text-[11px] text-brand-500 font-mono">
            Format kode negara, misal: 6281234567890. Tombol pemesanan di detail produk akan langsung mengarah ke nomor ini.
          </p>
        </div>

        <div class="space-y-1">
          <label class="block font-mono text-brand-700 uppercase">Teks Announcement Bar (Running Text)</label>
          <input
            v-model="settingsForm.announcement_bar"
            type="text"
            class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950"
          />
        </div>

        <div class="space-y-1">
          <label class="block font-mono text-brand-700 uppercase">Tentang Brand (Bio / Manifesto)</label>
          <textarea
            v-model="settingsForm.about"
            rows="3"
            class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 leading-relaxed"
          ></textarea>
        </div>

        <div class="space-y-1">
          <label class="block font-mono text-brand-700 uppercase">Lokasi Produksi / Alamat Workshop</label>
          <input
            v-model="settingsForm.address"
            type="text"
            placeholder="Kabupaten Ngawi, Jawa Timur - Indonesia"
            class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950"
          />
        </div>

        <button
          type="submit"
          :disabled="actionLoading"
          class="px-6 py-2.5 bg-brand-900 hover:bg-brand-800 text-white font-mono uppercase font-bold rounded flex items-center gap-2 shadow"
        >
          <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
          <span>Simpan Perubahan</span>
        </button>
      </form>
    </div>

    <!-- TAB 3: EDITORIAL LOOKBOOK MANAGEMENT -->
    <div v-else-if="activeTab === 'lookbook'" class="max-w-3xl bg-white border border-brand-300 rounded shadow-sm p-6 space-y-8">
      <div>
        <h2 class="font-serif font-bold text-xl text-brand-950 uppercase tracking-tight">
          Kelola Editorial Lookbook & Banner
        </h2>
        <p class="text-xs text-brand-600 font-sans mt-1">
          Ubah judul koleksi, narasi cerita, foto cover utama, serta galeri foto model yang tampil di Beranda dan halaman Lookbook.
        </p>
      </div>

      <form @submit.prevent="handleSaveLookbook" class="space-y-6 font-sans text-xs">
        
        <!-- Title & Season -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Judul Koleksi Lookbook *</label>
            <input
              v-model="lookbookForm.title"
              type="text"
              required
              placeholder="Drop 01 // Genesis & Concrete Youth"
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-medium"
            />
          </div>

          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Tagline Season *</label>
            <input
              v-model="lookbookForm.season"
              type="text"
              required
              placeholder="SEASON 2026 EDITORIAL"
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-1">
          <label class="block font-mono text-brand-700 uppercase">Deskripsi Editorial / Narasi Koleksi</label>
          <textarea
            v-model="lookbookForm.description"
            rows="3"
            placeholder="Jelaskan vibe dan pesan di balik sesi pemotretan baju..."
            class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 leading-relaxed font-sans"
          ></textarea>
        </div>

        <!-- Cover Image Uploader -->
        <div class="space-y-3 border-t border-brand-200 pt-5">
          <label class="block font-mono text-brand-900 uppercase font-semibold">Foto Cover Utama (Hero Banner Lookbook)</label>
          
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              v-if="lookbookForm.cover_image"
              :src="lookbookForm.cover_image"
              alt="Cover Preview"
              class="w-32 h-20 object-cover rounded border border-brand-300 shadow-sm bg-brand-100"
            />
            <div class="space-y-2">
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-brand-50 border border-brand-300 rounded text-brand-900 font-mono text-xs shadow-sm">
                <Upload class="w-4 h-4 text-brand-600" />
                <span>{{ isUploadingLookbookCover ? 'Mengunggah Cover...' : 'Ganti Foto Cover' }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="isUploadingLookbookCover"
                  @change="handleLookbookCoverUpload"
                />
              </label>
              <p class="text-[11px] text-brand-500 font-mono">Disarankan rasio lanskap (16:9 atau foto horizontal lebar).</p>
            </div>
          </div>
        </div>

        <!-- Gallery Uploader -->
        <div class="space-y-3 border-t border-brand-200 pt-5">
          <div class="flex items-center justify-between">
            <div>
              <label class="block font-mono text-brand-900 uppercase font-semibold">Galeri Foto Editorial (Tampil di Home & Lookbook)</label>
              <p class="text-[11px] text-brand-500 font-mono">Foto model baju tampak depan, samping, dan detail.</p>
            </div>
            
            <label class="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-100 hover:bg-brand-200 border border-brand-300 rounded text-brand-800 font-mono text-xs">
              <Plus class="w-3.5 h-3.5" />
              <span>{{ isUploadingLookbookGallery ? 'Mengunggah...' : 'Tambah Foto' }}</span>
              <input
                type="file"
                accept="image/*"
                class="hidden"
                :disabled="isUploadingLookbookGallery"
                @change="handleLookbookGalleryUpload"
              />
            </label>
          </div>

          <!-- Gallery Photos Grid -->
          <div v-if="lookbookForm.gallery && lookbookForm.gallery.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div
              v-for="(item, idx) in lookbookForm.gallery"
              :key="idx"
              class="bg-brand-50/70 border border-brand-300 rounded-lg overflow-hidden flex flex-col justify-between shadow-sm"
            >
              <!-- Media Box -->
              <div class="relative aspect-[4/3] bg-brand-100 overflow-hidden group">
                <img :src="typeof item === 'string' ? item : item.url" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="removeLookbookGalleryImage(idx)"
                  class="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full shadow transition-colors"
                  title="Hapus Foto Ini"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
                <span class="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded">
                  Foto #{{ idx + 1 }}
                </span>
              </div>

              <!-- Optional Caption Box -->
              <div class="p-3 space-y-1.5 bg-white border-t border-brand-200">
                <div class="flex items-center justify-between">
                  <label class="text-[10px] font-mono text-brand-700 uppercase font-semibold">Caption Foto (Opsional)</label>
                  <span class="text-[9px] font-mono text-brand-400">Kosongkan jika tanpa caption</span>
                </div>
                <input
                  v-if="typeof item === 'object'"
                  v-model="item.caption"
                  type="text"
                  placeholder="Misal: Heavy Boxy Cut / Tampak Belakang..."
                  class="w-full px-2.5 py-1.5 bg-brand-50 border border-brand-300 rounded text-brand-950 text-xs font-mono placeholder:text-brand-400"
                />
              </div>
            </div>
          </div>
          <div v-else class="p-8 border border-dashed border-brand-300 rounded text-center font-mono text-xs text-brand-500">
            Belum ada foto galeri lookbook. Klik tombol "+ Tambah Foto" di atas untuk menambahkan.
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-4 border-t border-brand-200 flex justify-end">
          <button
            type="submit"
            :disabled="actionLoading || isUploadingLookbookCover || isUploadingLookbookGallery"
            class="px-8 py-3 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-bold tracking-widest rounded flex items-center gap-2 shadow-md transition-all"
          >
            <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
            <span>Simpan Perubahan Lookbook</span>
          </button>
        </div>

      </form>
    </div>

    <!-- TAB 4: KATEGORI & KOLEKSI HOMEPAGE -->
    <div v-else-if="activeTab === 'categories'" class="space-y-6">
      
      <!-- Top Header -->
      <div class="border-b border-brand-300 pb-4">
        <h2 class="font-serif font-bold text-xl text-brand-950 uppercase tracking-tight">
          Kategori Pakaian & Koleksi Homepage
        </h2>
        <p class="text-xs text-brand-600 font-sans mt-0.5">
          Kelola master kategori pakaian untuk produk di katalog, dan atur kartu showcase "Kategori Koleksi" yang tampil di Beranda.
        </p>
      </div>

      <!-- Sub-Tab Navigation Pills -->
      <div class="flex items-center gap-3 border-b border-brand-200 pb-3">
        <button
          type="button"
          @click="activeCategorySubTab = 'showcase'"
          class="px-4 py-2 text-xs font-mono rounded-md flex items-center gap-2 transition-all font-semibold shadow-xs"
          :class="activeCategorySubTab === 'showcase' ? 'bg-brand-900 text-white' : 'bg-white text-brand-700 border border-brand-300 hover:bg-brand-100'"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span>✦ Kartu Koleksi Homepage ({{ showcaseCardsList.length }})</span>
        </button>

        <button
          type="button"
          @click="activeCategorySubTab = 'master'"
          class="px-4 py-2 text-xs font-mono rounded-md flex items-center gap-2 transition-all font-semibold shadow-xs"
          :class="activeCategorySubTab === 'master' ? 'bg-brand-900 text-white' : 'bg-white text-brand-700 border border-brand-300 hover:bg-brand-100'"
        >
          <FolderTree class="w-3.5 h-3.5" />
          <span>📁 Master Kategori Pakaian ({{ categoriesList.length }})</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 1: HOMEPAGE SHOWCASE CARDS (Koleksi Beranda Berdasarkan Kategori)     -->
      <!-- ========================================================================= -->
      <div v-if="activeCategorySubTab === 'showcase'" class="space-y-6">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-100/50 p-4 rounded-lg border border-brand-300">
          <div>
            <span class="font-mono text-xs font-bold text-brand-900 uppercase block">
              Pengaturan Kartu Koleksi di Homepage
            </span>
            <p class="text-[11px] text-brand-600 mt-0.5">
              Setiap kartu di bawah ini terhubung ke salah satu <strong>Master Kategori</strong>. Anda bisa mengubah kategori yang dihubungkan, foto editorial, badge (HOT DROP, BESTSELLER), sub-tag, dan tombol aksi.
            </p>
          </div>

          <button
            type="button"
            @click="openAddShowcaseModal"
            class="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-semibold rounded flex items-center gap-2 shadow-sm transition-colors flex-shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Kartu Koleksi</span>
          </button>
        </div>

        <!-- Showcase Cards Grid (Preview exact homepage card look!) -->
        <div v-if="showcaseCardsList.length === 0" class="p-12 text-center bg-white border border-brand-300 rounded font-mono text-xs text-brand-500">
          Belum ada kartu koleksi untuk Homepage. Klik "+ Tambah Kartu Koleksi" untuk menambahkan.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="card in showcaseCardsList"
            :key="card.id"
            class="group relative bg-white border border-brand-300 rounded overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <!-- Image Frame -->
              <div class="relative aspect-[4/5] overflow-hidden bg-brand-100">
                <img
                  :src="card.image"
                  :alt="card.title"
                  class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                <!-- Top Badge -->
                <div class="absolute top-3 left-3">
                  <span class="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase bg-white/95 text-brand-900 font-semibold rounded shadow-sm">
                    {{ card.badge || 'COLLECTION' }}
                  </span>
                </div>

                <!-- Sort Order Badge -->
                <div class="absolute top-3 right-3">
                  <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-black/60 text-white rounded">
                    #{{ card.sort_order }}
                  </span>
                </div>

                <!-- Bottom Floating Overlay Title -->
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <span class="font-mono text-[10px] uppercase tracking-widest text-scripture-sand block mb-0.5">
                    {{ card.tag || 'SHOWCASE' }}
                  </span>
                  <h3 class="font-serif font-bold text-xl uppercase leading-tight tracking-wide drop-shadow-sm">
                    {{ card.title }}
                  </h3>
                </div>
              </div>

              <!-- Linked Category Banner -->
              <div class="px-3.5 py-2 bg-emerald-50 border-b border-emerald-200/70 text-[11px] font-mono text-emerald-900 flex items-center gap-1.5">
                <LinkIcon class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span class="truncate">
                  Kategori: <strong>{{ card.category_name }}</strong> (<code>/{{ card.category_slug }}</code>)
                </span>
              </div>

              <!-- Meta & Description -->
              <div class="p-4 space-y-3 bg-white">
                <p class="text-xs text-brand-600 leading-relaxed font-sans line-clamp-2">
                  {{ card.description || 'Tidak ada deskripsi' }}
                </p>

                <div class="flex items-center justify-between text-[11px] font-mono text-brand-500 border-t border-brand-100 pt-2">
                  <span>Tombol Homepage:</span>
                  <span class="text-scripture-bronze font-semibold">"Jelajahi {{ card.button_text }}"</span>
                </div>
              </div>
            </div>

            <!-- Card Action Buttons -->
            <div class="p-3 bg-brand-50/80 border-t border-brand-200 flex items-center justify-end gap-2">
              <button
                @click="openEditShowcaseModal(card)"
                class="px-3 py-1.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-mono rounded flex items-center gap-1 shadow-xs transition-colors"
                title="Edit Tampilan & Kategori Terkait"
              >
                <Edit class="w-3.5 h-3.5" />
                <span>Edit Kartu</span>
              </button>
              <button
                @click="handleDeleteShowcaseCard(card)"
                class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition-colors"
                title="Hapus Kartu Koleksi"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 2: MASTER CATEGORIES TABLE (Kelola Kategori Pakaian)                  -->
      <!-- ========================================================================= -->
      <div v-else-if="activeCategorySubTab === 'master'" class="space-y-4">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-100/50 p-4 rounded-lg border border-brand-300">
          <div>
            <span class="font-mono text-xs font-bold text-brand-900 uppercase block">
              Daftar Master Kategori Pakaian
            </span>
            <p class="text-[11px] text-brand-600 mt-0.5">
              Daftar kategori utama yang digunakan saat membuat/mengedit pakaian di Katalog. Kategori yang Anda tambahkan di sini bisa langsung dipilih pada produk dan kartu koleksi Homepage.
            </p>
          </div>

          <button
            type="button"
            @click="openAddMasterCategoryModal"
            class="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-semibold rounded flex items-center gap-2 shadow-sm transition-colors flex-shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Master Kategori</span>
          </button>
        </div>

        <!-- Master Categories Table -->
        <div class="bg-white border border-brand-300 rounded shadow-sm overflow-hidden">
          <table class="w-full text-left font-sans text-xs">
            <thead class="bg-brand-100/70 text-brand-700 font-mono uppercase border-b border-brand-300">
              <tr>
                <th class="p-3.5">Nama Kategori</th>
                <th class="p-3.5">Slug URL</th>
                <th class="p-3.5">Deskripsi</th>
                <th class="p-3.5">Produk Aktif</th>
                <th class="p-3.5">Status di Homepage</th>
                <th class="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-200 text-brand-800">
              <tr v-if="categoriesList.length === 0">
                <td colspan="6" class="p-10 text-center text-brand-500 font-mono">
                  Belum ada master kategori di database. Klik tombol "Tambah Master Kategori" untuk membuat kategori baru.
                </td>
              </tr>
              <tr
                v-for="cat in categoriesList"
                :key="cat.id"
                class="hover:bg-brand-50 transition-colors"
              >
                <!-- Name -->
                <td class="p-3.5 font-bold text-brand-950 font-serif text-sm">
                  {{ cat.name }}
                </td>

                <!-- Slug -->
                <td class="p-3.5 font-mono text-brand-700">
                  <span class="px-2 py-0.5 bg-brand-100 rounded text-[11px]">/{{ cat.slug }}</span>
                </td>

                <!-- Description -->
                <td class="p-3.5 text-brand-600 max-w-xs truncate">
                  {{ cat.description || '-' }}
                </td>

                <!-- Product count -->
                <td class="p-3.5 font-mono">
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-100 text-brand-800">
                    {{ getProductCountForCategory(cat.id) }} Artikel
                  </span>
                </td>

                <!-- Homepage status -->
                <td class="p-3.5 font-mono text-[11px]">
                  <span
                    v-if="isCategoryUsedInShowcase(cat)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold"
                  >
                    <Check class="w-3 h-3 text-emerald-600" />
                    <span>Aktif di Homepage</span>
                  </span>
                  <span v-else class="text-brand-400">
                    -
                  </span>
                </td>

                <!-- Delete Action -->
                <td class="p-3.5 text-right">
                  <button
                    @click="handleDeleteMasterCategory(cat)"
                    class="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded shadow-sm transition-colors"
                    title="Hapus Kategori"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>

    <!-- TAB 5: BUNDLE PACKAGES MANAGEMENT -->
    <div v-else-if="activeTab === 'bundles'" class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-300 pb-4">
        <div>
          <h2 class="font-serif font-bold text-xl text-brand-950 uppercase tracking-tight">
            Kelola Paket Bundling Eksklusif
          </h2>
          <p class="text-xs text-brand-600 font-sans mt-0.5">
            Atur paket bundle spesial yang tampil di Beranda, termasuk foto, harga promo, teks hemat, dan item di dalam paket.
          </p>
        </div>

        <button
          type="button"
          @click="openAddBundleModal"
          class="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-semibold rounded flex items-center gap-2 shadow-sm transition-colors flex-shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Paket Bundle Baru</span>
        </button>
      </div>

      <!-- Bundles Admin Cards Grid -->
      <div v-if="bundlesList.length === 0" class="p-12 text-center bg-white border border-brand-300 rounded font-mono text-xs text-brand-500">
        Belum ada paket bundling. Klik "+ Tambah Paket Bundle Baru" untuk membuat paket pertama.
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="b in bundlesList"
          :key="b.id"
          class="bg-white border border-brand-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <!-- Media Preview -->
            <div class="relative aspect-[4/3] bg-brand-100 overflow-hidden">
              <img
                v-if="b.image"
                :src="b.image"
                :alt="b.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-brand-400 font-mono text-xs">
                Tidak ada foto
              </div>
              <div class="absolute top-2 left-2">
                <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-brand-900/90 text-white font-semibold rounded">
                  {{ b.badge }}
                </span>
              </div>
              <div class="absolute top-2 right-2">
                <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-amber-400 text-brand-950 font-bold rounded">
                  {{ b.savingsText }}
                </span>
              </div>
            </div>

            <!-- Content Details -->
            <div class="p-4 space-y-3">
              <div>
                <h3 class="font-serif font-bold text-base text-brand-950 uppercase leading-snug">
                  {{ b.title }}
                </h3>
                <p class="text-xs font-mono text-brand-500 line-clamp-2 mt-0.5">
                  {{ b.subtitle }}
                </p>
              </div>

              <!-- Price Box -->
              <div class="p-2.5 bg-brand-50 border border-brand-200 rounded flex items-baseline justify-between text-xs">
                <div>
                  <span class="font-mono text-brand-400 line-through block text-[10px]">
                    {{ catalogStore.formatPrice(b.originalPrice) }}
                  </span>
                  <span class="font-mono text-sm font-bold text-brand-950">
                    {{ catalogStore.formatPrice(b.bundlePrice) }}
                  </span>
                </div>
                <span class="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {{ b.savingsText }}
                </span>
              </div>

              <!-- Item count & snippet -->
              <div class="space-y-1.5 pt-1">
                <span class="text-[10px] font-mono uppercase tracking-wider text-brand-600 font-bold block">
                  Isi Item Paket ({{ b.items?.length || 0 }} item):
                </span>
                <ul class="space-y-1 text-xs text-brand-700">
                  <li v-for="(it, iIdx) in (b.items || []).slice(0, 3)" :key="iIdx" class="flex items-center gap-1.5 truncate">
                    <span class="w-1.5 h-1.5 rounded-full bg-scripture-gold flex-shrink-0"></span>
                    <span class="truncate">{{ it.name }}</span>
                  </li>
                  <li v-if="(b.items?.length || 0) > 3" class="text-[10px] font-mono text-brand-400">
                    +{{ b.items.length - 3 }} item lainnya
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="p-4 pt-0 border-t border-brand-100 flex items-center justify-between gap-2 mt-3">
            <span class="text-[10px] font-mono text-brand-500">Urutan: #{{ b.sort_order }}</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="openEditBundleModal(b)"
                class="px-3 py-1.5 bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 rounded font-mono text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit class="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                @click="handleDeleteBundle(b)"
                class="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                title="Hapus Paket"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL FORM PRODUK (TAMBAH / EDIT) -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
      @click.self="isModalOpen = false"
    >
      <div class="bg-white border border-brand-300 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        <!-- Modal Header (Always Pinned at Top) -->
        <div class="px-6 py-4 border-b border-brand-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div class="flex items-center gap-2.5">
            <span class="text-scripture-gold font-serif">✦</span>
            <h3 class="font-serif font-bold text-lg sm:text-xl text-brand-950 uppercase tracking-tight">
              {{ isEditing ? 'Edit Artikel Pakaian' : 'Tambah Artikel Baru' }}
            </h3>
          </div>
          <button
            @click="isModalOpen = false"
            class="p-1.5 text-brand-400 hover:text-brand-900 hover:bg-brand-100 rounded-full transition-colors"
            title="Tutup Modal"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body (Scrollable Container) -->
        <form @submit.prevent="handleSaveProduct" id="productForm" class="p-6 overflow-y-auto flex-grow space-y-5 text-xs font-sans">
          
          <!-- Basic Info -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase">Judul Pakaian *</label>
              <input
                v-model="form.title"
                @input="generateSlug"
                type="text"
                required
                placeholder="Heavyweight Boxy Tee - 'Grace & Chaos'"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950"
              />
            </div>

            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase">Slug URL (Unik) *</label>
              <input
                v-model="form.slug"
                type="text"
                required
                placeholder="heavyweight-boxy-tee"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
              />
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="block font-mono text-brand-700 uppercase">Kategori Pakaian</label>
                <span class="text-[10px] font-mono text-brand-500">Master Kategori</span>
              </div>
              <select
                v-model="form.category_id"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono cursor-pointer"
              >
                <option value="">-- Tanpa Kategori --</option>
                <option
                  v-for="cat in categoriesList"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }} (/{{ cat.slug }})
                </option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase">Harga (IDR) *</label>
              <input
                v-model="form.price"
                type="number"
                required
                min="0"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Deskripsi Pakaian</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Jelaskan pesan firman, bahan, dan vibe baju..."
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950"
            ></textarea>
          </div>

          <!-- Specifications (Details) -->
          <div class="p-4 bg-brand-100/60 border border-brand-300 rounded space-y-3">
            <span class="font-mono text-xs uppercase text-brand-900 font-semibold block">
              Integritas Kain & Spesifikasi
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-mono text-brand-600 uppercase">Material Kain</label>
                <input
                  v-model="form.details.material"
                  placeholder="100% Heavyweight Cotton 16s (235 GSM)"
                  class="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded text-brand-900"
                />
              </div>
              <div>
                <label class="text-[10px] font-mono text-brand-600 uppercase">Cutting / Fit</label>
                <input
                  v-model="form.details.fit"
                  placeholder="Boxy Cut Drop Shoulder"
                  class="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded text-brand-900"
                />
              </div>
              <div>
                <label class="text-[10px] font-mono text-brand-600 uppercase">Sablon / Grafis</label>
                <input
                  v-model="form.details.print"
                  placeholder="High-Density Plastisol Discharge"
                  class="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded text-brand-900"
                />
              </div>
              <div>
                <label class="text-[10px] font-mono text-brand-600 uppercase">Asal Produksi</label>
                <input
                  v-model="form.details.origin"
                  placeholder="Bandung, ID"
                  class="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded text-brand-900"
                />
              </div>
            </div>
          </div>

          <!-- Variants & Stock Builder -->
          <div class="p-4 bg-brand-100/60 border border-brand-300 rounded space-y-3">
            <span class="font-mono text-xs uppercase text-brand-900 font-semibold block">
              Stok per Ukuran (Varian)
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="(v, idx) in form.variants" :key="idx" class="space-y-1">
                <label class="block font-mono text-xs text-brand-800 font-bold uppercase">Size {{ v.size }}</label>
                <input
                  v-model.number="v.stock"
                  type="number"
                  min="0"
                  placeholder="Stok"
                  class="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded text-brand-950 font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Image Uploader Section -->
          <div class="space-y-2">
            <span class="block font-mono text-brand-700 uppercase">Foto Pakaian (Supabase Cloud Storage)</span>
            
            <!-- Upload trigger -->
            <div class="flex items-center gap-3">
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-brand-50 border border-brand-300 rounded text-brand-900 font-mono text-xs shadow-sm">
                <Upload class="w-4 h-4 text-brand-600" />
                <span>{{ isUploadingImage ? 'Mengunggah ke Cloud...' : 'Unggah Foto dari Komputer / HP' }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="isUploadingImage"
                  @change="handleImageUpload"
                />
              </label>
              <span class="text-[11px] text-brand-500 font-mono">Format: JPG, PNG, WEBP</span>
            </div>

            <!-- Uploaded Photos Strip -->
            <div v-if="form.images.length > 0" class="flex items-center gap-3 pt-2 overflow-x-auto pb-2">
              <div
                v-for="(img, idx) in form.images"
                :key="idx"
                class="relative w-20 h-24 bg-brand-100 border border-brand-300 rounded overflow-hidden flex-shrink-0 group shadow-sm"
              >
                <img :src="img" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="removeImage(idx)"
                  class="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] shadow"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Status & Featured -->
          <div class="flex items-center gap-6 pt-2 border-t border-brand-200">
            <div class="flex items-center gap-2">
              <label class="font-mono text-brand-700 uppercase">Status:</label>
              <select
                v-model="form.status"
                class="px-3 py-1.5 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
              >
                <option value="active">Active (Tampil di Katalog)</option>
                <option value="sold_out">Sold Out</option>
                <option value="pre_order">Pre-Order</option>
                <option value="draft">Draft (Sembunyikan)</option>
              </select>
            </div>

            <label class="flex items-center gap-2 cursor-pointer font-mono text-brand-800 select-none">
              <input type="checkbox" v-model="form.is_featured" class="accent-brand-900" />
              <span>Jadikan Rilisan Pilihan (Featured)</span>
            </label>
          </div>

        </form>

        <!-- Modal Footer (Always Pinned at Bottom) -->
        <div class="px-6 py-4 border-t border-brand-200 bg-brand-50/80 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-5 py-2.5 font-mono text-xs text-brand-600 hover:text-brand-900 font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            form="productForm"
            :disabled="actionLoading || isUploadingImage"
            class="px-6 py-2.5 font-mono text-xs uppercase bg-brand-900 text-white hover:bg-brand-800 font-bold rounded flex items-center gap-2 shadow"
          >
            <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isEditing ? 'Simpan Perubahan' : 'Buat Artikel Baru' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- MODAL 1: ATUR KARTU KOLEKSI HOMEPAGE -->
    <div
      v-if="isShowcaseModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
      @click.self="isShowcaseModalOpen = false"
    >
      <div class="bg-white border border-brand-300 rounded-xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-brand-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div class="flex items-center gap-2.5">
            <LayoutGrid class="w-5 h-5 text-brand-800" />
            <div>
              <h2 class="font-serif font-bold text-lg text-brand-950 uppercase">
                {{ isShowcaseEditing ? 'Edit Kartu Koleksi Homepage' : 'Tambah Kartu Koleksi Homepage' }}
              </h2>
              <p class="text-xs text-brand-500 font-mono">
                Hubungkan kartu showcase ini ke salah satu Master Kategori yang ada
              </p>
            </div>
          </div>
          <button
            @click="isShowcaseModalOpen = false"
            class="p-1.5 text-brand-400 hover:text-brand-900 rounded"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body Scrollable -->
        <form
          id="showcaseCardForm"
          @submit.prevent="handleSaveShowcaseCard"
          class="p-6 space-y-4 overflow-y-auto font-sans text-xs flex-grow"
        >
          <!-- 1. Hubungkan ke Master Kategori -->
          <div class="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-1.5">
            <label class="block font-mono text-emerald-950 uppercase font-bold flex items-center gap-1.5">
              <LinkIcon class="w-3.5 h-3.5 text-emerald-600" />
              <span>Hubungkan ke Kategori Pakaian (Wajib) *</span>
            </label>
            <select
              v-model="showcaseForm.category_id"
              @change="onShowcaseCategoryChange"
              required
              class="w-full px-3 py-2 bg-white border border-emerald-300 rounded text-brand-950 font-mono font-medium cursor-pointer"
            >
              <option value="" disabled>-- Pilih Kategori yang Sudah Ada --</option>
              <option
                v-for="cat in categoriesList"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }} (Slug URL: /{{ cat.slug }})
              </option>
            </select>
            <p class="text-[11px] text-emerald-800 font-mono">
              Ketika kartu ini diklik di Beranda, pengunjung akan diarahkan ke katalog dengan filter kategori <code>/{{ showcaseForm.category_slug || 'kategori' }}</code>.
            </p>
          </div>

          <!-- Judul Kartu & Sub-Tag -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase">Judul Kartu di Beranda *</label>
              <input
                v-model="showcaseForm.title"
                type="text"
                required
                placeholder="Misal: Jackets & Outerwear"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-medium"
              />
            </div>

            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase">Sub-Tag Header</label>
              <input
                v-model="showcaseForm.tag"
                type="text"
                placeholder="01 // OUTERWEAR"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono uppercase"
              />
            </div>
          </div>

          <!-- Badge Showcase -->
          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Badge Label (Pojok Kiri Atas)</label>
            <input
              v-model="showcaseForm.badge"
              type="text"
              placeholder="HOT DROP / BESTSELLER"
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono uppercase"
            />
            <!-- Preset Badges -->
            <div class="flex flex-wrap gap-1 pt-1">
              <button
                type="button"
                v-for="b in badgePresets"
                :key="b"
                @click="showcaseForm.badge = b"
                class="text-[10px] font-mono px-2 py-0.5 bg-brand-100 hover:bg-brand-200 text-brand-800 rounded border border-brand-200 transition-colors"
              >
                {{ b }}
              </button>
            </div>
          </div>

          <!-- Deskripsi Ringkas -->
          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Deskripsi Bahan & Potongan</label>
            <textarea
              v-model="showcaseForm.description"
              rows="2"
              placeholder="Zip hoodies 380 GSM, coaches jacket, dan rajut katun tebal."
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 leading-relaxed font-sans"
            ></textarea>
          </div>

          <!-- Tombol Text & Sort Order -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase">Teks Tombol Aksi</label>
              <div class="flex items-center gap-1 bg-brand-50 border border-brand-300 rounded px-3 py-2">
                <span class="text-brand-500 font-mono text-xs">Jelajahi</span>
                <input
                  v-model="showcaseForm.button_text"
                  type="text"
                  placeholder="Outerwear"
                  class="bg-transparent border-none outline-none text-brand-950 font-medium w-full text-xs"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase">Urutan Tampil (Posisi Kartu)</label>
              <input
                v-model.number="showcaseForm.sort_order"
                type="number"
                min="1"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
              />
            </div>
          </div>

          <!-- Cover Image Upload & URL -->
          <div class="space-y-2 pt-2 border-t border-brand-200">
            <label class="block font-mono text-brand-700 uppercase">Foto Cover Showcase</label>
            
            <div class="flex items-center gap-3">
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-brand-50 border border-brand-300 rounded text-brand-900 font-mono text-xs shadow-sm">
                <Upload class="w-4 h-4 text-brand-600" />
                <span>{{ isUploadingShowcaseImage ? 'Mengunggah ke Cloud...' : 'Unggah Foto dari Komputer' }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="isUploadingShowcaseImage"
                  @change="handleShowcaseImageUpload"
                />
              </label>
              <span class="text-[11px] text-brand-500 font-mono">atau tempel link URL foto di bawah</span>
            </div>

            <input
              v-model="showcaseForm.image"
              type="url"
              placeholder="https://images.unsplash.com/... atau URL gambar lainnya"
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono text-xs"
            />

            <!-- Live Image Preview -->
            <div v-if="showcaseForm.image" class="relative w-full h-36 bg-brand-100 border border-brand-300 rounded overflow-hidden mt-2">
              <img :src="showcaseForm.image" class="w-full h-full object-cover" />
              <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white font-mono text-[10px] rounded">
                Preview Foto Cover
              </div>
            </div>
          </div>

        </form>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-brand-200 bg-brand-50/80 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            @click="isShowcaseModalOpen = false"
            class="px-5 py-2.5 font-mono text-xs text-brand-600 hover:text-brand-900 font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            form="showcaseCardForm"
            :disabled="actionLoading || isUploadingShowcaseImage"
            class="px-6 py-2.5 font-mono text-xs uppercase bg-brand-900 text-white hover:bg-brand-800 font-bold rounded flex items-center gap-2 shadow"
          >
            <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isShowcaseEditing ? 'Simpan Kartu Koleksi' : 'Buat Kartu Koleksi' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- MODAL 2: TAMBAH MASTER KATEGORI BARU -->
    <div
      v-if="isMasterCategoryModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
      @click.self="isMasterCategoryModalOpen = false"
    >
      <div class="bg-white border border-brand-300 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-brand-200 flex items-center justify-between bg-white">
          <div class="flex items-center gap-2.5">
            <FolderTree class="w-5 h-5 text-brand-800" />
            <div>
              <h2 class="font-serif font-bold text-lg text-brand-950 uppercase">
                Tambah Master Kategori
              </h2>
              <p class="text-xs text-brand-500 font-mono">
                Kategori baru untuk pakaian di katalog
              </p>
            </div>
          </div>
          <button
            @click="isMasterCategoryModalOpen = false"
            class="p-1.5 text-brand-400 hover:text-brand-900 rounded"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <form
          id="masterCategoryFormEl"
          @submit.prevent="handleSaveMasterCategory"
          class="p-6 space-y-4 font-sans text-xs"
        >
          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Nama Kategori *</label>
            <input
              v-model="masterCategoryForm.name"
              @input="generateMasterCategorySlug"
              type="text"
              required
              placeholder="Misal: Shorts & Boxers"
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-medium"
            />
          </div>

          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Slug URL (Otomatis) *</label>
            <input
              v-model="masterCategoryForm.slug"
              type="text"
              required
              placeholder="shorts-boxers"
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
            />
            <p class="text-[10px] text-brand-500 font-mono">Digunakan sebagai parameter URL di katalog (misal: /catalog?category=shorts-boxers).</p>
          </div>

          <div class="space-y-1">
            <label class="block font-mono text-brand-700 uppercase">Deskripsi Kategori (Opsional)</label>
            <textarea
              v-model="masterCategoryForm.description"
              rows="2"
              placeholder="Penjelasan singkat kategori pakaian ini..."
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-sans"
            ></textarea>
          </div>
        </form>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-brand-200 bg-brand-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isMasterCategoryModalOpen = false"
            class="px-5 py-2.5 font-mono text-xs text-brand-600 hover:text-brand-900 font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            form="masterCategoryFormEl"
            :disabled="actionLoading"
            class="px-6 py-2.5 font-mono text-xs uppercase bg-brand-900 text-white hover:bg-brand-800 font-bold rounded flex items-center gap-2 shadow"
          >
            <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
            <span>Buat Master Kategori</span>
          </button>
        </div>

      </div>
    </div>

    <!-- MODAL FORM PAKET BUNDLE (TAMBAH / EDIT) -->
    <div
      v-if="isBundleModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
      @click.self="isBundleModalOpen = false"
    >
      <div class="bg-white border border-brand-300 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-brand-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div class="flex items-center gap-2.5">
            <Boxes class="w-5 h-5 text-scripture-gold" />
            <h3 class="font-serif font-bold text-lg sm:text-xl text-brand-950 uppercase tracking-tight">
              {{ isBundleEditing ? 'Edit Paket Bundling' : 'Tambah Paket Bundling Baru' }}
            </h3>
          </div>
          <button
            @click="isBundleModalOpen = false"
            class="p-1.5 text-brand-400 hover:text-brand-900 rounded-md hover:bg-brand-100 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-6 overflow-y-auto space-y-6 flex-grow font-sans text-xs">
          <!-- Title & Subtitle -->
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase font-semibold">Judul Paket Bundle *</label>
              <input
                v-model="bundleForm.title"
                type="text"
                required
                placeholder="Contoh: The Sabbath Essential Set"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-medium"
              />
            </div>

            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase font-semibold">Sub-judul / Ringkasan Isi</label>
              <input
                v-model="bundleForm.subtitle"
                type="text"
                placeholder="Contoh: Heavyweight Boxy Tee + Corduroy Cap + Free Sticker Pack"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950"
              />
            </div>
          </div>

          <!-- Badge & Presets -->
          <div class="space-y-2">
            <label class="block font-mono text-brand-700 uppercase font-semibold">Badge / Label Promosi</label>
            <input
              v-model="bundleForm.badge"
              type="text"
              placeholder="Contoh: BEST VALUE"
              class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
            />
            <div class="flex items-center gap-1.5 flex-wrap pt-1">
              <span class="text-[10px] font-mono text-brand-500">Pilihan Cepat:</span>
              <button
                v-for="p in bundleBadgePresets"
                :key="p"
                type="button"
                @click="bundleForm.badge = p"
                class="px-2 py-0.5 text-[10px] font-mono rounded border transition-colors"
                :class="bundleForm.badge === p ? 'bg-brand-900 text-white border-brand-900' : 'bg-brand-100 hover:bg-brand-200 border-brand-300 text-brand-700'"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <!-- Bundle Image (Upload or URL) -->
          <div class="space-y-2 border-t border-brand-200 pt-4">
            <label class="block font-mono text-brand-700 uppercase font-semibold">Foto Paket Bundle *</label>
            <div class="flex flex-col sm:flex-row gap-4 items-start">
              <div class="w-32 h-32 aspect-[4/5] bg-brand-100 border border-brand-300 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  v-if="bundleForm.image"
                  :src="bundleForm.image"
                  alt="Bundle Image"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-[10px] font-mono text-brand-400 text-center p-2">Belum ada foto</span>
              </div>
              <div class="space-y-3 flex-grow w-full">
                <div>
                  <label class="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-brand-50 border border-brand-300 rounded text-brand-900 font-mono text-xs shadow-sm">
                    <Upload class="w-4 h-4 text-brand-600" />
                    <span>{{ isUploadingBundleImage ? 'Mengunggah...' : 'Upload Foto Bundle' }}</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      :disabled="isUploadingBundleImage"
                      @change="handleBundleImageUpload"
                    />
                  </label>
                </div>
                <div class="space-y-1">
                  <span class="text-[10px] font-mono text-brand-500 block">Atau masukkan URL Foto langsung:</span>
                  <input
                    v-model="bundleForm.image"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    class="w-full px-3 py-1.5 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing & Savings -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-brand-200 pt-4">
            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase font-semibold">Harga Normal (Asli)</label>
              <input
                v-model.number="bundleForm.originalPrice"
                type="number"
                min="0"
                step="5000"
                @input="updateBundleSavingsText"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
              />
            </div>

            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase font-semibold">Harga Promo Bundle</label>
              <input
                v-model.number="bundleForm.bundlePrice"
                type="number"
                min="0"
                step="5000"
                @input="updateBundleSavingsText"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono font-bold"
              />
            </div>

            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase font-semibold">Teks Hemat</label>
              <input
                v-model="bundleForm.savingsText"
                type="text"
                placeholder="Hemat Rp50.000"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
              />
            </div>
          </div>

          <!-- Inclusions Repeater (Rincian Item) -->
          <div class="space-y-3 border-t border-brand-200 pt-4">
            <div class="flex items-center justify-between">
              <div>
                <label class="block font-mono text-brand-900 uppercase font-semibold">Rincian Item Termasuk Dalam Paket</label>
                <p class="text-[11px] text-brand-500 font-mono">Item ini akan tampil di dalam tombol "Lihat Rincian Item" pada beranda.</p>
              </div>
              <button
                type="button"
                @click="addBundleItem"
                class="px-3 py-1 bg-brand-100 hover:bg-brand-200 border border-brand-300 rounded text-brand-900 font-mono text-xs flex items-center gap-1.5"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, idx) in bundleForm.items"
                :key="idx"
                class="p-3 bg-brand-50 border border-brand-200 rounded space-y-2 relative"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[11px] text-brand-600 font-bold uppercase">
                    Item #{{ idx + 1 }}
                  </span>
                  <button
                    type="button"
                    @click="removeBundleItem(idx)"
                    class="p-1 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50 transition-colors"
                    title="Hapus Item Ini"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span class="text-[10px] font-mono text-brand-500 block mb-0.5">Nama Item *</span>
                    <input
                      v-model="item.name"
                      type="text"
                      placeholder="Contoh: Heavyweight Boxy Tee"
                      class="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded text-brand-950 text-xs"
                    />
                  </div>
                  <div>
                    <span class="text-[10px] font-mono text-brand-500 block mb-0.5">Detail / Bahan / Catatan</span>
                    <input
                      v-model="item.detail"
                      type="text"
                      placeholder="Contoh: Katun 16s 235 GSM (Size S-XL)"
                      class="w-full px-2.5 py-1.5 bg-white border border-brand-300 rounded text-brand-950 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sort order & Active toggle -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-brand-200 pt-4">
            <div class="space-y-1">
              <label class="block font-mono text-brand-700 uppercase font-semibold">Urutan Tampil (Sort Order)</label>
              <input
                v-model.number="bundleForm.sort_order"
                type="number"
                min="1"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono"
              />
            </div>

            <div class="flex items-center gap-3 pt-5">
              <input
                id="bundle-active"
                v-model="bundleForm.is_active"
                type="checkbox"
                class="w-4 h-4 rounded text-brand-900 border-brand-300 focus:ring-brand-900"
              />
              <label for="bundle-active" class="font-mono text-brand-800 text-xs select-none">
                Aktifkan & Tampilkan di Beranda
              </label>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-brand-200 bg-white flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            @click="isBundleModalOpen = false"
            class="px-4 py-2 text-xs font-mono uppercase tracking-wider text-brand-600 hover:bg-brand-100 rounded"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="actionLoading || isUploadingBundleImage"
            @click="handleSaveBundle"
            class="px-6 py-2 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-bold rounded flex items-center gap-2 shadow-sm transition-colors"
          >
            <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isBundleEditing ? 'Simpan Perubahan' : 'Buat Paket Bundle' }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
