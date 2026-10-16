<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getWIBTimeParts, getActiveWhatsAppCP, DEFAULT_SHIFTS } from '../../lib/whatsappResolver'
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
  Clock,
  MessageCircle,
  Phone,
  Radio,
  ArrowRight,
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
  whatsapp_shifts_enabled: true,
  whatsapp_shifts: [],
  instagram_url: '',
  announcement_bar: '',
  about: '',
  address: '',
  hero_slides: [],
  hero_slide_interval: 4,
})

// Real-time WIB Clock for shift monitoring in Admin
const currentWIB = ref(getWIBTimeParts())
let wibClockTimer = null

onMounted(() => {
  wibClockTimer = setInterval(() => {
    currentWIB.value = getWIBTimeParts()
  }, 1000)
})

onUnmounted(() => {
  if (wibClockTimer) clearInterval(wibClockTimer)
})

// Active CP live resolver in Admin dashboard preview
const currentActiveCPInAdmin = computed(() => {
  return getActiveWhatsAppCP({
    brand_name: settingsForm.value.brand_name,
    whatsapp_number: settingsForm.value.whatsapp_number,
    whatsapp_shifts_enabled: settingsForm.value.whatsapp_shifts_enabled,
    whatsapp_shifts: settingsForm.value.whatsapp_shifts,
  })
})

function addShift() {
  const nextNum = (settingsForm.value.whatsapp_shifts?.length || 0) + 1
  if (!Array.isArray(settingsForm.value.whatsapp_shifts)) {
    settingsForm.value.whatsapp_shifts = []
  }
  settingsForm.value.whatsapp_shifts.push({
    id: 'shift-' + Date.now(),
    name: `CP ${nextNum}`,
    start_time: '08:00',
    end_time: '17:00',
    whatsapp_number: settingsForm.value.whatsapp_number || '6281234567890',
    is_active: true,
  })
}

function removeShift(index) {
  if (!settingsForm.value.whatsapp_shifts || settingsForm.value.whatsapp_shifts.length <= 1) {
    notify('Minimal harus ada 1 shift jika sistem rolling aktif.', 'error')
    return
  }
  settingsForm.value.whatsapp_shifts.splice(index, 1)
}

// Hero Slides Management Helpers
const isUploadingHeroSlide = ref(false)

function addHeroSlide() {
  if (!Array.isArray(settingsForm.value.hero_slides)) {
    settingsForm.value.hero_slides = []
  }
  const nextNum = settingsForm.value.hero_slides.length + 1
  settingsForm.value.hero_slides.push({
    id: 'slide-' + Date.now(),
    image: '',
    badge: '★ 16S ULTRA HEAVY',
    caption: 'BIBLE TALK ARCHIVE // 2026',
    tag: `REF. BT-HERO-0${nextNum}`,
  })
}

function removeHeroSlide(index) {
  if (settingsForm.value.hero_slides.length <= 1) {
    notify('Minimal harus ada 1 foto utama untuk hero.', 'error')
    return
  }
  settingsForm.value.hero_slides.splice(index, 1)
}

async function handleHeroSlideUpload(e, index) {
  const file = e.target.files?.[0]
  if (!file) return
  isUploadingHeroSlide.value = true
  try {
    const publicUrl = await uploadImage(file, 'products')
    settingsForm.value.hero_slides[index].image = publicUrl
    notify('Foto hero berhasil diunggah!')
  } catch (err) {
    notify('Gagal mengunggah foto hero: ' + err.message, 'error')
  } finally {
    isUploadingHeroSlide.value = false
    e.target.value = ''
  }
}

// Lookbook Form
const lookbookForm = ref({
  id: null,
  title: '',
  season: '',
  description: '',
  cover_image: '',
  gallery: [],
  banner_badge: '✦ 35MM EDITORIAL ARCHIVE',
  banner_tagline: 'EDITORIAL ARCHIVE',
  spec1_label: 'MEDIUM',
  spec1_val: '35mm Kodak Tri-X',
  spec2_label: 'ARCHIVE',
  spec2_val: '',
  btn1_text: 'Buka Full Lookbook',
  btn2_text: 'Lihat Katalog',
})
const isUploadingLookbookGallery = ref(false)

const lookbookPreviewImage = computed(() => {
  const first = lookbookForm.value.gallery?.[0]
  if (!first) return lookbookForm.value.cover_image || null
  if (typeof first === 'object' && first.url) return first.url
  if (typeof first === 'string') {
    const trimmed = first.trim()
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (parsed.url) return parsed.url
      } catch (_) {}
    }
    return trimmed
  }
  return null
})

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
      whatsapp_shifts_enabled: catalogStore.storeSettings.whatsapp_shifts_enabled !== false,
      whatsapp_shifts: Array.isArray(catalogStore.storeSettings.whatsapp_shifts) && catalogStore.storeSettings.whatsapp_shifts.length > 0
        ? JSON.parse(JSON.stringify(catalogStore.storeSettings.whatsapp_shifts))
        : JSON.parse(JSON.stringify(DEFAULT_SHIFTS)),
      instagram_url: catalogStore.storeSettings.instagram_url || '',
      announcement_bar: catalogStore.storeSettings.announcement_bar || '',
      about: catalogStore.storeSettings.about || '',
      address: catalogStore.storeSettings.address || 'Kabupaten Ngawi, Jawa Timur - Indonesia',
      hero_slides: Array.isArray(catalogStore.storeSettings.hero_slides) && catalogStore.storeSettings.hero_slides.length > 0
        ? JSON.parse(JSON.stringify(catalogStore.storeSettings.hero_slides))
        : [
            {
              id: 'slide-1',
              image: '/hero-product.jpg',
              badge: '★ 16S ULTRA HEAVY',
              caption: 'BIBLE TALK ARCHIVE // 2026',
              tag: 'REF. BT-HERO-01'
            }
          ],
      hero_slide_interval: Number(catalogStore.storeSettings.hero_slide_interval) || 4,
    }

    if (books && books.length > 0) {
      const current = books[0]
      let savedBanner = null
      try {
        const raw = localStorage.getItem('bibletalk_lookbook_banner_local')
        if (raw) savedBanner = JSON.parse(raw)
      } catch (_) {}

      lookbookForm.value = {
        id: current.id,
        title: current.title || '',
        season: current.season || '',
        description: current.description || '',
        cover_image: current.cover_image || '',
        banner_badge: savedBanner?.banner_badge || '✦ 35MM EDITORIAL ARCHIVE',
        banner_tagline: savedBanner?.banner_tagline || 'EDITORIAL ARCHIVE',
        spec1_label: savedBanner?.spec1_label || 'MEDIUM',
        spec1_val: savedBanner?.spec1_val || '35mm Kodak Tri-X',
        spec2_label: savedBanner?.spec2_label || 'ARCHIVE',
        spec2_val: savedBanner?.spec2_val || '',
        btn1_text: savedBanner?.btn1_text || 'Buka Full Lookbook',
        btn2_text: savedBanner?.btn2_text || 'Lihat Katalog',
        gallery: Array.isArray(current.gallery)
          ? current.gallery.map((item, idx) => {
              if (typeof item === 'string') {
                const trimmed = item.trim()
                if (trimmed.startsWith('{')) {
                  try {
                    const parsed = JSON.parse(trimmed)
                    if (parsed.url) {
                      return {
                        url: parsed.url,
                        title: parsed.title || parsed.caption || '',
                        caption: parsed.caption || '',
                        verse: parsed.verse || 'MATTHEW 5:14',
                        spec: parsed.spec || '16s COMBED COTTON 235+ GSM',
                        fit: parsed.fit || 'Boxy Drop-Shoulder Silhouette',
                        lookCode: parsed.lookCode || `LOOK 0${idx + 1}`,
                      }
                    }
                  } catch (_) {}
                }
                return {
                  url: trimmed,
                  title: '',
                  caption: '',
                  verse: 'MATTHEW 5:14',
                  spec: '16s COMBED COTTON 235+ GSM',
                  fit: 'Boxy Drop-Shoulder Silhouette',
                  lookCode: `LOOK 0${idx + 1}`,
                }
              }
              return {
                url: item?.url || '',
                title: item?.title || item?.caption || '',
                caption: item?.caption || '',
                verse: item?.verse || 'MATTHEW 5:14',
                spec: item?.spec || '16s COMBED COTTON 235+ GSM',
                fit: item?.fit || 'Boxy Drop-Shoulder Silhouette',
                lookCode: item?.lookCode || `LOOK 0${idx + 1}`,
              }
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
    const res = await updateStoreSettings(settingsForm.value)
    catalogStore.storeSettings = { ...catalogStore.storeSettings, ...settingsForm.value }
    await catalogStore.refreshStoreSettings()
    
    if (res?.migrationNeeded) {
      notify('Pengaturan tersimpan di browser! Jalankan file SQL supabase/migration_add_whatsapp_shifts.sql di Supabase agar tersimpan ke database server.', 'warning')
    } else {
      notify('Pengaturan toko & shift CP WhatsApp berhasil diperbarui!')
    }
  } catch (err) {
    notify('Gagal memperbarui pengaturan: ' + err.message, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ==============================================================================
// LOOKBOOK ACTIONS
// ==============================================================================

async function handleBannerCoverUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  isUploadingLookbookGallery.value = true
  try {
    const publicUrl = await uploadImage(file, 'lookbooks')
    lookbookForm.value.cover_image = publicUrl
    if (!Array.isArray(lookbookForm.value.gallery)) {
      lookbookForm.value.gallery = []
    }
    if (lookbookForm.value.gallery.length === 0) {
      lookbookForm.value.gallery.unshift({
        url: publicUrl,
        title: lookbookForm.value.title || '',
        caption: '',
        verse: 'MATTHEW 5:14',
        spec: '16s COMBED COTTON 235+ GSM',
        fit: 'Boxy Drop-Shoulder Silhouette',
        lookCode: 'LOOK 01',
      })
    } else {
      if (typeof lookbookForm.value.gallery[0] === 'string') {
        lookbookForm.value.gallery[0] = publicUrl
      } else {
        lookbookForm.value.gallery[0].url = publicUrl
      }
    }
    notify('Foto banner berhasil diperbarui!')
  } catch (err) {
    notify('Gagal unggah foto banner: ' + err.message, 'error')
  } finally {
    isUploadingLookbookGallery.value = false
    e.target.value = ''
  }
}

async function handleLookbookGalleryUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  isUploadingLookbookGallery.value = true
  try {
    const publicUrl = await uploadImage(file, 'lookbooks')
    lookbookForm.value.gallery.push({
      url: publicUrl,
      title: '',
      caption: '',
      verse: 'MATTHEW 5:14',
      spec: '16s COMBED COTTON 235+ GSM',
      fit: 'Boxy Drop-Shoulder Silhouette',
      lookCode: `LOOK 0${lookbookForm.value.gallery.length + 1}`,
    })
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
    // Format array gallery: simpan seluruh metadata kustom per foto ke JSON string
    const processedGallery = (lookbookForm.value.gallery || [])
      .filter((g) => g && (g.url || typeof g === 'string'))
      .map((g, idx) => {
        const url = typeof g === 'string' ? g : g.url
        const title = typeof g === 'object' ? (g.title || '').trim() : ''
        const caption = typeof g === 'object' ? (g.caption || '').trim() : ''
        const verse = typeof g === 'object' ? (g.verse || 'MATTHEW 5:14').trim() : 'MATTHEW 5:14'
        const spec = typeof g === 'object' ? (g.spec || '16s COMBED COTTON 235+ GSM').trim() : '16s COMBED COTTON 235+ GSM'
        const fit = typeof g === 'object' ? (g.fit || 'Boxy Drop-Shoulder Silhouette').trim() : 'Boxy Drop-Shoulder Silhouette'
        const lookCode = typeof g === 'object' ? (g.lookCode || `LOOK 0${idx + 1}`).trim() : `LOOK 0${idx + 1}`

        return JSON.stringify({
          url,
          title,
          caption,
          verse,
          spec,
          fit,
          lookCode,
        })
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
      cover_image: lookbookForm.value.gallery?.[0]?.url || (typeof lookbookForm.value.gallery?.[0] === 'string' ? lookbookForm.value.gallery[0] : null) || null,
      gallery: processedGallery,
      is_active: true,
    }

    if (lookbookForm.value.id) {
      await updateLookbook(lookbookForm.value.id, payload)
    } else {
      const created = await createLookbook(payload)
      lookbookForm.value.id = created.id
    }

    // Simpan konfigurasi banner beranda ke storage lokal
    const bannerPayload = {
      banner_badge: lookbookForm.value.banner_badge || '✦ 35MM EDITORIAL ARCHIVE',
      banner_tagline: lookbookForm.value.banner_tagline || 'EDITORIAL ARCHIVE',
      spec1_label: lookbookForm.value.spec1_label || 'MEDIUM',
      spec1_val: lookbookForm.value.spec1_val || '35mm Kodak Tri-X',
      spec2_label: lookbookForm.value.spec2_label || 'ARCHIVE',
      spec2_val: lookbookForm.value.spec2_val || '',
      btn1_text: lookbookForm.value.btn1_text || 'Buka Full Lookbook',
      btn2_text: lookbookForm.value.btn2_text || 'Lihat Katalog',
    }

    try {
      localStorage.setItem('bibletalk_lookbook_banner_local', JSON.stringify(bannerPayload))
    } catch (_) {}

    notify('Editorial Lookbook berhasil diperbarui!')
    // Update store state so homepage and lookbook view immediately reflect it
    await catalogStore.initStore()
    const updatedBooks = await adminGetLookbooks().catch(() => [])
    if (updatedBooks && updatedBooks.length > 0) {
      updatedBooks[0].banner_settings = bannerPayload
    }
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
  if (orig > bPrice && bPrice > 0) {
    const diff = orig - bPrice
    bundleForm.value.savingsText = `Hemat Rp${diff.toLocaleString('id-ID')}`
  } else if (orig > 0 && bPrice >= orig) {
    bundleForm.value.savingsText = 'Harga Spesial'
  } else if (orig === 0 || bPrice === 0) {
    bundleForm.value.savingsText = ''
  }
}

// Watchers for automatic real-time calculation
watch(
  [() => bundleForm.value.originalPrice, () => bundleForm.value.bundlePrice],
  () => {
    updateBundleSavingsText()
  }
)

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
  <div class="relative bg-[#faf8f4] min-h-screen overflow-hidden text-brand-950">
    
    <!-- Ambient Halftone Dot Background Pattern -->
    <div class="absolute inset-0 bg-halftone text-brand-950/[0.05] pointer-events-none z-0"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-sans">
      
      <!-- TOP HEADER (Clean Zine Header) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-950 pb-5">
        <div>
          <div class="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-brand-600 uppercase tracking-widest mb-1">
            <span class="w-2 h-2 bg-emerald-600 border border-brand-950 inline-block"></span>
            <span class="font-bold">BIBLE TALK // CMS MANAGEMENT & ARCHIVE</span>
          </div>
          <h1 class="font-sans font-black text-2xl sm:text-3xl uppercase tracking-tight text-brand-950">
            Katalog Pakaian & Stok
          </h1>
          <p class="font-mono text-xs text-brand-600 mt-0.5">
            Admin Logged In: <span class="text-brand-950 font-bold">{{ authStore.user?.email || 'Admin' }}</span>
          </p>
        </div>

        <div class="flex items-center gap-2.5 font-mono text-xs">
          <router-link
            to="/"
            target="_blank"
            class="px-3.5 py-1.5 bg-white hover:bg-brand-100 text-brand-950 border-2 border-brand-950 font-bold uppercase shadow-[2px_2px_0px_#153227] flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Lihat Website</span>
          </router-link>

          <button
            @click="handleLogout"
            class="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-brand-950 font-bold uppercase shadow-[2px_2px_0px_#153227] flex items-center gap-1.5 transition-colors"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <!-- NOTIFICATION TOAST -->
      <div
        v-if="notification.text"
        class="p-3.5 border-2 border-brand-950 text-xs font-mono flex items-center justify-between shadow-[3px_3px_0px_#153227] animate-fadeIn"
        :class="notification.type === 'error' ? 'bg-rose-100 text-rose-900 border-rose-600' : 'bg-emerald-100 text-emerald-950 border-emerald-700'"
      >
        <span class="font-bold">{{ notification.text }}</span>
        <button @click="notification.text = ''" class="p-1 hover:bg-black/10 transition-colors"><X class="w-4 h-4" /></button>
      </div>

      <!-- STATS OVERVIEW CARDS (Tactile Zine Stats) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        <div class="p-4 bg-white border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
          <span class="font-mono text-[10px] text-brand-500 uppercase tracking-wider font-bold block">Total Artikel</span>
          <div class="font-sans font-black text-2xl sm:text-3xl text-brand-950 mt-1">
            {{ productsList.length }}
          </div>
        </div>

        <div class="p-4 bg-white border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
          <span class="font-mono text-[10px] text-brand-500 uppercase tracking-wider font-bold block">Kategori Aktif</span>
          <div class="font-sans font-black text-2xl sm:text-3xl text-brand-950 mt-1">
            {{ catalogStore.categories.length }}
          </div>
        </div>

        <div class="p-4 bg-white border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
          <span class="font-mono text-[10px] text-brand-500 uppercase tracking-wider font-bold block">Signature Drops</span>
          <div class="font-sans font-black text-2xl sm:text-3xl text-brand-950 mt-1">
            {{ productsList.filter(p => p.is_featured).length }}
          </div>
        </div>

        <div class="p-4 bg-white border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
          <span class="font-mono text-[10px] text-brand-500 uppercase tracking-wider font-bold block">WhatsApp CS Channel</span>
          <div class="font-mono text-xs font-bold text-emerald-800 mt-2 truncate">
            {{ catalogStore.storeSettings.whatsapp_number || 'Belum diisi' }}
          </div>
        </div>
      </div>

      <!-- TABS BAR (Streetwear Zine Tabs) -->
      <div class="flex items-center gap-2 border-b-2 border-brand-950 pb-3 font-mono text-xs overflow-x-auto scrollbar-none">
        <button
          @click="activeTab = 'products'"
          class="px-3.5 py-2 uppercase border-2 border-brand-950 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs"
          :class="activeTab === 'products' ? 'bg-brand-950 text-scripture-gold shadow-[2px_2px_0px_#153227] -rotate-0.5' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <Package class="w-3.5 h-3.5" />
          <span>Katalog Pakaian ({{ productsList.length }})</span>
        </button>

        <button
          @click="activeTab = 'categories'"
          class="px-3.5 py-2 uppercase border-2 border-brand-950 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs"
          :class="activeTab === 'categories' ? 'bg-brand-950 text-scripture-gold shadow-[2px_2px_0px_#153227] -rotate-0.5' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <Layers class="w-3.5 h-3.5" />
          <span>Kategori Koleksi ({{ categoriesList.length }})</span>
        </button>

        <button
          @click="activeTab = 'bundles'"
          class="px-3.5 py-2 uppercase border-2 border-brand-950 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs"
          :class="activeTab === 'bundles' ? 'bg-brand-950 text-scripture-gold shadow-[2px_2px_0px_#153227] -rotate-0.5' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <Boxes class="w-3.5 h-3.5" />
          <span>Paket Bundling ({{ bundlesList.length }})</span>
        </button>

        <button
          @click="activeTab = 'settings'"
          class="px-3.5 py-2 uppercase border-2 border-brand-950 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs"
          :class="activeTab === 'settings' ? 'bg-brand-950 text-scripture-gold shadow-[2px_2px_0px_#153227] -rotate-0.5' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <Settings class="w-3.5 h-3.5" />
          <span>Profil & WhatsApp</span>
        </button>

        <button
          @click="activeTab = 'lookbook'"
          class="px-3.5 py-2 uppercase border-2 border-brand-950 font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs"
          :class="activeTab === 'lookbook' ? 'bg-brand-950 text-scripture-gold shadow-[2px_2px_0px_#153227] -rotate-0.5' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <Camera class="w-3.5 h-3.5" />
          <span>Editorial Lookbook</span>
        </button>
      </div>

      <!-- TAB 1: PRODUCTS LIST TABLE -->
      <div v-if="activeTab === 'products'" class="space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span class="font-mono text-xs text-brand-600">
            Daftar pakaian, kelola varian ukuran, dan unggah foto langsung dari browser.
          </span>
          <button
            @click="openAddModal"
            class="self-start sm:self-auto px-4 py-2 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono text-xs uppercase font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Artikel Pakaian</span>
          </button>
        </div>

        <!-- Table Box -->
        <div class="bg-white border-2 border-brand-950 shadow-[4px_4px_0px_#153227] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left font-sans text-xs">
              <thead class="bg-brand-950 text-scripture-gold font-mono uppercase border-b-2 border-brand-950 text-[11px]">
                <tr>
                  <th class="p-3">Artikel Pakaian</th>
                  <th class="p-3">Kategori</th>
                  <th class="p-3">Harga</th>
                  <th class="p-3">Stok per Ukuran</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-right">Aksi</th>
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
                  <td class="p-3 flex items-center gap-3">
                    <img
                      :src="prod.images?.[0] || 'https://via.placeholder.com/80'"
                      :alt="prod.title"
                      class="w-11 h-13 object-cover bg-brand-100 border border-brand-950 flex-shrink-0"
                    />
                    <div>
                      <span class="font-sans font-bold text-brand-950 block text-sm">{{ prod.title }}</span>
                      <span class="font-mono text-[10px] text-brand-500">/{{ prod.slug }}</span>
                    </div>
                  </td>

                  <!-- Category -->
                  <td class="p-3 font-mono text-brand-700 font-medium">
                    {{ prod.category?.name || 'Uncategorized' }}
                  </td>

                  <!-- Price -->
                  <td class="p-3 font-mono font-bold text-brand-950">
                    {{ catalogStore.formatPrice(prod.price) }}
                  </td>

                <!-- Variants / Stock Summary -->
                <td class="p-3 font-mono">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-for="v in prod.variants"
                      :key="v.id"
                      class="px-1.5 py-0.5 text-[10px] font-bold border"
                      :class="v.stock > 0 ? 'bg-white text-brand-950 border-brand-950' : 'bg-rose-100 text-rose-800 border-rose-400'"
                    >
                      {{ v.size }}: {{ v.stock }}
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td class="p-3">
                  <span
                    class="px-2 py-0.5 font-mono text-[10px] uppercase font-bold border-2 border-brand-950"
                    :class="[
                      prod.status === 'active' ? 'bg-emerald-200 text-emerald-950' :
                      prod.status === 'sold_out' ? 'bg-rose-200 text-rose-950' :
                      'bg-brand-100 text-brand-800'
                    ]"
                  >
                    {{ prod.status }}
                  </span>
                </td>

                <!-- Actions -->
                <td class="p-3 text-right space-x-1.5 font-mono">
                  <button
                    @click="openEditModal(prod)"
                    class="p-1.5 text-brand-950 bg-white hover:bg-brand-100 border-2 border-brand-950 shadow-[1px_1px_0px_#153227] transition-all active:translate-x-0.5 active:translate-y-0.5"
                    title="Edit Produk"
                  >
                    <Edit class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDeleteProduct(prod)"
                    class="p-1.5 text-rose-900 bg-rose-100 hover:bg-rose-200 border-2 border-brand-950 shadow-[1px_1px_0px_#153227] transition-all active:translate-x-0.5 active:translate-y-0.5"
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
    <div v-else-if="activeTab === 'settings'" class="max-w-4xl bg-white border-2 border-brand-950 shadow-[4px_4px_0px_#153227] p-6 sm:p-8 space-y-6">
      <div class="border-b-2 border-brand-950 pb-3">
        <h2 class="font-sans font-black text-xl text-brand-950 uppercase tracking-tight">
          Profil Brand & Kontak Pemesanan
        </h2>
        <p class="font-mono text-xs text-brand-600 mt-0.5">
          Atur identitas brand, hero carousel beranda, jadwal shift WhatsApp, dan alamat toko.
        </p>
      </div>

      <form @submit.prevent="handleSaveSettings" class="space-y-5 font-sans text-xs">
        <div class="space-y-1 font-mono">
          <label class="block uppercase font-bold text-brand-950">Nama Brand Pakaian</label>
          <input
            v-model="settingsForm.brand_name"
            type="text"
            required
            class="w-full px-3.5 py-2 bg-white border-2 border-brand-950 text-brand-950 font-bold shadow-[2px_2px_0px_#153227]"
          />
        </div>

        <div class="space-y-1 font-mono">
          <label class="block uppercase font-bold text-brand-950">Tagline / Slogan</label>
          <input
            v-model="settingsForm.tagline"
            type="text"
            class="w-full px-3.5 py-2 bg-white border-2 border-brand-950 text-brand-950 shadow-[2px_2px_0px_#153227]"
          />
        </div>

        <!-- PENGATURAN FOTO HERO DEPAN & AUTO-SLIDER BERANDA -->
        <div class="border-2 border-brand-950 bg-[#faf8f4] p-5 sm:p-6 space-y-6 shadow-[3px_3px_0px_#153227]">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-brand-950/20">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-950 text-scripture-gold font-mono text-[10px] uppercase font-black tracking-wider mb-1">
                <Layers class="w-3.5 h-3.5" />
                <span>Foto Utama Beranda • Auto-Slider</span>
              </div>
              <h3 class="font-sans font-black text-lg text-brand-950 uppercase tracking-tight">
                Kelola Foto Hero Depan & Slider
              </h3>
              <p class="text-xs text-brand-700 font-sans mt-0.5">
                Admin dapat mengganti foto hero depan, menambah foto baru, dan mengatur kecepatan durasi slide.
              </p>
            </div>

            <!-- Pengaturan Interval Durasi Detik -->
            <div class="flex items-center gap-2 bg-white border-2 border-brand-950 px-3 py-2 shadow-[2px_2px_0px_#153227]">
              <Clock class="w-4 h-4 text-brand-950" />
              <div class="flex items-center gap-1.5 font-mono text-xs">
                <span class="text-brand-950 font-bold">Durasi Slide:</span>
                <input
                  v-model.number="settingsForm.hero_slide_interval"
                  type="number"
                  min="2"
                  max="30"
                  class="w-14 px-2 py-1 bg-brand-50 border border-brand-950 font-bold text-center text-brand-950"
                />
                <span class="text-brand-600 font-medium">detik</span>
              </div>
            </div>
          </div>

          <!-- List Hero Slides -->
          <div class="space-y-4">
            <div
              v-for="(slide, sIdx) in settingsForm.hero_slides"
              :key="slide.id || sIdx"
              class="p-4 rounded-xl border border-brand-300 bg-[#fbfbfa] space-y-3"
            >
              <div class="flex items-center justify-between gap-3 pb-3 border-b border-brand-200">
                <div class="flex items-center gap-2.5 font-mono text-xs font-bold text-brand-950">
                  <span class="w-6 h-6 rounded-full bg-brand-950 text-scripture-gold flex items-center justify-center text-[11px]">
                    {{ sIdx + 1 }}
                  </span>
                  <span>SLIDE FOTO #{{ sIdx + 1 }}</span>
                </div>

                <button
                  type="button"
                  @click="removeHeroSlide(sIdx)"
                  :disabled="settingsForm.hero_slides.length <= 1"
                  class="text-xs font-mono text-rose-600 hover:text-rose-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>Hapus Slide</span>
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                <!-- Image Preview & Upload (Col 4) -->
                <div class="sm:col-span-4 space-y-2">
                  <div class="aspect-[4/5] sm:aspect-square w-full rounded-lg border-2 border-brand-950 overflow-hidden bg-brand-100 relative group">
                    <img
                      v-if="slide.image"
                      :src="slide.image"
                      alt="Hero Slide Preview"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex flex-col items-center justify-center text-brand-400 p-4 text-center">
                      <Camera class="w-8 h-8 mb-1" />
                      <span class="text-[11px] font-mono">Belum ada foto</span>
                    </div>
                  </div>

                  <label class="cursor-pointer w-full py-2 bg-white hover:bg-brand-50 border border-brand-300 rounded font-mono text-xs text-brand-900 flex items-center justify-center gap-1.5 shadow-2xs">
                    <Upload class="w-3.5 h-3.5 text-brand-600" />
                    <span>{{ isUploadingHeroSlide ? 'Mengunggah...' : 'Upload Foto Baru' }}</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      :disabled="isUploadingHeroSlide"
                      @change="(e) => handleHeroSlideUpload(e, sIdx)"
                    />
                  </label>
                </div>

                <!-- Inputs (Col 8) -->
                <div class="sm:col-span-8 space-y-3 font-mono text-xs">
                  <div class="space-y-1">
                    <label class="block uppercase tracking-wider text-brand-700 font-bold text-[11px]">
                      URL Gambar (Bisa diisi link atau gunakan tombol Upload di samping)
                    </label>
                    <input
                      v-model="slide.image"
                      type="text"
                      placeholder="/hero-product.jpg atau https://..."
                      class="w-full px-3 py-1.5 bg-white border border-brand-300 rounded text-brand-950 font-sans text-xs"
                    />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="block uppercase tracking-wider text-brand-700 font-bold text-[11px]">
                        Teks Stiker Slap (Kuning)
                      </label>
                      <input
                        v-model="slide.badge"
                        type="text"
                        placeholder="★ 16S ULTRA HEAVY"
                        class="w-full px-3 py-1.5 bg-white border border-brand-300 rounded text-brand-950 font-bold"
                      />
                    </div>

                    <div class="space-y-1">
                      <label class="block uppercase tracking-wider text-brand-700 font-bold text-[11px]">
                        Kode Arsip / Tag
                      </label>
                      <input
                        v-model="slide.tag"
                        type="text"
                        placeholder="REF. BT-HERO-01"
                        class="w-full px-3 py-1.5 bg-white border border-brand-300 rounded text-brand-950 font-medium"
                      />
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="block uppercase tracking-wider text-brand-700 font-bold text-[11px]">
                      Caption Footer Bingkai
                    </label>
                    <input
                      v-model="slide.caption"
                      type="text"
                      placeholder="BIBLE TALK ARCHIVE // 2026"
                      class="w-full px-3 py-1.5 bg-white border border-brand-300 rounded text-brand-950 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tombol Tambah Slide Baru -->
          <button
            type="button"
            @click="addHeroSlide"
            class="w-full py-2.5 border-2 border-dashed border-brand-400 hover:border-brand-900 rounded-xl text-brand-800 hover:text-brand-950 font-mono text-xs uppercase font-bold flex items-center justify-center gap-2 hover:bg-brand-50/50 transition-colors"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Slide Foto Hero Baru</span>
          </button>
        </div>

        <!-- SISTEM ROLLING CONTACT PERSON (CP) WHATSAPP - WIB BASED -->
        <div class="border border-brand-300 rounded-xl bg-white p-5 sm:p-6 space-y-6 shadow-sm">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-200">
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-brand-100 border border-brand-300 text-brand-800 font-mono text-[11px] uppercase tracking-wider mb-1">
                <Clock class="w-3.5 h-3.5 text-brand-700" />
                <span>Rolling Shift CS • Standar Waktu WIB (UTC+7)</span>
              </div>
              <h3 class="font-serif font-bold text-lg text-brand-950 uppercase tracking-tight">
                Pengaturan Shift Contact Person (CP) WhatsApp
              </h3>
              <p class="text-xs text-brand-600 font-sans mt-0.5">
                Nomor WhatsApp pemesanan akan otomatis berganti ke nomor CP yang bertugas sesuai jadwal jam WIB.
              </p>
            </div>

            <!-- Toggle Shift Master -->
            <label class="flex items-center gap-2.5 cursor-pointer bg-brand-50 border border-brand-300 px-3 py-2 rounded-lg hover:border-brand-400 select-none">
              <input
                type="checkbox"
                v-model="settingsForm.whatsapp_shifts_enabled"
                class="w-4 h-4 accent-emerald-600 rounded"
              />
              <span class="font-mono text-xs font-semibold" :class="settingsForm.whatsapp_shifts_enabled ? 'text-emerald-700' : 'text-brand-500'">
                {{ settingsForm.whatsapp_shifts_enabled ? 'Sistem Shift Aktif' : 'Shift Dinonaktifkan' }}
              </span>
            </label>
          </div>

          <!-- Live WIB Status Preview Banner -->
          <div class="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-xs"
            :class="settingsForm.whatsapp_shifts_enabled ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'"
          >
            <div class="flex items-center gap-3">
              <div class="relative flex h-3 w-3">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  :class="settingsForm.whatsapp_shifts_enabled ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                <span class="relative inline-flex rounded-full h-3 w-3"
                  :class="settingsForm.whatsapp_shifts_enabled ? 'bg-emerald-500' : 'bg-amber-500'"></span>
              </div>
              <div>
                <div class="font-bold flex items-center gap-2">
                  <span>WAKTU SAAT INI:</span>
                  <span class="bg-white px-2 py-0.5 rounded border text-brand-950 font-mono tracking-wider font-bold">
                    {{ currentWIB.formattedTime }}:{{ String(currentWIB.second).padStart(2, '0') }} WIB
                  </span>
                </div>
                <div class="text-[11px] mt-1 text-brand-700">
                  <span class="text-brand-500">Sedang Melayani:</span>
                  <strong class="text-brand-950 ml-1.5">{{ currentActiveCPInAdmin.displayText }}</strong>
                  <span class="ml-2 text-brand-600 font-mono">({{ currentActiveCPInAdmin.whatsapp_number }})</span>
                </div>
              </div>
            </div>

            <div class="self-start sm:self-auto">
              <span class="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border"
                :class="settingsForm.whatsapp_shifts_enabled ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-amber-100 border-amber-300 text-amber-800'"
              >
                {{ settingsForm.whatsapp_shifts_enabled ? 'Live WIB Routing' : 'Menggunakan No. Fallback' }}
              </span>
            </div>
          </div>

          <!-- Shifts List -->
          <div v-if="settingsForm.whatsapp_shifts_enabled" class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-mono text-xs uppercase tracking-widest text-brand-950 font-bold flex items-center gap-2">
                <span>Daftar Shift Kerja CP</span>
                <span class="text-[11px] font-normal text-brand-500">({{ settingsForm.whatsapp_shifts?.length || 0 }} shift terdaftar)</span>
              </h4>

              <button
                type="button"
                @click="addShift"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider bg-brand-950 hover:bg-brand-900 text-scripture-gold border-2 border-brand-950 shadow-[2px_2px_0px_#153227] transition-all"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Tambah Shift</span>
              </button>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div
                v-for="(shift, idx) in settingsForm.whatsapp_shifts"
                :key="shift.id || idx"
                class="p-4 sm:p-5 border-2 border-brand-950 transition-all bg-white shadow-[2px_2px_0px_#153227]"
                :class="[
                  shift.is_active !== false
                    ? 'opacity-100'
                    : 'bg-brand-100/40 opacity-70'
                ]"
              >
                <!-- Card Top Row: Badge, Name Input, Status & Delete Button -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b-2 border-brand-950">
                  <div class="flex items-center gap-3 flex-grow max-w-md">
                    <span class="w-7 h-7 bg-brand-950 text-scripture-gold font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-brand-950">
                      {{ idx + 1 }}
                    </span>
                    <div class="flex-grow">
                      <label class="block text-[10px] font-mono uppercase tracking-wider text-brand-700 font-bold mb-1">
                        Nama / Label Shift CP
                      </label>
                      <input
                        v-model="shift.name"
                        type="text"
                        placeholder="Contoh: CP 1 (Shift Pagi)"
                        class="w-full px-3 py-1.5 bg-white border-2 border-brand-950 font-bold text-sm text-brand-950 focus:outline-none"
                      />
                    </div>
                  </div>

                  <!-- Toggle Aktif & Tombol Hapus -->
                  <div class="flex items-center gap-2.5 self-end sm:self-center">
                    <label class="flex items-center gap-2 cursor-pointer text-xs font-mono select-none px-2.5 py-1.5 bg-white border-2 border-brand-950 shadow-[1px_1px_0px_#153227] transition-colors">
                      <input
                        type="checkbox"
                        v-model="shift.is_active"
                        class="w-4 h-4 accent-emerald-600 rounded-none"
                      />
                      <span :class="shift.is_active !== false ? 'text-emerald-800 font-bold' : 'text-brand-400 font-medium'">
                        {{ shift.is_active !== false ? 'Aktif' : 'Non-aktif' }}
                      </span>
                    </label>

                    <button
                      type="button"
                      @click="removeShift(idx)"
                      class="p-1.5 text-rose-900 bg-rose-100 hover:bg-rose-200 border-2 border-brand-950 shadow-[1px_1px_0px_#153227] transition-all"
                      title="Hapus shift ini"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Card Bottom Row: Jam Mulai, Jam Selesai, No. WhatsApp Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3.5 font-mono text-xs">
                  <!-- Jam Mulai -->
                  <div class="space-y-1">
                    <label class="block text-[11px] uppercase tracking-wider text-brand-950 font-bold">
                      Jam Mulai (WIB) <span class="text-rose-600">*</span>
                    </label>
                    <input
                      v-model="shift.start_time"
                      type="time"
                      required
                      class="w-full px-3 py-1.5 bg-white border-2 border-brand-950 text-sm text-brand-950 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <!-- Jam Selesai -->
                  <div class="space-y-1">
                    <label class="block text-[11px] uppercase tracking-wider text-brand-950 font-bold">
                      Jam Selesai (WIB) <span class="text-rose-600">*</span>
                    </label>
                    <input
                      v-model="shift.end_time"
                      type="time"
                      required
                      class="w-full px-3 py-1.5 bg-white border-2 border-brand-950 text-sm text-brand-950 font-mono font-bold focus:outline-none"
                    />
                  </div>

                  <!-- WhatsApp Number -->
                  <div class="space-y-1">
                    <label class="block text-[11px] uppercase tracking-wider text-brand-950 font-bold">
                      No. WhatsApp CP <span class="text-rose-600">*</span>
                    </label>
                    <div class="relative">
                      <Phone class="w-4 h-4 text-brand-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        v-model="shift.whatsapp_number"
                        type="text"
                        placeholder="6281234567890"
                        required
                        class="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-brand-950 text-sm text-brand-950 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Fallback / Master WhatsApp Number -->
          <div class="p-4 bg-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227] space-y-2">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label class="block font-mono text-xs text-brand-950 font-bold uppercase">
                Nomor WhatsApp Fallback / Cadangan Toko (Tanpa simbol +)
              </label>
              <span class="text-[10px] font-mono text-brand-500">
                Dipakai jika sistem shift dimatikan atau di luar rentang jam shift
              </span>
            </div>
            <div class="relative max-w-md">
              <Phone class="w-4 h-4 text-brand-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                v-model="settingsForm.whatsapp_number"
                type="text"
                placeholder="6281234567890"
                required
                class="w-full pl-9 pr-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono text-sm font-bold"
              />
            </div>
          </div>

        </div>

        <div class="space-y-1 font-mono">
          <label class="block uppercase font-bold text-brand-950">Link Instagram Resmi (URL / Handle)</label>
          <input
            v-model="settingsForm.instagram_url"
            type="text"
            placeholder="https://instagram.com/bibletalk.co"
            class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono"
          />
          <p class="text-[11px] text-brand-500 font-mono">
            Format URL lengkap, misal: https://instagram.com/bibletalk.co. Tombol Instagram di footer akan mengarah ke link ini.
          </p>
        </div>

        <div class="space-y-1 font-mono">
          <label class="block uppercase font-bold text-brand-950">Teks Announcement Bar (Running Text)</label>
          <input
            v-model="settingsForm.announcement_bar"
            type="text"
            class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950"
          />
        </div>

        <div class="space-y-1 font-mono">
          <label class="block uppercase font-bold text-brand-950">Tentang Brand (Bio / Manifesto)</label>
          <textarea
            v-model="settingsForm.about"
            rows="3"
            class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 leading-relaxed font-sans"
          ></textarea>
        </div>

        <div class="space-y-1 font-mono">
          <label class="block uppercase font-bold text-brand-950">Lokasi Produksi / Alamat Workshop</label>
          <input
            v-model="settingsForm.address"
            type="text"
            placeholder="Kabupaten Ngawi, Jawa Timur - Indonesia"
            class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950"
          />
        </div>

        <button
          type="submit"
          :disabled="actionLoading"
          class="px-6 py-2.5 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono uppercase font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
          <span>Simpan Perubahan Pengaturan</span>
        </button>
      </form>
    </div>

    <!-- TAB 3: EDITORIAL LOOKBOOK MANAGEMENT -->
    <div v-else-if="activeTab === 'lookbook'" class="max-w-5xl bg-white border-2 border-brand-950 shadow-[4px_4px_0px_#153227] p-6 sm:p-8 space-y-6">
      <div class="border-b-2 border-brand-950 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-sans font-black text-xl text-brand-950 uppercase tracking-tight">
            Kustomisasi Banner Beranda & Editorial Lookbook
          </h2>
          <p class="font-mono text-xs text-brand-600 mt-0.5">
            Semua elemen pada banner di Beranda (foto, stiker, judul, narasi, spek, dan tombol) dapat diubah langsung di satu tempat ini.
          </p>
        </div>
        <button
          type="button"
          @click="handleSaveLookbook"
          :disabled="actionLoading"
          class="px-5 py-2 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono uppercase font-black text-xs border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 transition-all self-start sm:self-auto shrink-0 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
        >
          <Loader2 v-if="actionLoading" class="w-3.5 h-3.5 animate-spin" />
          <span>Simpan Perubahan</span>
        </button>
      </div>

      <form @submit.prevent="handleSaveLookbook" class="space-y-6 font-sans text-xs">
        
        <!-- SECTION 1: UNIFIED BANNER EDITOR WITH REAL-TIME LIVE PREVIEW -->
        <div class="border-2 border-brand-950 bg-[#faf8f4] p-4 sm:p-6 space-y-6 shadow-[3px_3px_0px_#153227]">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-brand-950/20 pb-3">
            <div>
              <h3 class="font-mono uppercase font-black text-sm text-brand-950 flex items-center gap-2">
                <span class="w-3 h-3 bg-scripture-gold border-2 border-brand-950 inline-block"></span>
                Tampilan & Pengaturan Banner Beranda (Home Centerfold)
              </h3>
              <p class="text-[11px] text-brand-600 font-mono mt-0.5">
                Lihat preview interaktif di bawah. Ketik atau ubah kolom di bawahnya untuk melihat perubahannya secara langsung.
              </p>
            </div>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-950 text-scripture-gold text-[10px] font-mono font-bold tracking-wider uppercase border border-brand-950 self-start sm:self-auto shadow-[1px_1px_0px_#153227]">
              <Eye class="w-3.5 h-3.5" />
              <span>Live Real-Time Preview</span>
            </span>
          </div>

          <!-- THE LIVE PREVIEW CARD -->
          <div class="space-y-1.5">
            <span class="block font-mono text-[10px] uppercase font-bold text-brand-700 tracking-wider">
              ✦ Preview Banner di Beranda (Tampilan Langsung):
            </span>
            <div class="bg-white border-2 border-brand-950 shadow-[4px_4px_0px_#153227] overflow-hidden">
              <div class="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <!-- Preview Image Frame with Action to Change Photo -->
                <div class="lg:col-span-6 relative min-h-[220px] sm:min-h-[280px] bg-brand-100 border-b-2 lg:border-b-0 lg:border-r-2 border-brand-950 flex items-center justify-center overflow-hidden">
                  <img
                    v-if="lookbookPreviewImage"
                    :src="lookbookPreviewImage"
                    alt="Preview Editorial"
                    class="w-full h-full object-cover filter contrast-105"
                  />
                  <div v-else class="flex flex-col items-center justify-center p-6 text-center text-brand-400">
                    <Camera class="w-8 h-8 opacity-40 mb-1 text-brand-950" />
                    <span class="font-mono text-xs uppercase font-bold text-brand-950">Foto Belum Diunggah</span>
                    <span class="font-mono text-[10px] text-brand-500">Klik tombol di bawah untuk memilih foto</span>
                  </div>

                  <!-- Stamped Sticker on Preview -->
                  <div class="absolute top-3 left-3 z-10 -rotate-2">
                    <span class="px-2 py-0.5 bg-brand-950 text-scripture-gold font-mono font-black text-[10px] uppercase border-2 border-white shadow-[2px_2px_0px_#f5b025]">
                      {{ lookbookForm.banner_badge || '✦ 35MM EDITORIAL ARCHIVE' }}
                    </span>
                  </div>

                  <!-- Quick Change Cover Button Overlay -->
                  <div class="absolute bottom-3 right-3 z-10">
                    <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-brand-50 text-brand-950 font-mono text-[10px] font-bold uppercase border-2 border-brand-950 shadow-[2px_2px_0px_#153227] transition-all">
                      <Camera class="w-3.5 h-3.5 text-brand-950" />
                      <span>{{ isUploadingLookbookGallery ? 'Mengunggah...' : 'Ganti Foto Banner' }}</span>
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        :disabled="isUploadingLookbookGallery"
                        @change="handleBannerCoverUpload"
                      />
                    </label>
                  </div>
                </div>

                <!-- Preview Content -->
                <div class="lg:col-span-6 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-white">
                  <div class="space-y-2">
                    <div class="inline-flex items-center gap-1.5 font-mono text-[10px] text-brand-950 uppercase font-bold tracking-wider">
                      <span class="w-2 h-2 bg-scripture-gold border border-brand-950"></span>
                      <span>{{ lookbookForm.banner_tagline || 'EDITORIAL ARCHIVE' }} // {{ lookbookForm.season || 'SEASON 2026' }}</span>
                    </div>
                    <h3 class="font-sans font-black text-xl sm:text-2xl text-brand-950 uppercase tracking-tight leading-tight">
                      {{ lookbookForm.title || 'GENESIS & CONCRETE YOUTH' }}
                    </h3>
                    <p class="text-brand-800 text-xs leading-relaxed font-sans line-clamp-3">
                      {{ lookbookForm.description || 'Eksplorasi kontras antara visual scripture klasik dan lanskap urban underground brutalist. Didokumentasikan di jalanan urban malam hari.' }}
                    </p>

                    <!-- Preview Quick Specs -->
                    <div class="grid grid-cols-2 gap-2 pt-2 font-mono text-[10px] text-brand-700 border-t border-brand-950/15">
                      <div>
                        <span class="text-brand-500 block uppercase font-bold">{{ lookbookForm.spec1_label || 'MEDIUM' }}</span>
                        <span class="font-bold text-brand-950">{{ lookbookForm.spec1_val || '35mm Kodak Tri-X' }}</span>
                      </div>
                      <div>
                        <span class="text-brand-500 block uppercase font-bold">{{ lookbookForm.spec2_label || 'ARCHIVE' }}</span>
                        <span class="font-bold text-brand-950">{{ lookbookForm.spec2_val || ('Vol. 01 / ' + (lookbookForm.gallery?.length || 0) + ' Looks') }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Preview Action Buttons -->
                  <div class="pt-2 flex items-center gap-2 flex-wrap pointer-events-none">
                    <div class="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[11px] uppercase font-black bg-brand-950 text-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227]">
                      <span>{{ lookbookForm.btn1_text || 'Buka Full Lookbook' }}</span>
                      <ArrowRight class="w-3.5 h-3.5 text-scripture-gold" />
                    </div>
                    <div class="inline-flex items-center px-3 py-2 font-mono text-[11px] uppercase font-bold text-brand-950 border border-brand-950 bg-brand-50">
                      <span>{{ lookbookForm.btn2_text || 'Lihat Katalog' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- UNIFIED FORM FIELDS FOR THE ENTIRE BANNER -->
          <div class="space-y-4 pt-4 border-t-2 border-brand-950/20">
            <div class="flex items-center justify-between">
              <span class="block font-mono text-xs uppercase font-black text-brand-950 tracking-wider">
                ✎ Form Pengaturan Lengkap Banner Beranda:
              </span>
              <span class="text-[11px] text-brand-500 font-mono">
                Semua perubahan otomatis tampil di preview di atas
              </span>
            </div>

            <!-- Group 1: Judul & Season Tagline -->
            <div class="bg-white border-2 border-brand-950 p-4 shadow-[2px_2px_0px_#153227] space-y-3">
              <span class="block font-mono text-[11px] uppercase font-bold text-brand-950 border-b border-brand-950/15 pb-1.5">
                1. Judul & Tagline Atas
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1 font-mono">
                  <label class="block uppercase font-bold text-brand-950 text-[11px]">Judul Utama Koleksi *</label>
                  <input
                    v-model="lookbookForm.title"
                    type="text"
                    required
                    placeholder="Genesis & Concrete Youth"
                    class="w-full px-3 py-2 bg-[#faf8f4] border-2 border-brand-950 text-brand-950 font-bold"
                  />
                </div>

                <div class="space-y-1 font-mono">
                  <label class="block uppercase font-bold text-brand-950 text-[11px]">Tagline Season *</label>
                  <input
                    v-model="lookbookForm.season"
                    type="text"
                    required
                    placeholder="2026 EDITORIAL"
                    class="w-full px-3 py-2 bg-[#faf8f4] border-2 border-brand-950 text-brand-950"
                  />
                </div>
              </div>
            </div>

            <!-- Group 2: Stiker Foto & Awalan Tagline -->
            <div class="bg-white border-2 border-brand-950 p-4 shadow-[2px_2px_0px_#153227] space-y-3">
              <span class="block font-mono text-[11px] uppercase font-bold text-brand-950 border-b border-brand-950/15 pb-1.5">
                2. Teks Stiker Foto & Awalan Kategori
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1 font-mono">
                  <label class="block uppercase font-bold text-brand-950 text-[11px]">Teks Stiker Foto (Pojok Kiri Atas Foto)</label>
                  <input
                    v-model="lookbookForm.banner_badge"
                    type="text"
                    placeholder="✦ 35MM EDITORIAL ARCHIVE"
                    class="w-full px-3 py-2 bg-[#faf8f4] border-2 border-brand-950 text-brand-950 font-bold"
                  />
                </div>

                <div class="space-y-1 font-mono">
                  <label class="block uppercase font-bold text-brand-950 text-[11px]">Awalan Tagline (Sebelum // Season)</label>
                  <input
                    v-model="lookbookForm.banner_tagline"
                    type="text"
                    placeholder="EDITORIAL ARCHIVE"
                    class="w-full px-3 py-2 bg-[#faf8f4] border-2 border-brand-950 text-brand-950"
                  />
                </div>
              </div>
            </div>

            <!-- Group 3: Deskripsi Narasi -->
            <div class="bg-white border-2 border-brand-950 p-4 shadow-[2px_2px_0px_#153227] space-y-2">
              <span class="block font-mono text-[11px] uppercase font-bold text-brand-950 border-b border-brand-950/15 pb-1.5">
                3. Deskripsi / Narasi Cerita Koleksi
              </span>
              <textarea
                v-model="lookbookForm.description"
                rows="3"
                placeholder="Eksplorasi kontras antara visual scripture klasik dan lanskap urban underground brutalist. Didokumentasikan di jalanan urban malam hari."
                class="w-full px-3 py-2 bg-[#faf8f4] border-2 border-brand-950 text-brand-950 leading-relaxed font-sans"
              ></textarea>
            </div>

            <!-- Group 4: Quick Specs -->
            <div class="bg-white border-2 border-brand-950 p-4 shadow-[2px_2px_0px_#153227] space-y-3">
              <span class="block font-mono text-[11px] uppercase font-bold text-brand-950 border-b border-brand-950/15 pb-1.5">
                4. Baris Spesifikasi (Quick Specs)
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="bg-brand-50/50 border border-brand-950 p-3 space-y-2">
                  <span class="block font-mono uppercase font-bold text-[10px] text-brand-950">Spesifikasi 1 (Kiri)</span>
                  <div class="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <label class="block text-[10px] text-brand-500 uppercase">Label</label>
                      <input
                        v-model="lookbookForm.spec1_label"
                        type="text"
                        placeholder="MEDIUM"
                        class="w-full px-2 py-1.5 bg-white border border-brand-950 text-brand-950 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-brand-500 uppercase">Nilai / Isi</label>
                      <input
                        v-model="lookbookForm.spec1_val"
                        type="text"
                        placeholder="35mm Kodak Tri-X"
                        class="w-full px-2 py-1.5 bg-white border border-brand-950 text-brand-950 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div class="bg-brand-50/50 border border-brand-950 p-3 space-y-2">
                  <span class="block font-mono uppercase font-bold text-[10px] text-brand-950">Spesifikasi 2 (Kanan)</span>
                  <div class="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <label class="block text-[10px] text-brand-500 uppercase">Label</label>
                      <input
                        v-model="lookbookForm.spec2_label"
                        type="text"
                        placeholder="ARCHIVE"
                        class="w-full px-2 py-1.5 bg-white border border-brand-950 text-brand-950 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-brand-500 uppercase">Nilai / Isi</label>
                      <input
                        v-model="lookbookForm.spec2_val"
                        type="text"
                        placeholder="Vol. 01 / 8 Looks (Kosong = Otomatis)"
                        class="w-full px-2 py-1.5 bg-white border border-brand-950 text-brand-950 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Group 5: Action Buttons Text -->
            <div class="bg-white border-2 border-brand-950 p-4 shadow-[2px_2px_0px_#153227] space-y-3">
              <span class="block font-mono text-[11px] uppercase font-bold text-brand-950 border-b border-brand-950/15 pb-1.5">
                5. Teks Tombol Aksi (CTA Buttons)
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-1 font-mono">
                  <label class="block uppercase font-bold text-brand-950 text-[11px]">Teks Tombol Utama</label>
                  <input
                    v-model="lookbookForm.btn1_text"
                    type="text"
                    placeholder="Buka Full Lookbook"
                    class="w-full px-3 py-2 bg-[#faf8f4] border-2 border-brand-950 text-brand-950 font-bold"
                  />
                </div>

                <div class="space-y-1 font-mono">
                  <label class="block uppercase font-bold text-brand-950 text-[11px]">Teks Tombol Sekunder</label>
                  <input
                    v-model="lookbookForm.btn2_text"
                    type="text"
                    placeholder="Lihat Katalog"
                    class="w-full px-3 py-2 bg-[#faf8f4] border-2 border-brand-950 text-brand-950 font-bold"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>



        <!-- Gallery Uploader -->
        <div class="space-y-3 border-t-2 border-brand-950/20 pt-5">
          <div class="flex items-center justify-between">
            <div>
              <label class="block font-mono text-brand-950 uppercase font-bold text-xs">Galeri Foto Editorial (Tampil di Home & Lookbook)</label>
              <p class="text-[11px] text-brand-500 font-mono">Foto model pakaian tampak depan, samping, dan detail.</p>
            </div>
            
            <label class="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-950 hover:bg-brand-900 border-2 border-brand-950 text-scripture-gold font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#153227] transition-all">
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

          <!-- Gallery Photos Grid (Fully Customizable per Frame) -->
          <div v-if="lookbookForm.gallery && lookbookForm.gallery.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div
              v-for="(item, idx) in lookbookForm.gallery"
              :key="idx"
              class="bg-[#faf8f4] border-2 border-brand-950 overflow-hidden flex flex-col justify-between shadow-[3px_3px_0px_#153227] transition-all"
            >
              <!-- Media Box & Live Badge Preview -->
              <div class="relative aspect-[16/9] bg-brand-900/10 overflow-hidden border-b-2 border-brand-950 group">
                <img :src="typeof item === 'string' ? item : item.url" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                <button
                  type="button"
                  @click="removeLookbookGalleryImage(idx)"
                  class="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white border border-brand-950 shadow-[2px_2px_0px_#000] transition-colors z-20"
                  title="Hapus Foto Ini"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>

                <div class="absolute bottom-2 left-2 flex items-center gap-1.5 z-20">
                  <span class="px-2 py-0.5 bg-brand-950 text-scripture-gold text-[10px] font-mono font-bold uppercase border border-brand-950 shadow-xs">
                    Frame #{{ idx + 1 }}
                  </span>
                  <span class="px-2 py-0.5 bg-white text-brand-950 text-[10px] font-mono font-black uppercase border border-brand-950 shadow-xs">
                    {{ item.lookCode || `LOOK 0${idx + 1}` }}
                  </span>
                </div>

                <div class="absolute bottom-2 right-2 z-20">
                  <span class="px-2 py-0.5 bg-scripture-gold text-brand-950 text-[10px] font-mono font-black uppercase border border-brand-950 shadow-xs">
                    {{ item.verse || 'MATTHEW 5:14' }}
                  </span>
                </div>
              </div>

              <!-- Form Fields for this Photo -->
              <div class="p-3.5 space-y-2.5 bg-white text-xs font-mono">
                
                <!-- Title & Look Code -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div class="sm:col-span-2 space-y-1">
                    <label class="block text-[10px] text-brand-950 uppercase font-black">
                      Judul Artikel / Look *
                    </label>
                    <input
                      v-model="item.title"
                      type="text"
                      placeholder="Misal: THE LAST SUPPER #1"
                      class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs font-bold shadow-xs placeholder:text-brand-400 placeholder:font-normal"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="block text-[10px] text-brand-950 uppercase font-black">
                      Kode Look
                    </label>
                    <input
                      v-model="item.lookCode"
                      type="text"
                      :placeholder="`LOOK 0${idx + 1}`"
                      class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs font-bold shadow-xs placeholder:text-brand-400 uppercase"
                    />
                  </div>
                </div>

                <!-- Verse & Material Spec Row -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <!-- Scripture Verse -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="text-[10px] text-brand-950 uppercase font-black">Ayat Firman</label>
                      <span class="text-[9px] text-brand-400">Badge Kanan</span>
                    </div>
                    <input
                      v-model="item.verse"
                      type="text"
                      placeholder="Misal: MATTHEW 5:14"
                      class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs font-bold shadow-xs placeholder:text-brand-400 uppercase"
                    />
                  </div>

                  <!-- Material Spec -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="text-[10px] text-brand-950 uppercase font-black">Spesifikasi Kain (Spec 1)</label>
                      <span class="text-[9px] text-brand-400">Checklist 1</span>
                    </div>
                    <input
                      v-model="item.spec"
                      type="text"
                      placeholder="Misal: 16s COMBED COTTON 235+ GSM"
                      class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs font-bold shadow-xs placeholder:text-brand-400 uppercase"
                    />
                  </div>
                </div>

                <!-- Silhouette / Fit -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] text-brand-950 uppercase font-black">Siluet / Potongan (Spec 2)</label>
                    <span class="text-[9px] text-brand-400">Checklist 2</span>
                  </div>
                  <input
                    v-model="item.fit"
                    type="text"
                    placeholder="Misal: Boxy Drop-Shoulder Silhouette"
                    class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs font-bold shadow-xs placeholder:text-brand-400"
                  />
                </div>

                <!-- Caption / Narrative -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] text-brand-950 uppercase font-black">Deskripsi Detail Foto</label>
                    <span class="text-[9px] text-brand-400">Teks narasi di Lightbox</span>
                  </div>
                  <textarea
                    v-model="item.caption"
                    rows="2"
                    placeholder="Misal: Kaos oversized grafis perjamuan kudus dengan teknik discharge plastisol..."
                    class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs shadow-xs leading-relaxed font-sans placeholder:font-mono placeholder:text-xs"
                  ></textarea>
                </div>

              </div>
            </div>
          </div>
          <div v-else class="p-8 border-2 border-dashed border-brand-950/40 bg-white text-center font-mono text-xs text-brand-500">
            Belum ada foto galeri lookbook. Klik tombol "+ Tambah Foto" di atas untuk menambahkan.
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-4 border-t-2 border-brand-950/20 flex justify-end">
          <button
            type="submit"
            :disabled="actionLoading || isUploadingLookbookGallery"
            class="px-8 py-3 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono text-xs uppercase font-black tracking-widest border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5"
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
      <div class="border-b-2 border-brand-950 pb-3">
        <h2 class="font-sans font-black text-xl text-brand-950 uppercase tracking-tight">
          Kategori Pakaian & Koleksi Homepage
        </h2>
        <p class="font-mono text-xs text-brand-600 mt-0.5">
          Kelola master kategori pakaian untuk produk di katalog, dan atur kartu showcase "Kategori Koleksi" yang tampil di Beranda.
        </p>
      </div>

      <!-- Sub-Tab Navigation Pills -->
      <div class="flex items-center gap-2 border-b-2 border-brand-950 pb-3 font-mono text-xs overflow-x-auto">
        <button
          type="button"
          @click="activeCategorySubTab = 'showcase'"
          class="px-4 py-2 uppercase border-2 border-brand-950 font-bold transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#153227]"
          :class="activeCategorySubTab === 'showcase' ? 'bg-brand-950 text-scripture-gold -rotate-0.5' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span>✦ Kartu Koleksi Homepage ({{ showcaseCardsList.length }})</span>
        </button>

        <button
          type="button"
          @click="activeCategorySubTab = 'master'"
          class="px-4 py-2 uppercase border-2 border-brand-950 font-bold transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#153227]"
          :class="activeCategorySubTab === 'master' ? 'bg-brand-950 text-scripture-gold -rotate-0.5' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <FolderTree class="w-3.5 h-3.5" />
          <span>📁 Master Kategori Pakaian ({{ categoriesList.length }})</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- VIEW 1: HOMEPAGE SHOWCASE CARDS (Koleksi Beranda Berdasarkan Kategori)     -->
      <!-- ========================================================================= -->
      <div v-if="activeCategorySubTab === 'showcase'" class="space-y-6">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
          <div>
            <span class="font-mono text-xs font-bold text-brand-950 uppercase block">
              Pengaturan Kartu Koleksi di Homepage
            </span>
            <p class="text-[11px] text-brand-600 mt-0.5 font-sans">
              Setiap kartu di bawah ini terhubung ke salah satu <strong>Master Kategori</strong> pakaian. Anda bisa mengubah kategori yang dihubungkan, foto editorial, badge (HOT DROP, BESTSELLER), sub-tag, dan tombol aksi.
            </p>
          </div>

          <button
            type="button"
            @click="openAddShowcaseModal"
            class="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono text-xs uppercase font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 flex-shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Kartu Koleksi</span>
          </button>
        </div>

        <!-- Showcase Cards Grid (Preview exact homepage card look!) -->
        <div v-if="showcaseCardsList.length === 0" class="p-12 text-center bg-white border-2 border-dashed border-brand-950/40 font-mono text-xs text-brand-500">
          Belum ada kartu koleksi untuk Homepage. Klik "+ Tambah Kartu Koleksi" untuk menambahkan.
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="card in showcaseCardsList"
            :key="card.id"
            class="group relative bg-white border-2 border-brand-950 shadow-[3px_3px_0px_#153227] overflow-hidden flex flex-col justify-between transition-transform duration-200"
          >
            <div>
              <!-- Image Frame -->
              <div class="relative aspect-[4/5] overflow-hidden bg-brand-100 border-b-2 border-brand-950">
                <img
                  :src="card.image"
                  :alt="card.title"
                  class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <!-- Top Badge -->
                <div class="absolute top-3 left-3">
                  <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-white text-brand-950 font-bold border border-brand-950">
                    {{ card.badge || 'COLLECTION' }}
                  </span>
                </div>

                <!-- Sort Order Badge -->
                <div class="absolute top-3 right-3">
                  <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-brand-950 text-scripture-gold font-bold border border-brand-950">
                    #{{ card.sort_order }}
                  </span>
                </div>

                <!-- Bottom Floating Overlay Title -->
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <span class="font-mono text-[10px] uppercase tracking-widest text-scripture-gold block mb-0.5 font-bold">
                    {{ card.tag || 'SHOWCASE' }}
                  </span>
                  <h3 class="font-sans font-black text-xl uppercase leading-tight tracking-wide drop-shadow-sm">
                    {{ card.title }}
                  </h3>
                </div>
              </div>

              <!-- Linked Category Banner -->
              <div class="px-3.5 py-2 bg-brand-100 border-b-2 border-brand-950 text-[11px] font-mono text-brand-950 flex items-center gap-1.5">
                <LinkIcon class="w-3.5 h-3.5 text-brand-700 flex-shrink-0" />
                <span class="truncate">
                  Kategori: <strong>{{ card.category_name }}</strong> (<code>/{{ card.category_slug }}</code>)
                </span>
              </div>

              <!-- Meta & Description -->
              <div class="p-4 space-y-3 bg-white font-mono text-xs">
                <p class="text-brand-700 leading-relaxed font-sans line-clamp-2">
                  {{ card.description || 'Tidak ada deskripsi' }}
                </p>

                <div class="flex items-center justify-between text-[11px] text-brand-600 border-t border-brand-200 pt-2 font-mono">
                  <span>Tombol Home:</span>
                  <span class="text-brand-950 font-bold">"Jelajahi {{ card.button_text }}"</span>
                </div>
              </div>
            </div>

            <!-- Card Action Buttons -->
            <div class="p-3 bg-white border-t-2 border-brand-950 flex items-center justify-end gap-2 font-mono">
              <button
                @click="openEditShowcaseModal(card)"
                class="px-3 py-1.5 bg-brand-950 hover:bg-brand-900 text-scripture-gold text-xs uppercase font-bold border-2 border-brand-950 shadow-[1px_1px_0px_#153227] flex items-center gap-1 transition-all active:translate-x-0.5 active:translate-y-0.5"
                title="Edit Tampilan & Kategori Terkait"
              >
                <Edit class="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                @click="handleDeleteShowcaseCard(card)"
                class="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-brand-950 shadow-[1px_1px_0px_#153227] transition-all active:translate-x-0.5 active:translate-y-0.5"
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
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
          <div>
            <span class="font-mono text-xs font-bold text-brand-950 uppercase block">
              Daftar Master Kategori Pakaian
            </span>
            <p class="text-[11px] text-brand-600 mt-0.5 font-sans">
              Daftar kategori utama yang digunakan saat membuat/mengedit pakaian di Katalog. Kategori yang Anda tambahkan di sini bisa langsung dipilih pada produk dan kartu koleksi Homepage.
            </p>
          </div>

          <button
            type="button"
            @click="openAddMasterCategoryModal"
            class="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono text-xs uppercase font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 flex-shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Master Kategori</span>
          </button>
        </div>

        <!-- Master Categories Table -->
        <div class="bg-white border-2 border-brand-950 shadow-[4px_4px_0px_#153227] overflow-hidden">
          <table class="w-full text-left font-sans text-xs">
            <thead class="bg-brand-950 text-scripture-gold font-mono uppercase border-b-2 border-brand-950 text-[11px]">
              <tr>
                <th class="p-3">Nama Kategori</th>
                <th class="p-3">Slug URL</th>
                <th class="p-3">Deskripsi</th>
                <th class="p-3">Produk Aktif</th>
                <th class="p-3">Status di Homepage</th>
                <th class="p-3 text-right">Aksi</th>
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
                <td class="p-3 font-bold text-brand-950 font-sans text-sm">
                  {{ cat.name }}
                </td>

                <!-- Slug -->
                <td class="p-3 font-mono text-brand-700">
                  <span class="px-2 py-0.5 bg-brand-100 border border-brand-950 text-[11px] font-bold">/{{ cat.slug }}</span>
                </td>

                <!-- Description -->
                <td class="p-3 text-brand-600 max-w-xs truncate">
                  {{ cat.description || '-' }}
                </td>

                <!-- Product count -->
                <td class="p-3 font-mono">
                  <span class="px-2 py-0.5 text-[11px] font-bold bg-white border border-brand-950 text-brand-950">
                    {{ getProductCountForCategory(cat.id) }} Artikel
                  </span>
                </td>

                <!-- Homepage status -->
                <td class="p-3 font-mono text-[11px]">
                  <span
                    v-if="isCategoryUsedInShowcase(cat)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 text-emerald-950 border border-brand-950 font-bold"
                  >
                    <Check class="w-3 h-3 text-emerald-900" />
                    <span>Aktif di Homepage</span>
                  </span>
                  <span v-else class="text-brand-400">
                    -
                  </span>
                </td>

                <!-- Delete Action -->
                <td class="p-3 text-right font-mono">
                  <button
                    @click="handleDeleteMasterCategory(cat)"
                    class="p-1.5 text-rose-900 bg-rose-100 hover:bg-rose-200 border-2 border-brand-950 shadow-[1px_1px_0px_#153227] transition-all active:translate-x-0.5 active:translate-y-0.5"
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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-950 pb-3">
        <div>
          <h2 class="font-sans font-black text-xl text-brand-950 uppercase tracking-tight">
            Kelola Paket Bundling Eksklusif
          </h2>
          <p class="font-mono text-xs text-brand-600 mt-0.5">
            Atur paket bundle spesial yang tampil di Beranda, termasuk foto, harga promo, teks hemat, dan item di dalam paket.
          </p>
        </div>

        <button
          type="button"
          @click="openAddBundleModal"
          class="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono text-xs uppercase font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 flex-shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Paket Bundle Baru</span>
        </button>
      </div>

      <!-- Bundles Admin Cards Grid -->
      <div v-if="bundlesList.length === 0" class="p-12 text-center bg-white border-2 border-dashed border-brand-950/40 font-mono text-xs text-brand-500">
        Belum ada paket bundling. Klik "+ Tambah Paket Bundle Baru" untuk membuat paket pertama.
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="b in bundlesList"
          :key="b.id"
          class="bg-white border-2 border-brand-950 shadow-[4px_4px_0px_#153227] overflow-hidden flex flex-col justify-between transition-transform duration-200"
        >
          <div>
            <!-- Media Preview -->
            <div class="relative aspect-[4/3] bg-brand-100 overflow-hidden border-b-2 border-brand-950">
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
                <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-brand-950 text-scripture-gold font-bold border border-brand-950">
                  {{ b.badge }}
                </span>
              </div>
              <div class="absolute top-2 right-2">
                <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-scripture-gold text-brand-950 font-black border border-brand-950">
                  {{ b.savingsText }}
                </span>
              </div>
            </div>

            <!-- Content Details -->
            <div class="p-4 space-y-3">
              <div>
                <h3 class="font-sans font-black text-base text-brand-950 uppercase leading-snug">
                  {{ b.title }}
                </h3>
                <p class="text-xs font-mono text-brand-600 line-clamp-2 mt-0.5">
                  {{ b.subtitle }}
                </p>
              </div>

              <!-- Price Box -->
              <div class="p-2.5 bg-brand-50 border-2 border-brand-950 flex items-baseline justify-between text-xs">
                <div>
                  <span class="font-mono text-brand-400 line-through block text-[10px]">
                    {{ catalogStore.formatPrice(b.originalPrice) }}
                  </span>
                  <span class="font-mono text-sm font-black text-brand-950">
                    {{ catalogStore.formatPrice(b.bundlePrice) }}
                  </span>
                </div>
                <span class="text-[10px] font-mono font-bold text-emerald-950 bg-emerald-200 px-2 py-0.5 border border-brand-950">
                  {{ b.savingsText }}
                </span>
              </div>

              <!-- Item count & snippet -->
              <div class="space-y-1.5 pt-1">
                <span class="text-[10px] font-mono uppercase tracking-wider text-brand-950 font-bold block">
                  Isi Item Paket ({{ b.items?.length || 0 }} item):
                </span>
                <ul class="space-y-1 text-xs text-brand-800 font-mono">
                  <li v-for="(it, iIdx) in (b.items || []).slice(0, 3)" :key="iIdx" class="flex items-center gap-1.5 truncate">
                    <span class="w-1.5 h-1.5 bg-brand-950 flex-shrink-0"></span>
                    <span class="truncate font-semibold">{{ it.name }}</span>
                  </li>
                  <li v-if="(b.items?.length || 0) > 3" class="text-[10px] font-mono text-brand-500">
                    +{{ b.items.length - 3 }} item lainnya
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="p-3 bg-white border-t-2 border-brand-950 flex items-center justify-between gap-2 font-mono">
            <span class="text-[10px] font-mono text-brand-600 font-bold">Urutan: #{{ b.sort_order }}</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="openEditBundleModal(b)"
                class="px-3 py-1.5 bg-brand-950 hover:bg-brand-900 text-scripture-gold border-2 border-brand-950 shadow-[1px_1px_0px_#153227] font-mono text-xs uppercase font-bold flex items-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                <Edit class="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                @click="handleDeleteBundle(b)"
                class="p-1.5 text-rose-900 bg-rose-100 hover:bg-rose-200 border-2 border-brand-950 shadow-[1px_1px_0px_#153227] transition-all active:translate-x-0.5 active:translate-y-0.5"
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
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-brand-950/70 backdrop-blur-sm"
      @click.self="isModalOpen = false"
    >
      <div class="bg-white border-2 border-brand-950 shadow-[8px_8px_0px_#153227] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        <!-- Modal Header (Always Pinned at Top) -->
        <div class="px-6 py-4 border-b-2 border-brand-950 flex items-center justify-between flex-shrink-0 bg-brand-950 text-scripture-gold">
          <div class="flex items-center gap-2.5">
            <span class="text-scripture-gold font-serif">✦</span>
            <h3 class="font-sans font-black text-lg sm:text-xl text-scripture-gold uppercase tracking-tight">
              {{ isEditing ? 'Edit Artikel Pakaian' : 'Tambah Artikel Baru' }}
            </h3>
          </div>
          <button
            @click="isModalOpen = false"
            class="p-1 text-scripture-gold hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Modal"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body (Scrollable Container) -->
        <form @submit.prevent="handleSaveProduct" id="productForm" class="p-6 overflow-y-auto flex-grow space-y-5 text-xs font-sans">
          
          <!-- Basic Info -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Judul Pakaian *</label>
              <input
                v-model="form.title"
                @input="generateSlug"
                type="text"
                required
                placeholder="Heavyweight Boxy Tee - 'Grace & Chaos'"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-bold focus:outline-none"
              />
            </div>

            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Slug URL (Unik) *</label>
              <input
                v-model="form.slug"
                type="text"
                required
                placeholder="heavyweight-boxy-tee"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono focus:outline-none"
              />
            </div>

            <div class="space-y-1 font-mono">
              <div class="flex items-center justify-between">
                <label class="block uppercase font-bold text-brand-950">Kategori Pakaian</label>
                <span class="text-[10px] text-brand-500">Master Kategori</span>
              </div>
              <select
                v-model="form.category_id"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono cursor-pointer focus:outline-none"
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

            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Harga (IDR) *</label>
              <input
                v-model="form.price"
                type="number"
                required
                min="0"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1 font-mono">
            <label class="block uppercase font-bold text-brand-950">Deskripsi Pakaian</label>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="Jelaskan pesan firman, bahan, dan vibe baju..."
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-sans leading-relaxed focus:outline-none"
            ></textarea>
          </div>

          <!-- Specifications (Details) -->
          <div class="p-4 bg-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227] space-y-3 font-mono">
            <span class="text-xs uppercase text-brand-950 font-black block">
              Integritas Kain & Spesifikasi
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] text-brand-700 uppercase font-bold block mb-0.5">Material Kain</label>
                <input
                  v-model="form.details.material"
                  placeholder="100% Heavyweight Cotton 16s (235 GSM)"
                  class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 focus:outline-none"
                />
              </div>
              <div>
                <label class="text-[10px] text-brand-700 uppercase font-bold block mb-0.5">Cutting / Fit</label>
                <input
                  v-model="form.details.fit"
                  placeholder="Boxy Cut Drop Shoulder"
                  class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 focus:outline-none"
                />
              </div>
              <div>
                <label class="text-[10px] text-brand-700 uppercase font-bold block mb-0.5">Sablon / Grafis</label>
                <input
                  v-model="form.details.print"
                  placeholder="High-Density Plastisol Discharge"
                  class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 focus:outline-none"
                />
              </div>
              <div>
                <label class="text-[10px] text-brand-700 uppercase font-bold block mb-0.5">Asal Produksi</label>
                <input
                  v-model="form.details.origin"
                  placeholder="Bandung, ID"
                  class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Variants & Stock Builder -->
          <div class="p-4 bg-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227] space-y-3 font-mono">
            <span class="text-xs uppercase text-brand-950 font-black block">
              Stok per Ukuran (Varian)
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="(v, idx) in form.variants" :key="idx" class="space-y-1">
                <label class="block text-xs text-brand-950 font-bold uppercase">Size {{ v.size }}</label>
                <input
                  v-model.number="v.stock"
                  type="number"
                  min="0"
                  placeholder="Stok"
                  class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Image Uploader Section -->
          <div class="space-y-2 font-mono">
            <span class="block uppercase font-bold text-brand-950">Foto Pakaian (Supabase Cloud Storage)</span>
            
            <!-- Upload trigger -->
            <div class="flex items-center gap-3">
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-950 hover:bg-brand-900 border-2 border-brand-950 text-scripture-gold font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#153227] transition-all">
                <Upload class="w-4 h-4 text-scripture-gold" />
                <span>{{ isUploadingImage ? 'Mengunggah ke Cloud...' : 'Unggah Foto Pakaian' }}</span>
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
                class="relative w-20 h-24 bg-brand-100 border-2 border-brand-950 shadow-[2px_2px_0px_#153227] overflow-hidden flex-shrink-0 group"
              >
                <img :src="img" class="w-full h-full object-cover" />
                <button
                  type="button"
                  @click="removeImage(idx)"
                  class="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white border border-brand-950 text-[10px] shadow"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Status & Featured -->
          <div class="flex items-center gap-6 pt-2 border-t-2 border-brand-950/20 font-mono">
            <div class="flex items-center gap-2">
              <label class="uppercase font-bold text-brand-950">Status:</label>
              <select
                v-model="form.status"
                class="px-3 py-1.5 bg-white border-2 border-brand-950 text-brand-950 font-mono font-bold focus:outline-none"
              >
                <option value="active">Active (Tampil di Katalog)</option>
                <option value="sold_out">Sold Out</option>
                <option value="pre_order">Pre-Order</option>
                <option value="draft">Draft (Sembunyikan)</option>
              </select>
            </div>

            <label class="flex items-center gap-2 cursor-pointer text-brand-950 select-none font-bold">
              <input type="checkbox" v-model="form.is_featured" class="w-4 h-4 accent-brand-950" />
              <span>Jadikan Rilisan Pilihan (Featured)</span>
            </label>
          </div>

        </form>

        <!-- Modal Footer (Always Pinned at Bottom) -->
        <div class="px-6 py-4 border-t-2 border-brand-950 bg-brand-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-5 py-2.5 font-mono text-xs uppercase font-bold text-brand-950 hover:bg-brand-100 border-2 border-brand-950 bg-white shadow-[1px_1px_0px_#153227] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            form="productForm"
            :disabled="actionLoading || isUploadingImage"
            class="px-6 py-2.5 font-mono text-xs uppercase bg-brand-950 text-scripture-gold hover:bg-brand-900 font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
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
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-brand-950/70 backdrop-blur-sm"
      @click.self="isShowcaseModalOpen = false"
    >
      <div class="bg-white border-2 border-brand-950 shadow-[8px_8px_0px_#153227] max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b-2 border-brand-950 flex items-center justify-between flex-shrink-0 bg-brand-950 text-scripture-gold">
          <div class="flex items-center gap-2.5">
            <LayoutGrid class="w-5 h-5 text-scripture-gold" />
            <div>
              <h2 class="font-sans font-black text-lg text-scripture-gold uppercase">
                {{ isShowcaseEditing ? 'Edit Kartu Koleksi Homepage' : 'Tambah Kartu Koleksi Homepage' }}
              </h2>
              <p class="text-xs text-brand-300 font-mono">
                Hubungkan kartu showcase ini ke salah satu Master Kategori yang ada
              </p>
            </div>
          </div>
          <button
            @click="isShowcaseModalOpen = false"
            class="p-1 text-scripture-gold hover:text-white hover:bg-white/10 transition-colors"
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
          <div class="p-3.5 bg-brand-100/70 border-2 border-brand-950 space-y-1.5 font-mono">
            <label class="block text-brand-950 uppercase font-bold flex items-center gap-1.5">
              <LinkIcon class="w-3.5 h-3.5 text-brand-700" />
              <span>Hubungkan ke Kategori Pakaian (Wajib) *</span>
            </label>
            <select
              v-model="showcaseForm.category_id"
              @change="onShowcaseCategoryChange"
              required
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono font-bold cursor-pointer focus:outline-none"
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
            <p class="text-[11px] text-brand-700 font-mono">
              Ketika kartu ini diklik di Beranda, pengunjung akan diarahkan ke katalog dengan filter kategori <code>/{{ showcaseForm.category_slug || 'kategori' }}</code>.
            </p>
          </div>

          <!-- Judul Kartu & Sub-Tag -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Judul Kartu di Beranda *</label>
              <input
                v-model="showcaseForm.title"
                type="text"
                required
                placeholder="Misal: Jackets & Outerwear"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-bold focus:outline-none"
              />
            </div>

            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Sub-Tag Header</label>
              <input
                v-model="showcaseForm.tag"
                type="text"
                placeholder="01 // OUTERWEAR"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono uppercase focus:outline-none"
              />
            </div>
          </div>

          <!-- Badge Showcase -->
          <div class="space-y-1 font-mono">
            <label class="block uppercase font-bold text-brand-950">Badge Label (Pojok Kiri Atas)</label>
            <input
              v-model="showcaseForm.badge"
              type="text"
              placeholder="HOT DROP / BESTSELLER"
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono uppercase font-bold focus:outline-none"
            />
            <!-- Preset Badges -->
            <div class="flex flex-wrap gap-1 pt-1">
              <button
                type="button"
                v-for="b in badgePresets"
                :key="b"
                @click="showcaseForm.badge = b"
                class="text-[10px] font-mono px-2 py-0.5 bg-white hover:bg-brand-100 text-brand-950 font-bold border border-brand-950 transition-colors"
              >
                {{ b }}
              </button>
            </div>
          </div>

          <!-- Deskripsi Ringkas -->
          <div class="space-y-1 font-mono">
            <label class="block uppercase font-bold text-brand-950">Deskripsi Bahan & Potongan</label>
            <textarea
              v-model="showcaseForm.description"
              rows="2"
              placeholder="Zip hoodies 380 GSM, coaches jacket, dan rajut katun tebal."
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 leading-relaxed font-sans focus:outline-none"
            ></textarea>
          </div>

          <!-- Tombol Text & Sort Order -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Teks Tombol Aksi</label>
              <div class="flex items-center gap-1 bg-white border-2 border-brand-950 px-3 py-2">
                <span class="text-brand-500 font-mono text-xs">Jelajahi</span>
                <input
                  v-model="showcaseForm.button_text"
                  type="text"
                  placeholder="Outerwear"
                  class="bg-transparent border-none outline-none text-brand-950 font-bold w-full text-xs"
                />
              </div>
            </div>

            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Urutan Tampil (Posisi Kartu)</label>
              <input
                v-model.number="showcaseForm.sort_order"
                type="number"
                min="1"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          <!-- Cover Image Upload & URL -->
          <div class="space-y-2 pt-2 border-t-2 border-brand-950/20 font-mono">
            <label class="block uppercase font-bold text-brand-950">Foto Cover Showcase</label>
            
            <div class="flex items-center gap-3">
              <label class="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-brand-100 border-2 border-brand-950 text-brand-950 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#153227] transition-all">
                <Upload class="w-4 h-4 text-brand-950" />
                <span>{{ isUploadingShowcaseImage ? 'Mengunggah ke Cloud...' : 'Unggah Foto dari Komputer' }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="isUploadingShowcaseImage"
                  @change="handleShowcaseImageUpload"
                />
              </label>
              <span class="text-[11px] text-brand-500 font-mono">atau tempel link URL foto</span>
            </div>

            <input
              v-model="showcaseForm.image"
              type="url"
              placeholder="https://images.unsplash.com/... atau URL gambar lainnya"
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono text-xs focus:outline-none"
            />

            <!-- Live Image Preview -->
            <div v-if="showcaseForm.image" class="relative w-full h-36 bg-brand-100 border-2 border-brand-950 shadow-[2px_2px_0px_#153227] overflow-hidden mt-2">
              <img :src="showcaseForm.image" class="w-full h-full object-cover" />
              <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-950 text-scripture-gold font-mono text-[10px] uppercase font-bold border border-brand-950">
                Preview Foto Cover
              </div>
            </div>
          </div>

        </form>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t-2 border-brand-950 bg-brand-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            @click="isShowcaseModalOpen = false"
            class="px-5 py-2.5 font-mono text-xs uppercase font-bold text-brand-950 hover:bg-brand-100 border-2 border-brand-950 bg-white shadow-[1px_1px_0px_#153227] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            form="showcaseCardForm"
            :disabled="actionLoading || isUploadingShowcaseImage"
            class="px-6 py-2.5 font-mono text-xs uppercase bg-brand-950 text-scripture-gold hover:bg-brand-900 font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
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
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-brand-950/70 backdrop-blur-sm"
      @click.self="isMasterCategoryModalOpen = false"
    >
      <div class="bg-white border-2 border-brand-950 shadow-[8px_8px_0px_#153227] max-w-md w-full overflow-hidden">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b-2 border-brand-950 flex items-center justify-between bg-brand-950 text-scripture-gold">
          <div class="flex items-center gap-2.5">
            <FolderTree class="w-5 h-5 text-scripture-gold" />
            <div>
              <h2 class="font-sans font-black text-lg text-scripture-gold uppercase">
                Tambah Master Kategori
              </h2>
              <p class="text-xs text-brand-300 font-mono">
                Kategori baru untuk pakaian di katalog
              </p>
            </div>
          </div>
          <button
            @click="isMasterCategoryModalOpen = false"
            class="p-1 text-scripture-gold hover:text-white hover:bg-white/10 transition-colors"
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
          <div class="space-y-1 font-mono">
            <label class="block uppercase font-bold text-brand-950">Nama Kategori *</label>
            <input
              v-model="masterCategoryForm.name"
              @input="generateMasterCategorySlug"
              type="text"
              required
              placeholder="Misal: Shorts & Boxers"
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-bold focus:outline-none"
            />
          </div>

          <div class="space-y-1 font-mono">
            <label class="block uppercase font-bold text-brand-950">Slug URL (Otomatis) *</label>
            <input
              v-model="masterCategoryForm.slug"
              type="text"
              required
              placeholder="shorts-boxers"
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono focus:outline-none"
            />
            <p class="text-[10px] text-brand-500 font-mono">Digunakan sebagai parameter URL di katalog (misal: /catalog?category=shorts-boxers).</p>
          </div>

          <div class="space-y-1 font-mono">
            <label class="block uppercase font-bold text-brand-950">Deskripsi Kategori (Opsional)</label>
            <textarea
              v-model="masterCategoryForm.description"
              rows="2"
              placeholder="Penjelasan singkat kategori pakaian ini..."
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-sans leading-relaxed focus:outline-none"
            ></textarea>
          </div>
        </form>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t-2 border-brand-950 bg-brand-50 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="isMasterCategoryModalOpen = false"
            class="px-5 py-2.5 font-mono text-xs uppercase font-bold text-brand-950 hover:bg-brand-100 border-2 border-brand-950 bg-white shadow-[1px_1px_0px_#153227] transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            form="masterCategoryFormEl"
            :disabled="actionLoading"
            class="px-6 py-2.5 font-mono text-xs uppercase bg-brand-950 text-scripture-gold hover:bg-brand-900 font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
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
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-brand-950/70 backdrop-blur-sm"
      @click.self="isBundleModalOpen = false"
    >
      <div class="bg-white border-2 border-brand-950 shadow-[8px_8px_0px_#153227] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b-2 border-brand-950 flex items-center justify-between flex-shrink-0 bg-brand-950 text-scripture-gold">
          <div class="flex items-center gap-2.5">
            <Boxes class="w-5 h-5 text-scripture-gold" />
            <h3 class="font-sans font-black text-lg sm:text-xl text-scripture-gold uppercase tracking-tight">
              {{ isBundleEditing ? 'Edit Paket Bundling' : 'Tambah Paket Bundling Baru' }}
            </h3>
          </div>
          <button
            @click="isBundleModalOpen = false"
            class="p-1 text-scripture-gold hover:text-white hover:bg-white/10 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-6 overflow-y-auto space-y-5 flex-grow font-sans text-xs">
          <!-- Title & Subtitle -->
          <div class="space-y-4">
            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Judul Paket Bundle *</label>
              <input
                v-model="bundleForm.title"
                type="text"
                required
                placeholder="Contoh: The Sabbath Essential Set"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-bold focus:outline-none"
              />
            </div>

            <div class="space-y-1 font-mono">
              <label class="block uppercase font-bold text-brand-950">Sub-judul / Ringkasan Isi</label>
              <input
                v-model="bundleForm.subtitle"
                type="text"
                placeholder="Contoh: Heavyweight Boxy Tee + Corduroy Cap + Free Sticker Pack"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 focus:outline-none"
              />
            </div>
          </div>

          <!-- Badge & Presets -->
          <div class="space-y-1.5 font-mono">
            <label class="block uppercase font-bold text-brand-950">Badge / Label Promosi</label>
            <input
              v-model="bundleForm.badge"
              type="text"
              placeholder="Contoh: BEST VALUE"
              class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono uppercase font-bold focus:outline-none"
            />
            <div class="flex items-center gap-1.5 flex-wrap pt-1">
              <span class="text-[10px] font-mono text-brand-500">Pilihan Cepat:</span>
              <button
                v-for="p in bundleBadgePresets"
                :key="p"
                type="button"
                @click="bundleForm.badge = p"
                class="px-2 py-0.5 text-[10px] font-mono border transition-colors font-bold"
                :class="bundleForm.badge === p ? 'bg-brand-950 text-scripture-gold border-brand-950' : 'bg-white hover:bg-brand-100 border-brand-950 text-brand-950'"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <!-- Bundle Image (Upload or URL) -->
          <div class="space-y-2 border-t-2 border-brand-950/20 pt-4 font-mono">
            <label class="block uppercase font-bold text-brand-950">Foto Paket Bundle *</label>
            <div class="flex flex-col sm:flex-row gap-4 items-start">
              <div class="w-32 h-32 aspect-[4/5] bg-brand-100 border-2 border-brand-950 shadow-[2px_2px_0px_#153227] overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  v-if="bundleForm.image"
                  :src="bundleForm.image"
                  alt="Bundle Image"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-[10px] font-mono text-brand-400 text-center p-2">Belum ada foto</span>
              </div>
              <div class="space-y-2 flex-grow w-full">
                <div>
                  <label class="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-brand-100 border-2 border-brand-950 text-brand-950 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_#153227] transition-all">
                    <Upload class="w-4 h-4 text-brand-950" />
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
                    class="w-full px-3 py-1.5 bg-white border-2 border-brand-950 text-brand-950 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing & Savings -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t-2 border-brand-950/20 pt-4 font-mono">
            <div class="space-y-1">
              <label class="block uppercase font-bold text-brand-950">Harga Normal (Asli)</label>
              <input
                v-model.number="bundleForm.originalPrice"
                type="number"
                min="0"
                step="5000"
                @input="updateBundleSavingsText"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <label class="block uppercase font-bold text-brand-950">Harga Promo Bundle</label>
              <input
                v-model.number="bundleForm.bundlePrice"
                type="number"
                min="0"
                step="5000"
                @input="updateBundleSavingsText"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono font-bold focus:outline-none"
              />
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <label class="block uppercase font-bold text-brand-950">Teks Hemat</label>
                <span class="text-[10px] font-mono text-emerald-950 font-bold bg-emerald-200 border border-brand-950 px-1.5 py-0.2">
                  ✨ Otomatis
                </span>
              </div>
              <input
                v-model="bundleForm.savingsText"
                type="text"
                placeholder="Otomatis: misal Hemat Rp50.000"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono focus:outline-none"
              />
            </div>
          </div>

          <!-- Inclusions Repeater (Rincian Item) -->
          <div class="space-y-3 border-t-2 border-brand-950/20 pt-4">
            <div class="flex items-center justify-between font-mono">
              <div>
                <label class="block text-brand-950 uppercase font-bold">Rincian Item Termasuk Dalam Paket</label>
                <p class="text-[11px] text-brand-500 font-mono">Item ini akan tampil di dalam tombol "Lihat Rincian Item" pada beranda.</p>
              </div>
              <button
                type="button"
                @click="addBundleItem"
                class="px-3 py-1.5 bg-brand-950 hover:bg-brand-900 border-2 border-brand-950 text-scripture-gold font-mono text-xs font-bold uppercase shadow-[1px_1px_0px_#153227] flex items-center gap-1.5 transition-all"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            <div class="space-y-2.5">
              <div
                v-for="(item, idx) in bundleForm.items"
                :key="idx"
                class="p-3 bg-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227] space-y-2 relative"
              >
                <div class="flex items-center justify-between font-mono">
                  <span class="text-[11px] text-brand-950 font-bold uppercase">
                    Item #{{ idx + 1 }}
                  </span>
                  <button
                    type="button"
                    @click="removeBundleItem(idx)"
                    class="p-1 text-rose-900 bg-rose-100 hover:bg-rose-200 border border-brand-950 shadow-[1px_1px_0px_#153227] transition-all"
                    title="Hapus Item Ini"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div class="font-mono">
                    <span class="text-[10px] text-brand-600 block mb-0.5 font-bold uppercase">Nama Item *</span>
                    <input
                      v-model="item.name"
                      type="text"
                      placeholder="Contoh: Heavyweight Boxy Tee"
                      class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div class="font-mono">
                    <span class="text-[10px] text-brand-600 block mb-0.5 font-bold uppercase">Detail / Bahan / Catatan</span>
                    <input
                      v-model="item.detail"
                      type="text"
                      placeholder="Contoh: Katun 16s 235 GSM (Size S-XL)"
                      class="w-full px-2.5 py-1.5 bg-white border-2 border-brand-950 text-brand-950 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sort order & Active toggle -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-brand-950/20 pt-4 font-mono">
            <div class="space-y-1">
              <label class="block uppercase font-bold text-brand-950">Urutan Tampil (Sort Order)</label>
              <input
                v-model.number="bundleForm.sort_order"
                type="number"
                min="1"
                class="w-full px-3 py-2 bg-white border-2 border-brand-950 text-brand-950 font-mono font-bold focus:outline-none"
              />
            </div>

            <div class="flex items-center gap-3 pt-5">
              <input
                id="bundle-active"
                v-model="bundleForm.is_active"
                type="checkbox"
                class="w-4 h-4 accent-brand-950 rounded-none"
              />
              <label for="bundle-active" class="text-brand-950 text-xs select-none font-bold">
                Aktifkan & Tampilkan di Beranda
              </label>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t-2 border-brand-950 bg-brand-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            @click="isBundleModalOpen = false"
            class="px-5 py-2.5 font-mono text-xs uppercase font-bold text-brand-950 hover:bg-brand-100 border-2 border-brand-950 bg-white shadow-[1px_1px_0px_#153227] transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="actionLoading || isUploadingBundleImage"
            @click="handleSaveBundle"
            class="px-6 py-2.5 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono text-xs uppercase font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <Loader2 v-if="actionLoading" class="w-4 h-4 animate-spin" />
            <span>{{ isBundleEditing ? 'Simpan Perubahan' : 'Buat Paket Bundle' }}</span>
          </button>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>
