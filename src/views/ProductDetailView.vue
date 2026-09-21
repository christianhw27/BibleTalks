<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductBySlug } from '../services/catalogService'
import { useCatalogStore } from '../stores/catalogStore'
import ProductCard from '../components/catalog/ProductCard.vue'
import OrderModal from '../components/order/OrderModal.vue'
import {
  MessageCircle,
  Ruler,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Share2,
  Check,
  X,
  ShoppingBag,
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
const isOrderModalOpen = ref(false)
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

// Open Order Modal with customer form
function openOrderModal() {
  if (!product.value) return
  isOrderModalOpen.value = true
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
  <div class="relative bg-[#faf8f4] min-h-screen overflow-hidden text-brand-950">
    
    <!-- Ambient Halftone Dot Background Pattern -->
    <div class="absolute inset-0 bg-halftone text-brand-950/[0.07] pointer-events-none z-0"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-8 sm:space-y-12">
      
      <!-- SLEEK TOP BAR (Clean & Minimalist) -->
      <div class="flex items-center justify-between border-b-2 border-brand-950 pb-3 font-mono text-xs">
        <button
          @click="router.back()"
          class="px-3 py-1.5 bg-white border border-brand-950 font-bold uppercase tracking-wider text-brand-950 hover:bg-brand-100 transition-colors shadow-[2px_2px_0px_#153227] inline-flex items-center gap-1.5"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>

        <div class="hidden sm:flex items-center gap-2 text-brand-600 font-semibold uppercase text-[11px] truncate max-w-md">
          <router-link to="/catalog" class="hover:text-brand-950 transition-colors">Katalog</router-link>
          <span>/</span>
          <span class="text-brand-950 font-bold truncate">{{ product?.title || 'Detail Produk' }}</span>
        </div>

        <button
          @click="copyProductLink"
          class="px-3 py-1.5 bg-white border border-brand-950 font-bold uppercase tracking-wider text-brand-950 hover:bg-brand-100 transition-colors shadow-[2px_2px_0px_#153227] inline-flex items-center gap-1.5"
        >
          <Check v-if="copiedLink" class="w-3.5 h-3.5 text-emerald-700" />
          <Share2 v-else class="w-3.5 h-3.5" />
          <span>{{ copiedLink ? 'Tersalin' : 'Bagikan' }}</span>
        </button>
      </div>

      <!-- LOADING & ERROR STATES -->
      <div v-if="loading" class="py-24 text-center font-mono text-xs text-brand-700 uppercase tracking-widest animate-pulse">
        [ MEMUAT DETAIL RILISAN PAKAIAN... ]
      </div>

      <div v-else-if="error || !product" class="py-20 text-center space-y-4 bg-white border-2 border-brand-950 p-8 max-w-md mx-auto shadow-[4px_4px_0px_#153227]">
        <p class="text-xs text-brand-800 font-mono">{{ error || 'Produk tidak ditemukan.' }}</p>
        <router-link
          to="/catalog"
          class="inline-block px-5 py-2 font-mono text-xs uppercase bg-brand-950 text-scripture-gold font-black border border-brand-950 shadow-[2px_2px_0px_#153227]"
        >
          Kembali ke Katalog
        </router-link>
      </div>

      <!-- MAIN PRODUCT DETAIL GRID (Clean, Minimalist & Balanced) -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        <!-- LEFT: IMAGE GALLERY (7 COLS) -->
        <div class="lg:col-span-7 space-y-3">
          <!-- Main Product Frame -->
          <div class="relative aspect-[4/5] bg-brand-100/60 border-2 border-brand-950 overflow-hidden shadow-[4px_4px_0px_#153227] group">
            <!-- Subtle Masking Tape Accent -->
            <div class="tape-strip -top-2.5 right-6 rotate-2 hidden sm:block"></div>

            <!-- Halftone Dot Overlay on Hover -->
            <div class="absolute inset-0 halftone-screen opacity-0 group-hover:opacity-30 transition-opacity duration-300 z-10 pointer-events-none"></div>

            <!-- Main Image -->
            <img
              :src="product.images?.[activeImageIndex] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'"
              :alt="product.title"
              class="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />

            <!-- Single Sharp Status Badge (Top Left) -->
            <div class="absolute top-3 left-3 z-20">
              <span
                v-if="product.status === 'sold_out'"
                class="inline-flex items-center px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] uppercase font-black tracking-wider border border-brand-950 shadow-[2px_2px_0px_#153227] -rotate-1"
              >
                ✕ Sold Out
              </span>
              <span
                v-else-if="product.status === 'pre_order'"
                class="inline-flex items-center px-2 py-0.5 bg-amber-400 text-brand-950 font-mono text-[10px] uppercase font-black tracking-wider border border-brand-950 shadow-[2px_2px_0px_#153227] rotate-1"
              >
                ⏳ Pre-Order
              </span>
              <span
                v-else-if="product.is_featured"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-scripture-gold text-brand-950 font-mono text-[10px] uppercase font-black tracking-wider border border-brand-950 shadow-[2px_2px_0px_#153227] -rotate-1"
              >
                <Sparkles class="w-3 h-3 text-brand-950 fill-brand-950" />
                <span>Signature</span>
              </span>
            </div>
          </div>

          <!-- Thumbnails Row (Clean & Compact) -->
          <div
            v-if="product.images && product.images.length > 1"
            class="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none"
          >
            <button
              v-for="(img, idx) in product.images"
              :key="idx"
              @click="activeImageIndex = idx"
              class="relative w-16 h-20 flex-shrink-0 bg-white border-2 overflow-hidden transition-all"
              :class="activeImageIndex === idx ? 'border-brand-950 shadow-[2px_2px_0px_#153227] scale-95 ring-1 ring-brand-950' : 'border-brand-950/30 opacity-70 hover:opacity-100'"
            >
              <img :src="img" :alt="product.title" class="w-full h-full object-cover object-center" />
            </button>
          </div>
        </div>

        <!-- RIGHT: PRODUCT INFO & ORDER ACTIONS (5 COLS) -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- Category, Title & Price -->
          <div class="space-y-2 border-b-2 border-brand-950 pb-5">
            <div class="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-brand-600 uppercase tracking-widest font-semibold">
              <span>{{ product.category?.name || 'Rilisan Apparel' }}</span>
              <span>•</span>
              <span class="text-brand-950 font-bold">READY STOCK</span>
            </div>

            <!-- Big Brutalist Title -->
            <h1 class="font-sans font-black text-2xl sm:text-3xl lg:text-4xl text-brand-950 uppercase tracking-tight leading-tight">
              {{ product.title }}
            </h1>

            <!-- Price & Stock Status Row -->
            <div class="flex items-center justify-between pt-1">
              <span class="font-mono text-2xl sm:text-3xl font-black text-brand-950 tracking-tight">
                {{ catalogStore.formatPrice(product.price) }}
              </span>

              <span
                class="px-2 py-0.5 border border-brand-950 font-mono text-[10px] uppercase font-black tracking-wider"
                :class="product.status === 'sold_out' ? 'bg-rose-100 text-rose-800' : 'bg-brand-100 text-brand-950'"
              >
                {{ product.status === 'sold_out' ? 'HABIS' : 'READY STOCK' }}
              </span>
            </div>
          </div>

          <!-- Product Description (Clean & Readable) -->
          <p class="text-xs sm:text-sm text-brand-800 font-sans leading-relaxed">
            {{ product.description }}
          </p>

          <!-- SIZE PICKER (Sleek Brutalist Grid) -->
          <div class="space-y-2.5 pt-1">
            <div class="flex items-center justify-between font-mono text-xs">
              <span class="text-brand-950 uppercase tracking-wider font-bold">
                Pilih Ukuran:
              </span>
              <button
                @click="isSizeChartOpen = true"
                class="text-brand-800 hover:text-brand-950 underline inline-flex items-center gap-1 font-semibold text-[11px]"
              >
                <Ruler class="w-3.5 h-3.5" />
                <span>Panduan Size Chart</span>
              </button>
            </div>

            <!-- Sizes Grid -->
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="v in product.variants"
                :key="v.id"
                @click="selectedSize = v.size"
                :disabled="v.stock <= 0"
                class="py-2.5 px-2 border-2 font-mono text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5"
                :class="[
                  selectedSize === v.size
                    ? 'bg-brand-950 text-scripture-gold border-brand-950 shadow-[2px_2px_0px_#153227]'
                    : v.stock > 0
                    ? 'bg-white border-brand-950 text-brand-950 hover:bg-brand-100 shadow-[1.5px_1.5px_0px_#153227]'
                    : 'bg-brand-100 border-brand-950/30 text-brand-400 cursor-not-allowed line-through opacity-60'
                ]"
              >
                <span>{{ v.size }}</span>
                <span
                  class="text-[9px] font-mono tracking-tight"
                  :class="selectedSize === v.size ? 'text-scripture-gold/80' : v.stock > 0 ? 'text-brand-600' : 'text-rose-500'"
                >
                  {{ v.stock > 0 ? `${v.stock} pcs` : 'Habis' }}
                </span>
              </button>
            </div>

            <!-- Stock Feedback Notice -->
            <div v-if="currentVariant" class="font-mono text-[11px] pt-0.5">
              <span v-if="currentVariant.stock > 5" class="text-emerald-700 font-bold">
                ✓ Ready stock untuk ukuran {{ currentVariant.size }} ({{ currentVariant.stock }} pcs tersisa)
              </span>
              <span v-else-if="currentVariant.stock > 0" class="text-amber-800 font-bold">
                ⚠ Stok menipis! Tersisa {{ currentVariant.stock }} pcs untuk ukuran {{ currentVariant.size }}
              </span>
              <span v-else class="text-rose-700 font-bold">
                ✕ Ukuran {{ currentVariant.size }} sedang habis
              </span>
            </div>
          </div>

          <!-- PRIMARY ORDER CTA BUTTON (High-Impact & Minimalist) -->
          <div class="space-y-2 pt-2">
            <button
              @click="openOrderModal"
              :disabled="isCurrentSizeSoldOut"
              class="w-full py-3.5 px-6 font-mono text-xs uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2.5 border-2 border-brand-950 shadow-[3px_3px_0px_#153227] active:translate-x-0.5 active:translate-y-0.5"
              :class="[
                isCurrentSizeSoldOut
                  ? 'bg-brand-200 text-brand-400 cursor-not-allowed border-brand-950/30'
                  : 'bg-brand-950 text-scripture-gold hover:bg-brand-900'
              ]"
            >
              <MessageCircle class="w-4 h-4" />
              <span>{{ isCurrentSizeSoldOut ? 'UKURAN INI HABIS' : 'PESAN / ORDER VIA WHATSAPP' }}</span>
            </button>
            
            <p class="text-center font-mono text-[10px] text-brand-600 uppercase tracking-wider">
              Transaksi resmi via admin WhatsApp • Garansi original BIBLE TALK
            </p>
          </div>

          <!-- SPECIFICATIONS (Clean Monospace Tech Spec) -->
          <div class="border-t-2 border-brand-950 pt-5 space-y-2.5">
            <div class="flex items-center gap-1.5 font-mono text-[10px] text-brand-600 uppercase tracking-widest font-bold">
              <span class="w-1.5 h-1.5 bg-brand-950 inline-block"></span>
              <span>SPESIFIKASI & DETAIL RILISAN</span>
            </div>

            <div class="bg-white border-2 border-brand-950 p-3.5 space-y-2 text-xs font-mono text-brand-800 shadow-[2px_2px_0px_#153227]">
              <div v-if="product.details?.material" class="flex justify-between py-1 border-b border-brand-200">
                <span class="text-brand-500 font-semibold">Material:</span>
                <span class="text-brand-950 font-bold text-right">{{ product.details.material }}</span>
              </div>
              <div v-if="product.details?.fit" class="flex justify-between py-1 border-b border-brand-200">
                <span class="text-brand-500 font-semibold">Siluet:</span>
                <span class="text-brand-950 font-bold text-right">{{ product.details.fit }}</span>
              </div>
              <div v-if="product.details?.print" class="flex justify-between py-1 border-b border-brand-200">
                <span class="text-brand-500 font-semibold">Grafis/Print:</span>
                <span class="text-brand-950 font-bold text-right">{{ product.details.print }}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-brand-200">
                <span class="text-brand-500 font-semibold">Origin:</span>
                <span class="text-brand-950 font-bold text-right">
                  {{ product.details?.origin?.includes('Bandung') ? 'Kabupaten Ngawi, Jawa Timur' : (product.details?.origin || 'Kabupaten Ngawi, Jawa Timur') }}
                </span>
              </div>
              <div v-if="product.details?.care" class="flex justify-between py-1">
                <span class="text-brand-500 font-semibold">Perawatan:</span>
                <span class="text-brand-950 font-bold text-right">{{ product.details.care }}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <!-- RELATED PRODUCTS SECTION (Clean Grid) -->
      <div v-if="relatedProducts.length > 0" class="border-t-2 border-brand-950 pt-10 sm:pt-14 space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-scripture-gold border border-brand-950"></span>
            <h2 class="font-sans font-black text-lg sm:text-2xl uppercase tracking-tight text-brand-950">
              RILISAN TERKAIT
            </h2>
          </div>
          <router-link
            to="/catalog"
            class="text-xs font-mono text-brand-800 font-bold uppercase hover:text-brand-950 tracking-wider inline-flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <span>→</span>
          </router-link>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <ProductCard
            v-for="rel in relatedProducts"
            :key="rel.id"
            :product="rel"
          />
        </div>
      </div>

    </div>

    <!-- SIZE CHART MODAL DIALOG (Clean Zine Table) -->
    <div
      v-if="isSizeChartOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none"
      @click.self="isSizeChartOpen = false"
    >
      <div class="bg-[#faf8f4] border-2 border-brand-950 max-w-md w-full p-5 space-y-4 shadow-[6px_6px_0px_#153227]">
        <div class="flex items-center justify-between border-b-2 border-brand-950 pb-2.5">
          <div class="flex items-center gap-2">
            <Ruler class="w-4 h-4 text-brand-950" />
            <h3 class="font-sans font-black text-base text-brand-950 uppercase tracking-tight">
              Panduan Size Chart (cm)
            </h3>
          </div>
          <button
            @click="isSizeChartOpen = false"
            class="p-1 border border-brand-950 hover:bg-brand-950 hover:text-white transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Table Size -->
        <div class="overflow-x-auto">
          <table class="w-full text-left font-mono text-xs border border-brand-950">
            <thead class="bg-brand-950 text-scripture-gold uppercase font-bold text-[11px]">
              <tr>
                <th class="p-2.5 border-r border-brand-950">Size</th>
                <th class="p-2.5 border-r border-brand-950">Lebar Dada</th>
                <th class="p-2.5 border-r border-brand-950">Panjang</th>
                <th class="p-2.5">Lengan</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-brand-200 text-brand-800 bg-white">
              <tr>
                <td class="p-2.5 border-r border-brand-200 font-bold text-brand-950">S</td>
                <td class="p-2.5 border-r border-brand-200">54 cm</td>
                <td class="p-2.5 border-r border-brand-200">70 cm</td>
                <td class="p-2.5">22 cm</td>
              </tr>
              <tr>
                <td class="p-2.5 border-r border-brand-200 font-bold text-brand-950">M</td>
                <td class="p-2.5 border-r border-brand-200">57 cm</td>
                <td class="p-2.5 border-r border-brand-200">73 cm</td>
                <td class="p-2.5">24 cm</td>
              </tr>
              <tr>
                <td class="p-2.5 border-r border-brand-200 font-bold text-brand-950">L</td>
                <td class="p-2.5 border-r border-brand-200">60 cm</td>
                <td class="p-2.5 border-r border-brand-200">76 cm</td>
                <td class="p-2.5">26 cm</td>
              </tr>
              <tr>
                <td class="p-2.5 border-r border-brand-200 font-bold text-brand-950">XL</td>
                <td class="p-2.5 border-r border-brand-200">63 cm</td>
                <td class="p-2.5 border-r border-brand-200">78 cm</td>
                <td class="p-2.5">28 cm</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="font-mono text-[10px] text-brand-600">
          * Toleransi konveksi ± 1-2 cm karena proses pencucian katun tebal.
        </p>

        <button
          @click="isSizeChartOpen = false"
          class="w-full py-2 font-mono text-xs uppercase bg-brand-950 text-scripture-gold font-bold border border-brand-950 shadow-[2px_2px_0px_#153227] hover:bg-brand-900"
        >
          Tutup Panduan
        </button>
      </div>
    </div>

    <!-- ORDER FORM MODAL -->
    <OrderModal
      :isOpen="isOrderModalOpen"
      :product="product"
      :initialSize="selectedSize"
      @close="isOrderModalOpen = false"
    />

    <!-- RUNNING STREETWEAR TICKER TAPE AT BOTTOM -->
    <div class="mt-14 border-t-2 border-brand-950 bg-brand-950 text-scripture-gold py-2 overflow-hidden select-none font-mono text-xs uppercase tracking-widest font-black">
      <div class="animate-marquee flex items-center gap-8">
        <span class="flex items-center gap-3">
          <span>✦ BIBLE TALK ARCHIVE</span>
          <span class="text-white">/</span>
          <span>MADE TO WEAR, MADE TO REMIND</span>
          <span class="text-white">/</span>
          <span>MATTHEW 28:19-20</span>
          <span class="text-white">/</span>
          <span class="text-white">ORIGINAL STREETWEAR RELEASE</span>
        </span>
        <span class="flex items-center gap-3">
          <span>✦ BIBLE TALK ARCHIVE</span>
          <span class="text-white">/</span>
          <span>MADE TO WEAR, MADE TO REMIND</span>
        </span>
      </div>
    </div>

  </div>
</template>
