<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductBySlug } from '../services/catalogService'
import { useCatalogStore } from '../stores/catalogStore'
import ProductCard from '../components/catalog/ProductCard.vue'
import {
  MessageCircle,
  Ruler,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Share2,
  Check,
  X,
  Layers,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()

const product = ref(null)
const loading = ref(true)
const error = ref(null)

const activeImageIndex = ref(0)
const selectedSize = ref(null)
const isSizeChartOpen = ref(false)
const copiedLink = ref(false)

async function loadProduct() {
  loading.value = true
  error.value = null
  selectedSize.value = null
  activeImageIndex.value = 0

  try {
    const data = await getProductBySlug(route.params.slug)
    product.value = data

    // Auto-select first in-stock size if available
    if (data?.variants?.length > 0) {
      const firstAvailable = data.variants.find((v) => v.stock > 0)
      if (firstAvailable) {
        selectedSize.value = firstAvailable.size
      } else {
        selectedSize.value = data.variants[0].size
      }
    }
  } catch (err) {
    console.error('Error loading product detail:', err)
    error.value = 'Artikel pakaian tidak ditemukan atau belum tersedia.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProduct()
})

watch(() => route.params.slug, () => {
  loadProduct()
})

// Current selected variant stock
const currentVariant = computed(() => {
  if (!product.value?.variants || !selectedSize.value) return null
  return product.value.variants.find((v) => v.size === selectedSize.value)
})

const isCurrentSizeSoldOut = computed(() => {
  if (!currentVariant.value) return false
  return currentVariant.value.stock <= 0
})

// WhatsApp Direct Order generator
function orderViaWhatsApp() {
  if (!product.value) return
  const wa = catalogStore.storeSettings.whatsapp_number || '6281234567890'
  const sizeText = selectedSize.value ? `Ukuran: *${selectedSize.value}*` : ''
  const priceText = catalogStore.formatPrice(product.value.price)

  const message = [
    `Shalom / Halo *${catalogStore.storeSettings.brand_name || 'BibleTalks'}*, saya ingin memesan artikel pakaian ini:`,
    '',
    `• Produk: *${product.value.title}*`,
    sizeText ? `• ${sizeText}` : '',
    `• Harga: *${priceText}*`,
    `• Link: ${window.location.href}`,
    '',
    `Apakah stok ukuran ini masih tersedia untuk saya proses? Terima kasih dan Tuhan memberkati!`,
  ].filter(Boolean).join('\n')

  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`, '_blank')
}

// Copy link
function copyProductLink() {
  navigator.clipboard.writeText(window.location.href)
  copiedLink.value = true
  setTimeout(() => {
    copiedLink.value = false
  }, 2000)
}

// Related products
const relatedProducts = computed(() => {
  if (!product.value || !catalogStore.products.length) return []
  return catalogStore.products
    .filter(
      (p) =>
        p.id !== product.value.id &&
        p.category_id === product.value.category_id
    )
    .slice(0, 4)
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
    
    <!-- BREADCRUMB & BACK -->
    <div class="flex items-center justify-between border-b border-brand-300 pb-4">
      <button
        @click="router.back()"
        class="inline-flex items-center gap-1.5 text-xs font-mono text-brand-600 hover:text-brand-900 transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>KEMBALI</span>
      </button>

      <div class="hidden sm:flex items-center gap-2 text-xs font-mono text-brand-500">
        <router-link to="/" class="hover:text-brand-800">Home</router-link>
        <ChevronRight class="w-3.5 h-3.5" />
        <router-link to="/catalog" class="hover:text-brand-800">Katalog</router-link>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-brand-800 font-medium truncate max-w-xs">{{ product?.title || 'Detail Produk' }}</span>
      </div>

      <button
        @click="copyProductLink"
        class="inline-flex items-center gap-1.5 text-xs font-mono text-brand-700 hover:text-brand-900 bg-white border border-brand-300 px-3.5 py-1.5 rounded shadow-sm transition-colors"
      >
        <Check v-if="copiedLink" class="w-3.5 h-3.5 text-emerald-600" />
        <Share2 v-else class="w-3.5 h-3.5" />
        <span>{{ copiedLink ? 'Link Tersalin!' : 'Bagikan' }}</span>
      </button>
    </div>

    <!-- LOADING & ERROR STATES -->
    <div v-if="loading" class="py-20 text-center font-mono text-sm text-brand-500 animate-pulse">
      MEMUAT DETAIL RILISAN PAKAIAN...
    </div>

    <div v-else-if="error || !product" class="py-20 text-center space-y-4">
      <p class="text-brand-700 font-sans">{{ error || 'Produk tidak ditemukan.' }}</p>
      <router-link
        to="/catalog"
        class="inline-block px-6 py-2.5 font-mono text-xs uppercase bg-brand-900 text-white font-bold rounded"
      >
        Kembali ke Katalog
      </router-link>
    </div>

    <!-- MAIN PRODUCT SECTION -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      
      <!-- LEFT: IMAGE GALLERY (7 COLS) -->
      <div class="lg:col-span-7 space-y-4">
        <!-- Main Large Image -->
        <div class="relative aspect-[4/5] bg-white border border-brand-300 rounded overflow-hidden shadow-sm group">
          <img
            :src="product.images?.[activeImageIndex] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'"
            :alt="product.title"
            class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />

          <span
            v-if="product.is_featured"
            class="absolute top-4 left-4 px-3 py-1 text-xs font-mono uppercase tracking-wider bg-white/95 backdrop-blur-sm text-scripture-bronze border border-scripture-sand font-bold rounded flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles class="w-3 h-3 text-scripture-gold" />
            Signature Scripture Drop
          </span>
        </div>

        <!-- Image Thumbnails Strip -->
        <div
          v-if="product.images && product.images.length > 1"
          class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none"
        >
          <button
            v-for="(img, idx) in product.images"
            :key="idx"
            @click="activeImageIndex = idx"
            class="relative w-20 h-24 flex-shrink-0 bg-white rounded border overflow-hidden transition-all"
            :class="activeImageIndex === idx ? 'border-brand-900 scale-95 ring-2 ring-brand-900/30' : 'border-brand-300 opacity-70 hover:opacity-100'"
          >
            <img :src="img" :alt="product.title" class="w-full h-full object-cover object-center" />
          </button>
        </div>
      </div>

      <!-- RIGHT: PRODUCT DETAILS & BUY (5 COLS) -->
      <div class="lg:col-span-5 space-y-8 font-sans">
        
        <!-- Title, Category & Price -->
        <div class="space-y-3 border-b border-brand-300 pb-6">
          <div class="flex items-center gap-2 font-mono text-xs text-brand-500 uppercase tracking-widest">
            <span>{{ product.category?.name || 'Contemporary Apparel' }}</span>
            <span>•</span>
            <span class="text-scripture-bronze font-semibold">ROOTED IN PURPOSE</span>
          </div>

          <h1 class="font-serif font-bold text-2xl sm:text-4xl text-brand-950 tracking-tight leading-tight">
            {{ product.title }}
          </h1>

          <div class="flex items-baseline gap-4 pt-1">
            <span class="font-mono text-2xl sm:text-3xl font-bold text-brand-950">
              {{ catalogStore.formatPrice(product.price) }}
            </span>
          </div>
        </div>

        <!-- Description & Fit Summary -->
        <div class="text-sm text-brand-700 leading-relaxed space-y-2">
          <p>{{ product.description }}</p>
        </div>

        <!-- SIZE SELECTOR -->
        <div class="space-y-3.5">
          <div class="flex items-center justify-between font-mono text-xs">
            <span class="text-brand-900 uppercase tracking-wider font-semibold">
              Pilih Ukuran:
            </span>
            <button
              @click="isSizeChartOpen = true"
              class="text-scripture-bronze hover:text-brand-900 underline inline-flex items-center gap-1 font-medium"
            >
              <Ruler class="w-3.5 h-3.5" />
              <span>Panduan Size Chart</span>
            </button>
          </div>

          <!-- Sizes Grid -->
          <div class="grid grid-cols-4 gap-2.5">
            <button
              v-for="v in product.variants"
              :key="v.id"
              @click="selectedSize = v.size"
              :disabled="v.stock <= 0"
              class="py-3 px-2 rounded border font-mono text-sm font-semibold transition-all relative flex flex-col items-center justify-center gap-0.5 shadow-sm"
              :class="[
                selectedSize === v.size
                  ? 'bg-brand-900 text-white border-brand-900 shadow-md'
                  : v.stock > 0
                  ? 'bg-white border-brand-300 text-brand-800 hover:border-brand-500'
                  : 'bg-brand-100 border-brand-200 text-brand-400 cursor-not-allowed line-through'
              ]"
            >
              <span>{{ v.size }}</span>
              <span
                class="text-[9px] font-mono tracking-tighter"
                :class="selectedSize === v.size ? 'text-scripture-sand' : v.stock > 0 ? 'text-brand-500' : 'text-rose-500'"
              >
                {{ v.stock > 0 ? `${v.stock} pcs` : 'Habis' }}
              </span>
            </button>
          </div>

          <!-- Stock feedback alert -->
          <div v-if="currentVariant" class="font-mono text-xs pt-1">
            <span v-if="currentVariant.stock > 5" class="text-emerald-700 font-medium">
              ✓ Ketersediaan ready untuk ukuran {{ currentVariant.size }} ({{ currentVariant.stock }} pcs tersisa)
            </span>
            <span v-else-if="currentVariant.stock > 0" class="text-amber-800 font-medium">
              ⚠ Stok menipis! Tersisa {{ currentVariant.stock }} pcs untuk ukuran {{ currentVariant.size }}
            </span>
            <span v-else class="text-rose-700 font-medium">
              ✕ Ukuran {{ currentVariant.size }} sedang habis
            </span>
          </div>
        </div>

        <!-- CTA ORDER BUTTON VIA WHATSAPP -->
        <div class="space-y-3 pt-2">
          <button
            @click="orderViaWhatsApp"
            :disabled="isCurrentSizeSoldOut"
            class="w-full py-4 px-6 rounded font-mono text-xs uppercase tracking-widest font-bold transition-all duration-200 flex items-center justify-center gap-3 shadow-md"
            :class="[
              isCurrentSizeSoldOut
                ? 'bg-brand-200 text-brand-400 cursor-not-allowed border border-brand-300'
                : 'bg-brand-900 hover:bg-brand-800 text-white shadow-brand-900/10 active:scale-[0.99]'
            ]"
          >
            <MessageCircle class="w-4 h-4 text-emerald-400" />
            <span>{{ isCurrentSizeSoldOut ? 'UKURAN INI HABIS' : 'PESAN / TANYA STOK VIA WHATSAPP' }}</span>
          </button>
          
          <p class="text-center font-mono text-[11px] text-brand-500">
            Transaksi langsung via admin WhatsApp resmi • Garansi original BIBLE TALKS
          </p>
        </div>

        <!-- SPECIFICATIONS ACCORDION / DETAILS -->
        <div class="border-t border-brand-300 pt-6 space-y-4">
          <h3 class="font-mono text-xs uppercase tracking-widest text-brand-900 font-semibold">
            Spesifikasi & Integritas Kain
          </h3>

          <div class="bg-white border border-brand-300 rounded p-4 space-y-2.5 text-xs font-mono text-brand-700 shadow-sm">
            <div v-if="product.details?.material" class="flex justify-between py-1 border-b border-brand-200">
              <span class="text-brand-500">Material Kain:</span>
              <span class="text-brand-900 font-medium text-right">{{ product.details.material }}</span>
            </div>
            <div v-if="product.details?.fit" class="flex justify-between py-1 border-b border-brand-200">
              <span class="text-brand-500">Siluet Potongan:</span>
              <span class="text-brand-900 font-medium text-right">{{ product.details.fit }}</span>
            </div>
            <div v-if="product.details?.print" class="flex justify-between py-1 border-b border-brand-200">
              <span class="text-brand-500">Sablon & Grafis:</span>
              <span class="text-brand-900 font-medium text-right">{{ product.details.print }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-brand-200">
              <span class="text-brand-500">Asal Pembuatan:</span>
              <span class="text-brand-900 font-medium text-right">
                {{ product.details?.origin?.includes('Bandung') ? 'Kabupaten Ngawi, Jawa Timur' : (product.details?.origin || 'Kabupaten Ngawi, Jawa Timur') }}
              </span>
            </div>
            <div v-if="product.details?.care" class="flex justify-between py-1">
              <span class="text-brand-500">Perawatan:</span>
              <span class="text-brand-900 font-medium text-right">{{ product.details.care }}</span>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- SIZE CHART MODAL DIALOG -->
    <div
      v-if="isSizeChartOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="isSizeChartOpen = false"
    >
      <div class="bg-white border border-brand-300 rounded-lg max-w-lg w-full p-6 space-y-6 shadow-2xl">
        <div class="flex items-center justify-between border-b border-brand-200 pb-3">
          <div class="flex items-center gap-2">
            <Ruler class="w-5 h-5 text-scripture-bronze" />
            <h3 class="font-serif font-bold text-lg text-brand-900 uppercase">
              Panduan Size Chart (cm)
            </h3>
          </div>
          <button
            @click="isSizeChartOpen = false"
            class="p-1 text-brand-500 hover:text-brand-900"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Table Size -->
        <div class="overflow-x-auto">
          <table class="w-full text-left font-mono text-xs border border-brand-300">
            <thead class="bg-brand-100 text-brand-800 uppercase">
              <tr>
                <th class="p-3 border-b border-r border-brand-300">Size</th>
                <th class="p-3 border-b border-r border-brand-300">Lebar Dada</th>
                <th class="p-3 border-b border-r border-brand-300">Panjang Baju</th>
                <th class="p-3 border-b border-brand-300">Lengan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-200 text-brand-700 bg-white">
              <tr>
                <td class="p-3 border-r border-brand-200 font-bold text-brand-900">S</td>
                <td class="p-3 border-r border-brand-200">54 cm</td>
                <td class="p-3 border-r border-brand-200">70 cm</td>
                <td class="p-3">22 cm</td>
              </tr>
              <tr>
                <td class="p-3 border-r border-brand-200 font-bold text-brand-900">M</td>
                <td class="p-3 border-r border-brand-200">57 cm</td>
                <td class="p-3 border-r border-brand-200">73 cm</td>
                <td class="p-3">24 cm</td>
              </tr>
              <tr>
                <td class="p-3 border-r border-brand-200 font-bold text-brand-900">L</td>
                <td class="p-3 border-r border-brand-200">60 cm</td>
                <td class="p-3 border-r border-brand-200">76 cm</td>
                <td class="p-3">26 cm</td>
              </tr>
              <tr>
                <td class="p-3 border-r border-brand-200 font-bold text-brand-900">XL</td>
                <td class="p-3 border-r border-brand-200">63 cm</td>
                <td class="p-3 border-r border-brand-200">78 cm</td>
                <td class="p-3">28 cm</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="font-mono text-[11px] text-brand-500">
          * Toleransi ukuran jahitan konveksi 1 - 2 cm karena proses pencucian/pre-shrunk katun tebal.
        </p>

        <button
          @click="isSizeChartOpen = false"
          class="w-full py-2.5 font-mono text-xs uppercase bg-brand-900 text-white font-bold rounded hover:bg-brand-800"
        >
          Tutup Panduan
        </button>
      </div>
    </div>

    <!-- RELATED PRODUCTS SECTION -->
    <div v-if="relatedProducts.length > 0" class="border-t border-brand-300 pt-16 space-y-8">
      <div class="flex items-center justify-between">
        <h2 class="font-serif font-bold text-2xl text-brand-950 uppercase">
          Rilisan Terkait
        </h2>
        <router-link
          to="/catalog"
          class="text-xs font-mono text-brand-600 hover:text-brand-900"
        >
          Lihat Semua →
        </router-link>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        <ProductCard
          v-for="rel in relatedProducts"
          :key="rel.id"
          :product="rel"
        />
      </div>
    </div>

  </div>
</template>
