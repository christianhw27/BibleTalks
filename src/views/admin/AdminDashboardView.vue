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
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const catalogStore = useCatalogStore()

const activeTab = ref('products') // 'products' | 'settings'
const productsList = ref([])
const loading = ref(false)
const actionLoading = ref(false)
const notification = ref({ type: '', text: '' })

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
    const [prods, books] = await Promise.all([
      adminGetProducts(),
      adminGetLookbooks().catch(() => []),
    ])
    productsList.value = prods

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
        gallery: Array.isArray(current.gallery) ? [...current.gallery] : [],
      }
    }
  } catch (err) {
    console.error('Error loading admin data:', err)
    notify('Gagal memuat data: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
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
    category_id: catalogStore.categories[0]?.id || '',
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
    lookbookForm.value.gallery.push(publicUrl)
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
      gallery: lookbookForm.value.gallery,
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
    <div class="flex items-center gap-6 border-b border-brand-300 font-mono text-xs">
      <button
        @click="activeTab = 'products'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2"
        :class="activeTab === 'products' ? 'border-brand-900 text-brand-950 font-bold' : 'border-transparent text-brand-500 hover:text-brand-800'"
      >
        <Package class="w-4 h-4" />
        <span>Katalog Pakaian ({{ productsList.length }})</span>
      </button>

      <button
        @click="activeTab = 'settings'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2"
        :class="activeTab === 'settings' ? 'border-brand-900 text-brand-950 font-bold' : 'border-transparent text-brand-500 hover:text-brand-800'"
      >
        <Settings class="w-4 h-4" />
        <span>Profil Brand & WhatsApp</span>
      </button>

      <button
        @click="activeTab = 'lookbook'"
        class="pb-3 border-b-2 font-semibold transition-colors flex items-center gap-2"
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
          <div v-if="lookbookForm.gallery && lookbookForm.gallery.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div
              v-for="(img, idx) in lookbookForm.gallery"
              :key="idx"
              class="relative aspect-[4/5] bg-brand-100 border border-brand-300 rounded overflow-hidden group shadow-sm"
            >
              <img :src="img" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  @click="removeLookbookGalleryImage(idx)"
                  class="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow"
                  title="Hapus Foto Ini"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <span class="absolute bottom-1 left-1 px-1.5 py-0.5 bg-white/90 text-[9px] font-mono text-brand-800 rounded">
                Frame {{ idx + 1 }}
              </span>
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
              <label class="block font-mono text-brand-700 uppercase">Kategori</label>
              <select
                v-model="form.category_id"
                class="w-full px-3 py-2 bg-brand-50 border border-brand-300 rounded text-brand-950 font-mono cursor-pointer"
              >
                <option value="">Pilih Kategori</option>
                <option
                  v-for="cat in catalogStore.categories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.name }}
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


  </div>
</template>
