<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalogStore'
import ProductCard from '../components/catalog/ProductCard.vue'
import OrderModal from '../components/order/OrderModal.vue'
import {
  ArrowRight,
  Camera,
  Layers,
  Package,
  Check,
  MessageCircle,
  X,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Tag,
  Eye,
} from 'lucide-vue-next'

const router = useRouter()
const catalogStore = useCatalogStore()

const featuredList = computed(() => {
  if (catalogStore.featuredProducts.length > 0) {
    return catalogStore.featuredProducts.slice(0, 4)
  }
  return catalogStore.products.slice(0, 4)
})

const activeLookbook = computed(() => {
  return catalogStore.lookbooks?.[0] || null
})

// Dynamic Categories from Catalog Store Showcase (Editable via Admin)
const categoryList = computed(() => {
  if (catalogStore.homepageShowcaseCards && catalogStore.homepageShowcaseCards.length > 0) {
    return catalogStore.homepageShowcaseCards.map((card) => ({
      id: card.id,
      slug: card.category_slug,
      name: card.title || card.category_name,
      tag: card.tag,
      description: card.description,
      image: card.image,
      badge: card.badge,
      itemCount: card.button_text || card.title,
    }))
  }

  // Fallback defaults while loading
  return [
    {
      id: 'jackets',
      slug: 'hoodies-outerwear',
      name: 'Jackets & Outerwear',
      tag: '01 // OUTERWEAR',
      description: 'Zip hoodies 380 GSM, coaches jacket, dan rajut katun tebal.',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      badge: 'HOT DROP',
      itemCount: 'Outerwear',
    },
    {
      id: 't-shirts',
      slug: 't-shirts',
      name: 'Heavyweight T-Shirts',
      tag: '02 // SIGNATURE CUT',
      description: 'Kaos katun 16s 235+ GSM kokoh berpotongan boxy drop-shoulder.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      badge: 'BESTSELLER',
      itemCount: 'Kaos Boxy',
    },
    {
      id: 'accessories',
      slug: 'accessories',
      name: 'Aksesoris & Lain-Lain',
      tag: '03 // AKSESORIS & MORE',
      description: 'Topi corduroy 6-panel, beanie, tote bag kanvas, enamel pin, dan pelengkap gaya.',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      badge: 'ESSENTIALS',
      itemCount: 'Aksesoris',
    },
    {
      id: 'pants',
      slug: 'pants-cargos',
      name: 'Pants & Cargos',
      tag: '04 // BOTTOMS',
      description: 'Utility parachute trousers, denim, dan relaxed cargo pants.',
      image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80',
      badge: 'STREET CUT',
      itemCount: 'Celana & Cargo',
    },
  ]
})

function navigateToCategory(slug) {
  catalogStore.activeCategory = slug
  router.push({ path: '/catalog', query: { category: slug } })
}

// Curated Bundles (Dynamic from Store / Admin / Fallback)
import { DEFAULT_BUNDLES } from '../services/bundleService'

const bundleList = computed(() => {
  if (catalogStore.bundles && catalogStore.bundles.length > 0) {
    return catalogStore.bundles.filter((b) => b.is_active !== false)
  }
  return DEFAULT_BUNDLES
})

const selectedBundleModal = ref(null)

function openBundleModal(bundle) {
  selectedBundleModal.value = bundle
}

function closeBundleModal() {
  selectedBundleModal.value = null
}

function orderBundleWhatsApp(bundle) {
  openBundleOrderModal(bundle)
}

const bundleOrderModalProduct = ref(null)
const isBundleOrderModalOpen = ref(false)

function openBundleOrderModal(bundle) {
  if (!bundle) return
  bundleOrderModalProduct.value = {
    title: `[Bundle] ${bundle.title}`,
    price: bundle.bundlePrice,
    images: bundle.image ? [bundle.image] : [],
    category: { name: 'Exclusive Bundling' },
    variants: [
      { size: 'S', stock: 10 },
      { size: 'M', stock: 10 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 10 },
      { size: 'XXL', stock: 5 },
    ],
  }
  isBundleOrderModalOpen.value = true
}
</script>

<template>
  <div class="space-y-28">
    
    <!-- HERO SECTION (BRIGHT, ELEGANT & SCRIPTURE INFUSED) -->
    <section class="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden border-b border-brand-300/80 bg-[#fbfbfa]">
      
      <!-- Ambient Sunlit Background Banner -->
      <div class="absolute inset-0 z-0">
        <picture class="w-full h-full block">
          <source media="(max-width: 639px)" srcset="/Mobile_BG.png" />
          <img
            src="/hero-banner.jpg"
            @error="$event.target.src = 'https://i.pinimg.com/736x/15/e9/8a/15e98ae06cc4737280a5364d21d5d37d.jpg'"
            alt="Bible Talk Light Banner"
            class="w-full h-full object-cover object-center filter contrast-[1.04] brightness-[1.01]"
          />
        </picture>
        <!-- Subtle bottom blend only at the bottom 25% to transition smoothly into the catalog section -->
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent 75% to-[#fcfcfb]"></div>
      </div>

      <!-- Hero Content -->
      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 sm:py-28">
        
        <!-- Scripture Pill Tag -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-brand-300/90 shadow-sm text-xs font-mono text-brand-800 mb-8">
          <span class="text-scripture-gold font-serif">✦</span>
          <span class="tracking-widest uppercase font-semibold">COLOSSIANS 3:12 // CLOTHED IN PURPOSE</span>
        </div>

        <!-- Grand Serif Headline -->
        <h1 class="font-serif font-bold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-brand-950 uppercase leading-[1.02] mb-8 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          Walk in Light &<br />
          <span class="italic font-normal font-serif text-scripture-bronze">
            Rooted in Grace
          </span>
        </h1>

        <p class="max-w-2xl mx-auto text-base sm:text-lg text-brand-800 font-sans leading-relaxed mb-12 font-medium drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
          Pakaian kontemporer yang menyatukan pesan firman, potongan boxy drop-shoulder yang bersahaja, dan kemewahan kain katun 16s ultra-heavyweight.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs uppercase tracking-widest">
          <router-link
            to="/catalog"
            class="w-full sm:w-auto px-8 py-4 bg-brand-900 hover:bg-brand-800 text-white font-semibold rounded shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span>Eksplor Katalog Pakaian</span>
            <ArrowRight class="w-4 h-4" />
          </router-link>

          <router-link
            to="/lookbook"
            class="w-full sm:w-auto px-8 py-4 bg-white/95 hover:bg-white text-brand-900 border border-brand-300/90 rounded shadow-md hover:shadow-lg backdrop-blur-xs transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Camera class="w-4 h-4 text-scripture-bronze" />
            <span>Lihat Editorial Lookbook</span>
          </router-link>
        </div>

      </div>
    </section>

    <!-- FEATURED RELEASES SECTION (LANGSUNG SETELAH HERO) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-brand-300">
        <div>
          <span class="font-mono text-xs text-scripture-bronze uppercase tracking-widest block mb-1">
            CURATED SELECTION
          </span>
          <h2 class="font-serif font-bold text-2xl sm:text-4xl text-brand-950 uppercase tracking-tight">
            Rilisan Pilihan
          </h2>
        </div>

        <router-link
          to="/catalog"
          class="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-brand-700 hover:text-brand-950 transition-colors group"
        >
          <span>Buka Semua Katalog ({{ catalogStore.products.length }})</span>
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="catalogStore.loading && catalogStore.products.length === 0" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="i in 4" :key="i" class="aspect-[4/5] bg-brand-200 animate-pulse rounded"></div>
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        <ProductCard
          v-for="product in featuredList"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>

    <!-- CATEGORY SHOWCASE SECTION -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-brand-300">
        <div>
          <span class="font-mono text-xs text-scripture-bronze uppercase tracking-widest block mb-1">
            EXPLORE THE CRAFT
          </span>
          <h2 class="font-serif font-bold text-2xl sm:text-4xl text-brand-950 uppercase tracking-tight">
            Kategori Koleksi
          </h2>
        </div>
        <p class="text-xs font-mono text-brand-500 uppercase tracking-wider max-w-sm">
          Pilih kategori pakaian untuk melihat katalog spesifik berdasarkan potongan dan bahan.
        </p>
      </div>

      <!-- Category Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="cat in categoryList"
          :key="cat.id"
          @click="navigateToCategory(cat.slug)"
          class="group relative bg-white border border-brand-300 rounded overflow-hidden shadow-sm hover:shadow-lg hover:border-brand-500 transition-all duration-300 cursor-pointer flex flex-col"
        >
          <!-- Image Frame with Zoom -->
          <div class="relative aspect-[4/5] overflow-hidden bg-brand-100">
            <img
              :src="cat.image"
              :alt="cat.name"
              class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

            <!-- Top Badge -->
            <div class="absolute top-3 left-3">
              <span class="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase bg-white/95 text-brand-900 font-semibold rounded shadow-sm">
                {{ cat.badge }}
              </span>
            </div>

            <!-- Bottom Floating Overlay Title -->
            <div class="absolute bottom-4 left-4 right-4 text-white">
              <span class="font-mono text-[10px] uppercase tracking-widest text-scripture-sand block mb-0.5">
                {{ cat.tag }}
              </span>
              <h3 class="font-serif font-bold text-xl uppercase leading-tight tracking-wide drop-shadow-sm">
                {{ cat.name }}
              </h3>
            </div>
          </div>

          <!-- Bottom Meta & Action -->
          <div class="p-5 flex flex-col justify-between flex-grow space-y-4 bg-white border-t border-brand-200">
            <p class="text-xs text-brand-600 leading-relaxed font-sans">
              {{ cat.description }}
            </p>

            <div class="flex items-center justify-between pt-3 border-t border-brand-100 text-xs font-mono uppercase tracking-widest text-brand-800 font-semibold group-hover:text-scripture-bronze transition-colors">
              <span>Jelajahi {{ cat.itemCount }}</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SPECIAL BUNDLE PACKS SECTION (NEW CURATED DROPS) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Section Header -->
      <div class="relative bg-gradient-to-r from-scripture-linen/60 via-white to-scripture-linen/60 border border-brand-300 rounded-xl p-8 sm:p-12 mb-10 shadow-sm">
        <div class="max-w-3xl space-y-3">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-brand-300 text-[11px] font-mono text-scripture-bronze uppercase tracking-widest font-semibold shadow-xs">
            <Package class="w-3.5 h-3.5" />
            <span>SPECIAL BUNDLE OFFERS // LEBIH HEMAT</span>
          </div>
          <h2 class="font-serif font-bold text-3xl sm:text-5xl text-brand-950 uppercase tracking-tight">
            Paket Bundling Eksklusif
          </h2>
          <p class="text-sm sm:text-base text-brand-600 font-sans leading-relaxed">
            Kombinasi pakaian pilihan, aksesoris, dan produk lifestyle berpesan firman dengan harga khusus. Solusi praktis untuk outfit lengkap atau hadiah bermakna.
          </p>
        </div>
      </div>

      <!-- Bundles Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="bundle in bundleList"
          :key="bundle.id"
          class="bg-white border border-brand-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
        >
          <!-- Top Media Container (Prominent Portrait Aspect Ratio) -->
          <div>
            <div
              @click="openBundleModal(bundle)"
              class="relative aspect-[4/5] overflow-hidden bg-brand-100 cursor-pointer"
            >
              <img
                :src="bundle.image"
                :alt="bundle.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"></div>

              <!-- Badges -->
              <div class="absolute top-3 left-3 flex items-center gap-2">
                <span class="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase bg-brand-900/95 backdrop-blur-xs text-white font-semibold rounded shadow-xs">
                  {{ bundle.badge }}
                </span>
              </div>
              <div class="absolute top-3 right-3">
                <span class="px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase bg-amber-400 text-brand-950 font-bold rounded shadow-xs">
                  {{ bundle.savingsText }}
                </span>
              </div>

              <!-- Quick Hover Indication to view details -->
              <div class="absolute bottom-3 inset-x-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/95 backdrop-blur-xs text-brand-950 text-[10px] font-mono uppercase tracking-wider font-semibold shadow-sm">
                  <Eye class="w-3.5 h-3.5" />
                  <span>Rincian Lengkap</span>
                </span>
                <span class="text-[10px] font-mono text-white bg-black/60 px-2 py-1 rounded backdrop-blur-xs">
                  {{ bundle.items?.length || 0 }} Items
                </span>
              </div>
            </div>

            <!-- Content (Clean, photo-first focus without cluttering item lists) -->
            <div class="p-6 space-y-4">
              <div class="space-y-1">
                <h3
                  @click="openBundleModal(bundle)"
                  class="font-serif font-bold text-xl text-brand-950 uppercase leading-snug cursor-pointer hover:text-scripture-bronze transition-colors"
                >
                  {{ bundle.title }}
                </h3>
                <p class="text-xs font-mono text-brand-500 uppercase tracking-wider line-clamp-2">
                  {{ bundle.subtitle }}
                </p>
              </div>

              <!-- Price Box -->
              <div class="p-3.5 bg-brand-50 border border-brand-200 rounded flex items-baseline justify-between">
                <div>
                  <span class="text-[11px] font-mono text-brand-400 line-through block -mb-0.5">
                    {{ catalogStore.formatPrice(bundle.originalPrice) }}
                  </span>
                  <span class="font-mono text-xl font-bold text-brand-950">
                    {{ catalogStore.formatPrice(bundle.bundlePrice) }}
                  </span>
                </div>
                <span class="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-semibold">
                  {{ bundle.savingsText }}
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="p-6 pt-0 space-y-2 font-mono text-xs uppercase tracking-wider">
            <!-- WA Direct Order -->
            <button
              @click="openBundleOrderModal(bundle)"
              class="w-full py-3 bg-brand-900 hover:bg-brand-800 text-white font-semibold rounded flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle class="w-4 h-4 text-emerald-400" />
              <span>Pesan Bundle via WA</span>
            </button>

            <!-- View Detail Items Button -->
            <button
              @click="openBundleModal(bundle)"
              class="w-full py-2.5 bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 rounded transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Eye class="w-3.5 h-3.5 text-brand-500" />
              <span>Lihat Rincian Item ({{ bundle.items?.length || 0 }})</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- EDITORIAL LOOKBOOK BANNER -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative bg-white border border-brand-300 rounded overflow-hidden shadow-sm">
        <div class="grid grid-cols-1 lg:grid-cols-2 items-center">
          
          <!-- Image Frame -->
          <div class="relative h-80 sm:h-96 lg:h-[480px] overflow-hidden bg-brand-100">
            <img
              :src="activeLookbook?.gallery?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'"
              alt="Editorial Photography"
              class="w-full h-full object-cover filter contrast-105 hover:scale-105 transition-all duration-700"
            />
          </div>

          <!-- Editorial Narrative -->
          <div class="p-8 sm:p-12 lg:p-16 flex flex-col justify-between space-y-6">
            <div class="space-y-4">
              <span class="font-mono text-xs text-scripture-bronze tracking-widest uppercase">
                EDITORIAL ARCHIVE // {{ activeLookbook?.season || 'SEASON 2026' }}
              </span>
              <h2 class="font-serif font-bold text-3xl sm:text-4xl text-brand-950 uppercase tracking-tight">
                {{ activeLookbook?.title || 'Genesis & Concrete Youth' }}
              </h2>
              <p class="text-brand-600 text-sm sm:text-base leading-relaxed font-sans">
                {{ activeLookbook?.description || 'Dokumentasi visual pakaian di bawah cahaya mentari perkotaan. Menghadirkan keseimbangan antara pesan firman yang abadi dan estetika modern kontemporer.' }}
              </p>
            </div>

            <div class="pt-4">
              <router-link
                to="/lookbook"
                class="inline-flex items-center gap-2 px-6 py-3.5 font-mono text-xs uppercase tracking-widest bg-brand-900 text-white hover:bg-brand-800 font-semibold rounded shadow transition-colors"
              >
                <span>Buka Full Lookbook</span>
                <ArrowRight class="w-4 h-4" />
              </router-link>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- BUNDLE DETAIL MODAL -->
    <div
      v-if="selectedBundleModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      @click.self="closeBundleModal"
    >
      <div class="bg-white border border-brand-300 rounded-lg max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-brand-200 flex items-center justify-between bg-brand-50 flex-shrink-0">
          <div class="flex items-center gap-2">
            <Package class="w-4 h-4 text-scripture-gold" />
            <span class="font-mono text-xs uppercase tracking-widest text-brand-900 font-bold">
              Rincian Paket Bundle
            </span>
          </div>
          <button
            @click="closeBundleModal"
            class="p-1.5 text-brand-400 hover:text-brand-900 rounded hover:bg-brand-200 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 overflow-y-auto space-y-6 flex-grow">
          <!-- Bundle Header Card with Photo -->
          <div class="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b border-brand-200">
            <div class="w-full sm:w-36 aspect-square sm:aspect-[4/5] rounded overflow-hidden bg-brand-100 border border-brand-200 flex-shrink-0">
              <img
                v-if="selectedBundleModal.image"
                :src="selectedBundleModal.image"
                :alt="selectedBundleModal.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="space-y-2 flex-grow">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded">
                  {{ selectedBundleModal.savingsText }}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-brand-900 text-white font-medium rounded">
                  {{ selectedBundleModal.badge }}
                </span>
              </div>
              <h3 class="font-serif font-bold text-xl sm:text-2xl text-brand-950 uppercase leading-tight">
                {{ selectedBundleModal.title }}
              </h3>
              <p class="text-xs font-mono text-brand-600 uppercase tracking-wider">
                {{ selectedBundleModal.subtitle }}
              </p>
            </div>
          </div>

          <!-- Price Highlight -->
          <div class="p-4 bg-brand-100/70 border border-brand-200 rounded flex items-center justify-between">
            <div>
              <span class="text-xs font-mono text-brand-500 block">Total Harga Paket:</span>
              <div class="flex items-baseline gap-2">
                <span class="font-mono text-2xl font-bold text-brand-950">
                  {{ catalogStore.formatPrice(selectedBundleModal.bundlePrice) }}
                </span>
                <span class="font-mono text-xs text-brand-400 line-through">
                  {{ catalogStore.formatPrice(selectedBundleModal.originalPrice) }}
                </span>
              </div>
            </div>
            <span class="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded">
              {{ selectedBundleModal.savingsText }}
            </span>
          </div>

          <!-- Items Breakdown -->
          <div class="space-y-3">
            <h4 class="font-mono text-xs uppercase tracking-widest text-brand-900 font-bold">
              Item yang Termasuk Dalam Paket:
            </h4>
            <div class="space-y-3">
              <div
                v-for="(item, idx) in selectedBundleModal.items"
                :key="idx"
                class="p-3 bg-white border border-brand-200 rounded flex items-start gap-3"
              >
                <div class="w-6 h-6 rounded-full bg-scripture-linen border border-scripture-sand flex items-center justify-center text-scripture-bronze flex-shrink-0 text-xs font-bold font-mono mt-0.5">
                  {{ idx + 1 }}
                </div>
                <div>
                  <div class="text-sm font-semibold text-brand-900">
                    {{ item.name }}
                  </div>
                  <div class="text-xs text-brand-500 mt-0.5">
                    {{ item.detail }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-[11px] text-brand-500 font-mono bg-brand-50 p-3 rounded border border-brand-200">
            💡 <em>Catatan: Pemilihan ukuran kaos (S, M, L, XL) dapat dikonfirmasi langsung saat chat dengan admin via WhatsApp.</em>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-brand-200 bg-white flex items-center justify-end gap-3 flex-shrink-0">
          <button
            @click="closeBundleModal"
            class="px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-brand-700 hover:bg-brand-100 rounded"
          >
            Tutup
          </button>
          <button
            @click="openBundleOrderModal(selectedBundleModal); closeBundleModal()"
            class="px-5 py-2.5 text-xs font-mono uppercase tracking-widest bg-brand-900 hover:bg-brand-800 text-white font-bold rounded flex items-center gap-2 shadow-sm"
          >
            <MessageCircle class="w-4 h-4 text-emerald-400" />
            <span>Pesan Sekarang via WA</span>
          </button>
        </div>

      </div>
    </div>

    <!-- BUNDLE ORDER MODAL -->
    <OrderModal
      :isOpen="isBundleOrderModalOpen"
      :product="bundleOrderModalProduct"
      @close="isBundleOrderModalOpen = false"
    />

  </div>
</template>
