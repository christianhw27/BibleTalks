<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  ChevronLeft,
  ChevronRight,
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

// ==============================================================================
// DYNAMIC HERO SLIDER (MANAGEABLE VIA ADMIN)
// ==============================================================================
const defaultHeroSlides = [
  {
    id: 'slide-1',
    image: '/hero-product.jpg',
    badge: '★ 16S ULTRA HEAVY',
    caption: 'BIBLE TALK ARCHIVE // 2026',
    tag: 'REF. BT-HERO-01'
  }
]

const heroSlides = computed(() => {
  const slides = catalogStore.storeSettings?.hero_slides
  if (Array.isArray(slides) && slides.length > 0) {
    const valid = slides.filter((s) => s && (s.image || typeof s === 'string'))
    if (valid.length > 0) {
      return valid.map((s, idx) => {
        if (typeof s === 'string') {
          return {
            id: `slide-${idx}`,
            image: s,
            badge: '★ 16S ULTRA HEAVY',
            caption: 'BIBLE TALK ARCHIVE // 2026',
            tag: `REF. BT-HERO-0${idx + 1}`
          }
        }
        return {
          id: s.id || `slide-${idx}`,
          image: s.image,
          badge: s.badge || '★ 16S ULTRA HEAVY',
          caption: s.caption || 'BIBLE TALK ARCHIVE // 2026',
          tag: s.tag || `REF. BT-HERO-0${idx + 1}`
        }
      })
    }
  }
  return defaultHeroSlides
})

const currentHeroSlideIndex = ref(0)
const slideIntervalSeconds = computed(() => {
  return Number(catalogStore.storeSettings?.hero_slide_interval) || 4
})

let autoHeroSlideTimer = null

function nextHeroSlide() {
  if (heroSlides.value.length <= 1) return
  currentHeroSlideIndex.value = (currentHeroSlideIndex.value + 1) % heroSlides.value.length
}

function prevHeroSlide() {
  if (heroSlides.value.length <= 1) return
  currentHeroSlideIndex.value =
    (currentHeroSlideIndex.value - 1 + heroSlides.value.length) % heroSlides.value.length
}

function goToHeroSlide(idx) {
  currentHeroSlideIndex.value = idx
}

function startAutoHeroSlide() {
  stopAutoHeroSlide()
  if (heroSlides.value.length > 1) {
    autoHeroSlideTimer = setInterval(() => {
      nextHeroSlide()
    }, Math.max(2, slideIntervalSeconds.value) * 1000)
  }
}

function stopAutoHeroSlide() {
  if (autoHeroSlideTimer) {
    clearInterval(autoHeroSlideTimer)
    autoHeroSlideTimer = null
  }
}

onMounted(() => {
  startAutoHeroSlide()
})

onUnmounted(() => {
  stopAutoHeroSlide()
})

watch(
  [heroSlides, slideIntervalSeconds],
  () => {
    if (currentHeroSlideIndex.value >= heroSlides.value.length) {
      currentHeroSlideIndex.value = 0
    }
    startAutoHeroSlide()
  }
)
</script>

<template>
  <div class="space-y-12 sm:space-y-20 lg:space-y-28">
    
    <!-- HERO SECTION (HALFTONE & CHOPPY CROPS STREETWEAR ZINE) -->
    <section class="relative bg-[#faf8f4] border-b-2 border-brand-950 overflow-hidden h-[calc(100svh-5rem)] min-h-[520px] max-h-[960px] sm:h-auto sm:min-h-0 sm:max-h-none flex flex-col justify-between">
      
      <!-- Ambient Halftone Dot Background Pattern -->
      <div class="absolute inset-0 bg-halftone text-brand-950/[0.07] pointer-events-none z-0"></div>

      <!-- Hero Main Content Grid (100% Mobile & Desktop Responsive) -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-1 sm:py-8 lg:py-12 w-full flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-1.5 sm:gap-10 lg:gap-12 items-center justify-between">
        
        <!-- LEFT / TEXT & MANIFESTO COLUMN (Col 7 on Desktop, Anchored at Top on Mobile) -->
        <div class="w-full lg:col-span-7 flex flex-col items-start text-left flex-shrink-0 pt-0">
          
          <!-- Technical Spec & Scripture Pill (Desktop Only to keep mobile clean) -->
          <div class="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-white zine-border zine-shadow-sm font-mono text-xs text-brand-950 uppercase tracking-wider mb-5">
            <span class="w-2 h-2 bg-scripture-gold border border-brand-950"></span>
            <span class="font-bold">BIBLETALK.MERCH</span>

          </div>

          <!-- MOBILE HERO HEADLINE: FIGMA CASCADE DIAGONAL STAIRCASE -->
          <div class="sm:hidden w-full mb-1 select-none">
            <h1 class="font-sans uppercase leading-none relative">

              <!-- Row 1: MADE TO (kiri atas, sedikit miring kiri) -->
              <div class="flex items-center mb-2">
                <span class="inline-block font-black text-lg min-[380px]:text-xl min-[420px]:text-2xl tracking-tight text-brand-950 -rotate-1 origin-left">
                  MADE TO
                </span>
              </div>

              <!-- Row 2: [WEAR, badge besar kiri] + [MADE TO kanan inline] -->
              <div class="flex items-end gap-2 min-[380px]:gap-3 mb-2">
                <!-- WEAR, gold badge -->
                <span class="inline-block font-black text-[40px] min-[360px]:text-[46px] min-[400px]:text-[52px] tracking-tighter bg-scripture-gold text-brand-950 border-[3px] border-brand-950 px-3 min-[380px]:px-4 py-0.5 min-[380px]:py-1 rotate-2 shadow-[3px_3px_0px_#153227] leading-none whitespace-nowrap flex-shrink-0">
                  WEAR,
                </span>
                <!-- MADE TO (sejajar kanan, di bawah baseline WEAR) -->
                <span class="inline-block font-black text-lg min-[380px]:text-xl min-[420px]:text-2xl tracking-tight text-brand-950 rotate-1 origin-right pb-1 whitespace-nowrap">
                  MADE TO
                </span>
              </div>

              <!-- Row 3: REMIND. badge besar, kanan (staircase ke kanan) -->
              <div class="flex justify-end">
                <span class="inline-block font-black text-[40px] min-[360px]:text-[44px] min-[400px]:text-[50px] tracking-tighter bg-brand-950 text-scripture-gold border-[3px] border-brand-950 px-3 min-[380px]:px-4 py-0.5 min-[380px]:py-1 -rotate-2 shadow-[3px_3px_0px_#153227] leading-none whitespace-nowrap">
                  REMIND.
                </span>
              </div>

            </h1>
          </div>

          <!-- DESKTOP HERO HEADLINE (Stacked 4-Tier Streetwear Zine Impact) -->
          <h1 class="hidden sm:block font-sans uppercase leading-[0.84] sm:mb-5 select-none">
            <!-- Line 1: MADE TO (Prominent & Slightly Tilted Left) -->
            <span class="inline-block font-black sm:text-5xl md:text-6xl tracking-tighter text-brand-950 -rotate-1 origin-left">
              MADE TO
            </span>

            <!-- Line 2: WEAR (Punchy Gold Badge with +2deg Tilt) -->
            <div class="my-0.5">
              <span class="inline-block font-black sm:text-6xl md:text-7xl xl:text-8xl tracking-tighter bg-scripture-gold text-brand-950 border-2 sm:border-[3px] border-brand-950 px-2.5 sm:px-5 py-0.5 sm:py-1.5 rotate-2 hover:rotate-0 transition-transform duration-200 zine-shadow-sm sm:zine-shadow">
                WEAR,
              </span>
            </div>

            <!-- Line 3: MADE TO (Prominent & Slightly Tilted Right) -->
            <span class="inline-block font-black sm:text-5xl md:text-6xl tracking-tighter text-brand-950 rotate-1 origin-left sm:mt-2">
              MADE TO
            </span>

            <!-- Line 4: REMIND (Punchy Obsidian Badge with -2deg Tilt) -->
            <div class="my-0.5">
              <span class="inline-block font-black sm:text-6xl md:text-7xl xl:text-8xl tracking-tighter bg-brand-950 text-scripture-gold border-2 sm:border-[3px] border-brand-950 px-2.5 sm:px-5 py-0.5 sm:py-1.5 -rotate-2 hover:rotate-0 transition-transform duration-200 zine-shadow-sm sm:zine-shadow">
                REMIND.
              </span>
            </div>
          </h1>

          <!-- Streetwear Manifesto Subtitle (Framed Zine Label Style: Rapi & Geerrr) -->
          <div class="relative max-w-xl my-2 sm:my-3.5 p-2.5 sm:p-3 bg-white/80 zine-border zine-shadow-sm border-l-4 border-l-scripture-gold text-brand-950">
            <div class="flex items-center justify-between font-mono text-[9px] sm:text-[10px] uppercase font-bold text-brand-700 tracking-wider mb-1">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-scripture-gold border border-brand-950 inline-block"></span>
                <span class="font-black text-brand-950">BT // MISSION</span>
              </span>
              <span class="text-brand-500 hidden xs:inline">MATTHEW 28:19-20</span>
            </div>
            <p class="font-sans text-[11px] sm:text-xs md:text-sm font-semibold leading-relaxed text-brand-950">
              Created by church youth to weave God's Word into everyday culture—purposeful apparel crafted for the next generation to wear their faith boldly.
            </p>
          </div>

          <!-- CTA Buttons (Side-by-side on mobile, Tactile Zine Press) -->
          <div class="flex flex-row items-center gap-2 sm:gap-3.5 w-full sm:w-auto font-mono text-[11px] sm:text-xs uppercase tracking-wider mb-1 sm:mb-6">
            <router-link
              to="/catalog"
              class="flex-1 sm:flex-none px-4 sm:px-7 py-2 sm:py-3.5 bg-brand-950 hover:bg-brand-900 text-white font-black zine-border zine-shadow-sm sm:zine-shadow zine-shadow-hover zine-btn-active transition-all duration-150 flex items-center justify-center gap-2"
            >
              <span>Eksplor Drop</span>
              <ArrowRight class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-scripture-gold" />
            </router-link>

            <router-link
              to="/lookbook"
              class="px-3.5 sm:px-7 py-2 sm:py-3.5 bg-white hover:bg-brand-50 text-brand-950 font-black zine-border zine-shadow-sm sm:zine-shadow zine-shadow-hover zine-btn-active transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Camera class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-950" />
              <span>Lookbook</span>
            </router-link>
          </div>

          <!-- Micro Scripture Footnote (Desktop Only to prevent mobile clutter) -->
          <div class="hidden sm:flex items-center gap-2 text-xs font-mono text-brand-700 leading-snug">
            <span class="text-scripture-gold font-bold">✦</span>
            <span class="italic font-sans">"Kenakanlah belas kasihan, kemurahan, dan kerendahan hati."</span>
            <span class="font-mono font-bold text-brand-950 uppercase text-[10px]">— Kol 3:12</span>
          </div>

        </div>

        <!-- RIGHT / CHOPPY CROPS & HALFTONE COLLAGE COLUMN (Col 5 on Desktop, Fills Remaining Space on Mobile) -->
        <div class="w-full lg:col-span-5 relative flex-1 min-h-0 sm:flex-initial flex flex-col items-center justify-center my-1 sm:my-0">
          
          <!-- Collage Backplate Halftone Accent -->
          <div class="absolute -inset-2 bg-halftone text-brand-950/20 zine-border hidden sm:block pointer-events-none"></div>

          <!-- Main Collage Frame with Choppy Crop & Dynamic Slider -->
          <div
            @mouseenter="stopAutoHeroSlide"
            @mouseleave="startAutoHeroSlide"
            class="relative bg-white zine-border zine-shadow-gold sm:zine-shadow p-2 sm:p-3 sm:rotate-1 transition-transform hover:rotate-0 duration-300 group/hero-frame w-full h-full flex flex-col justify-between"
          >
            <!-- Physical Masking Tape on Corners -->
            <div class="tape-strip -top-2.5 left-4 sm:left-6 -rotate-3 scale-90 sm:scale-100"></div>
            <div class="tape-strip -bottom-2.5 right-4 sm:right-6 rotate-2 hidden sm:block"></div>

            <!-- Image Frame with Choppy Top-Right Cut and Auto-Crossfade (Fills full height on mobile) -->
            <div class="relative flex-1 min-h-[180px] sm:aspect-[3/4] w-full overflow-hidden bg-brand-100 zine-border choppy-crop-tr">
                
                <!-- Ambient Halftone Screen on Image -->
                <div class="absolute inset-0 halftone-screen opacity-20 pointer-events-none z-10"></div>

                <!-- Slide Layers -->
                <div
                  v-for="(slide, sIdx) in heroSlides"
                  :key="slide.id || sIdx"
                  class="absolute inset-0 transition-opacity duration-700 ease-out"
                  :class="sIdx === currentHeroSlideIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none -z-10'"
                >
                  <img
                    :src="slide.image"
                    :alt="slide.caption || 'Bible Talks Hero Garment'"
                    class="w-full h-full object-cover object-center contrast-[1.03] transition-transform duration-700 ease-out group-hover/hero-frame:scale-105"
                  />
                </div>

                <!-- Floating Sticker Slap 1: Dynamic Badge from current slide -->
                <div class="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 -rotate-6 transition-transform duration-300">
                  <div class="px-2.5 py-1 bg-scripture-gold text-brand-950 font-mono font-black text-[10px] sm:text-xs uppercase border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
                    {{ heroSlides[currentHeroSlideIndex]?.badge || '★ 16S ULTRA HEAVY' }}
                  </div>
                </div>

                <!-- Floating Sticker Slap 2: Contemporary Drop Badge (Desktop only to keep mobile clean) -->
                <div class="absolute bottom-4 right-4 z-20 rotate-3 hidden sm:block">
                  <div class="px-2.5 py-1 bg-brand-950 text-white font-mono font-black text-[10px] sm:text-xs uppercase border-2 border-white shadow-[2px_2px_0px_#f5b025] flex items-center gap-1.5">
                    <Sparkles class="w-3 h-3 text-scripture-gold fill-scripture-gold" />
                    <span>FAITH ARCHIVE</span>
                  </div>
                </div>

                <!-- Slider Controls (Left / Right Arrow buttons if slides > 1) -->
                <template v-if="heroSlides.length > 1">
                  <button
                    @click.stop="prevHeroSlide"
                    class="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white/90 hover:bg-white text-brand-950 zine-border zine-shadow-sm opacity-80 sm:opacity-0 sm:group-hover/hero-frame:opacity-100 transition-opacity"
                    title="Foto Sebelumnya"
                    aria-label="Previous Slide"
                  >
                    <ChevronLeft class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="nextHeroSlide"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-white/90 hover:bg-white text-brand-950 zine-border zine-shadow-sm opacity-80 sm:opacity-0 sm:group-hover/hero-frame:opacity-100 transition-opacity"
                    title="Foto Berikutnya"
                    aria-label="Next Slide"
                  >
                    <ChevronRight class="w-4 h-4" />
                  </button>

                  <!-- Slide Indicator Dots -->
                  <div class="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-1.5 bg-white/90 px-2 py-1 zine-border">
                    <button
                      v-for="(_, dotIdx) in heroSlides"
                      :key="dotIdx"
                      @click.stop="goToHeroSlide(dotIdx)"
                      class="h-1.5 rounded-full transition-all duration-300"
                      :class="dotIdx === currentHeroSlideIndex ? 'w-4 bg-brand-950' : 'w-1.5 bg-brand-400 hover:bg-brand-600'"
                      :title="`Slide ${dotIdx + 1}`"
                    ></button>
                  </div>
                </template>

              </div>

              <!-- Collage Caption Footer (Zine Spec Bar) -->
              <div class="pt-2.5 pb-1 px-1 flex items-center justify-between font-mono text-[10px] text-brand-900 uppercase">
                <span class="font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 bg-brand-950 inline-block"></span>
                  {{ heroSlides[currentHeroSlideIndex]?.caption || 'BIBLE TALK ARCHIVE // 2026' }}
                </span>
                <span class="text-brand-600 font-semibold tracking-wider">
                  {{ heroSlides[currentHeroSlideIndex]?.tag || 'REF. BT-HERO-01' }}
                </span>
              </div>

            </div>

          </div>

        </div>

      <!-- RUNNING STREETWEAR TICKER MARQUEE TAPE -->
      <div class="border-t-2 border-brand-950 bg-brand-950 text-scripture-gold py-2.5 overflow-hidden select-none font-mono text-xs uppercase tracking-widest font-black">
        <div class="animate-marquee flex items-center gap-8">
          <span class="flex items-center gap-3">
            <span>✦ BIBLE TALK APPAREL</span>
            <span class="text-white">/</span>
            <span class="text-white">MADE TO WEAR, MADE TO REMIND</span>
            <span class="text-white">/</span>
            <span>HEAVYWEIGHT 16s COTTON</span>
            <span class="text-white">/</span>
            <span>COLOSSIANS 3:12</span>
            <span class="text-white">/</span>
            <span>WALK IN LIGHT</span>
            <span class="text-white">/</span>
            <span>BOXY CUT DROP-SHOULDER</span>
            <span class="text-white">/</span>
            <span>ORIGINAL ARCHIVE DROP</span>
          </span>
          <span class="flex items-center gap-3">
            <span>✦ BIBLE TALK APPAREL</span>
            <span class="text-white">/</span>
            <span class="text-white">MADE TO WEAR, MADE TO REMIND</span>
            <span class="text-white">/</span>
            <span>HEAVYWEIGHT 16s COTTON</span>
            <span class="text-white">/</span>
            <span>COLOSSIANS 3:12</span>
            <span class="text-white">/</span>
            <span>WALK IN LIGHT</span>
            <span class="text-white">/</span>
            <span>BOXY CUT DROP-SHOULDER</span>
            <span class="text-white">/</span>
            <span>ORIGINAL ARCHIVE DROP</span>
          </span>
        </div>
      </div>

    </section>

    <!-- FEATURED RELEASES SECTION (STREETWEAR ZINE GRID) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-brand-950">
        <div>
          <div class="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-brand-950 uppercase font-bold tracking-wider mb-1">
            <span class="w-2 h-2 bg-scripture-gold border border-brand-950"></span>
            <span>CURATED DROP SELECTION</span>
          </div>
          <h2 class="font-sans font-black text-3xl sm:text-4xl md:text-5xl text-brand-950 uppercase tracking-tight">
            Rilisan Pilihan
          </h2>
        </div>

        <router-link
          to="/catalog"
          class="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold tracking-wider text-brand-950 hover:text-scripture-bronze transition-colors group px-3 py-1.5 bg-white zine-border zine-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5"
        >
          <span>Buka Semua Katalog ({{ catalogStore.products.length }})</span>
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="catalogStore.loading && catalogStore.products.length === 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div v-for="i in 4" :key="i" class="aspect-[4/5] bg-brand-200 zine-border animate-pulse"></div>
      </div>

      <!-- Products Grid (100% Responsive: 2 cols on mobile, 3 on tablet, 4 on desktop) -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 md:gap-7">
        <ProductCard
          v-for="product in featuredList"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>

    <!-- CATEGORY SHOWCASE SECTION (STREETWEAR ARCHIVE) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-3 border-b-2 border-brand-950">
        <div>
          <div class="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-brand-950 uppercase font-bold tracking-wider mb-1">
            <span class="w-2 h-2 bg-scripture-gold border border-brand-950"></span>
            <span>ARCHIVE EXPLORATION // SILHOUETTES</span>
          </div>
          <h2 class="font-sans font-black text-3xl sm:text-4xl md:text-5xl text-brand-950 uppercase tracking-tight">
            Kategori Koleksi
          </h2>
        </div>
        <p class="text-xs font-mono text-brand-700 uppercase tracking-wider max-w-sm font-semibold">
          Pilihan kategori pakaian spesifik berdasarkan potongan, gramasi kain, dan siluet boxy.
        </p>
      </div>

      <!-- Category Grid (Responsive: 1 col on mobile, 2 on tablet, 4 on desktop) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="cat in categoryList"
          :key="cat.id"
          @click="navigateToCategory(cat.slug)"
          class="group relative bg-[#fdfcfa] zine-border zine-shadow-sm sm:zine-shadow zine-shadow-hover transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
        >
          <!-- Physical Masking Tape on Card Header -->
          <div class="tape-strip -top-2.5 right-4 rotate-3 hidden sm:block"></div>

          <!-- Image Frame with Halftone Overlay & Choppy Corner Accent -->
          <div class="relative aspect-[4/5] overflow-hidden bg-brand-100 border-b-2 border-brand-950">
            <!-- Halftone screen on hover -->
            <div class="absolute inset-0 halftone-screen opacity-0 group-hover:opacity-40 transition-opacity duration-300 z-10 pointer-events-none"></div>

            <img
              :src="cat.image"
              :alt="cat.name"
              class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            
            <!-- Sticker Slap Badge -->
            <div class="absolute top-2.5 left-2.5 z-20 -rotate-3">
              <span class="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase bg-scripture-gold text-brand-950 font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227]">
                {{ cat.badge }}
              </span>
            </div>

            <!-- Choppy Corner Cutout Accent -->
            <div class="absolute top-0 right-0 w-6 h-6 bg-brand-950 [clip-path:polygon(100%_0,0_0,100%_100%)] z-10 opacity-90"></div>

            <!-- Bottom Title Floating with Scrim -->
            <div class="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-transparent to-transparent"></div>
            <div class="absolute bottom-3 left-3 right-3 text-white z-20">
              <span class="font-mono text-[9px] uppercase font-bold tracking-widest text-scripture-gold bg-brand-950/90 px-1.5 py-0.5 inline-block mb-1 border border-white/20">
                {{ cat.tag }}
              </span>
              <h3 class="font-sans font-black text-lg sm:text-xl uppercase leading-tight tracking-tight drop-shadow-md text-white">
                {{ cat.name }}
              </h3>
            </div>
          </div>

          <!-- Bottom Meta & Action -->
          <div class="p-4 flex flex-col justify-between flex-grow space-y-3 bg-[#fdfcfa]">
            <p class="text-xs text-brand-800 leading-relaxed font-sans font-medium">
              {{ cat.description }}
            </p>

            <div class="flex items-center justify-between pt-2.5 border-t-2 border-brand-950/15 text-[11px] font-mono uppercase tracking-wider text-brand-950 font-black group-hover:text-scripture-bronze transition-colors">
              <span>Jelajahi {{ cat.itemCount }}</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-scripture-gold fill-scripture-gold" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SPECIAL BUNDLE PACKS SECTION (CURATED DROPS) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Section Banner (Halftone & Brutalist Zine) -->
      <div class="relative bg-white zine-border zine-shadow sm:zine-shadow p-6 sm:p-10 mb-8 overflow-hidden">
        <div class="absolute inset-0 bg-halftone text-brand-950/[0.08] pointer-events-none"></div>
        <div class="relative z-10 max-w-3xl space-y-2.5">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-scripture-gold text-brand-950 font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider border-2 border-brand-950 shadow-[2px_2px_0px_#153227] -rotate-1">
            <Package class="w-3.5 h-3.5" />
            <span>SPECIAL BUNDLE OFFERS // ARCHIVE DROP</span>
          </div>
          <h2 class="font-sans font-black text-3xl sm:text-4xl md:text-5xl text-brand-950 uppercase tracking-tight">
            Paket Bundling Eksklusif
          </h2>
          <p class="text-xs sm:text-sm md:text-base text-brand-800 font-sans leading-relaxed font-medium">
            Kombinasi pakaian pilihan, aksesoris, dan produk lifestyle berpesan firman dengan potongan harga khusus.
          </p>
        </div>
      </div>

      <!-- Bundles Grid (Responsive: 1 col on mobile, 3 on desktop) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        <div
          v-for="bundle in bundleList"
          :key="bundle.id"
          class="bg-[#fdfcfa] zine-border zine-shadow-sm sm:zine-shadow zine-shadow-hover transition-all flex flex-col justify-between group overflow-hidden"
        >
          <!-- Top Media Container -->
          <div>
            <div
              @click="openBundleModal(bundle)"
              class="relative aspect-[4/5] overflow-hidden bg-brand-100 border-b-2 border-brand-950 cursor-pointer"
            >
              <!-- Masking Tape on Bundle Card -->
              <div class="tape-strip -top-2.5 left-6 -rotate-2 hidden sm:block"></div>

              <!-- Halftone hover layer -->
              <div class="absolute inset-0 halftone-screen opacity-0 group-hover:opacity-40 transition-opacity duration-300 z-10 pointer-events-none"></div>

              <img
                :src="bundle.image"
                :alt="bundle.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

              <!-- Sticker Badges -->
              <div class="absolute top-2.5 left-2.5 flex items-center gap-2 z-20 -rotate-2">
                <span class="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase bg-brand-950 text-white font-black border-2 border-white shadow-[2px_2px_0px_#153227]">
                  {{ bundle.badge }}
                </span>
              </div>
              <div class="absolute top-2.5 right-2.5 z-20 rotate-2">
                <span class="px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase bg-scripture-gold text-brand-950 font-black border-2 border-brand-950 shadow-[2px_2px_0px_#153227]">
                  {{ bundle.savingsText }}
                </span>
              </div>

              <!-- Quick Hover Indication to view details -->
              <div class="absolute bottom-3 inset-x-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-brand-950 text-[10px] font-mono uppercase tracking-wider font-black zine-border shadow-xs">
                  <Eye class="w-3.5 h-3.5" />
                  <span>Rincian Lengkap</span>
                </span>
                <span class="text-[10px] font-mono font-bold text-white bg-brand-950 px-2 py-0.5 border border-white">
                  {{ bundle.items?.length || 0 }} Items
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="p-5 space-y-3 bg-[#fdfcfa]">
              <div class="space-y-1">
                <h3
                  @click="openBundleModal(bundle)"
                  class="font-sans font-black text-lg sm:text-xl text-brand-950 uppercase leading-snug cursor-pointer hover:text-scripture-bronze transition-colors"
                >
                  {{ bundle.title }}
                </h3>
                <p class="text-[11px] font-mono text-brand-600 uppercase tracking-wider line-clamp-2 font-semibold">
                  {{ bundle.subtitle }}
                </p>
              </div>

              <!-- Price Box (Brutalist Ticket) -->
              <div class="p-3 bg-white zine-border flex items-baseline justify-between font-mono">
                <div>
                  <span class="text-[10px] text-brand-400 line-through block -mb-0.5 font-bold">
                    {{ catalogStore.formatPrice(bundle.originalPrice) }}
                  </span>
                  <span class="text-lg sm:text-xl font-black text-brand-950">
                    {{ catalogStore.formatPrice(bundle.bundlePrice) }}
                  </span>
                </div>
                <span class="text-[10px] text-brand-950 bg-scripture-gold border border-brand-950 px-2 py-0.5 font-black uppercase">
                  {{ bundle.savingsText }}
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Actions (Tactile Zine Buttons) -->
          <div class="p-5 pt-0 space-y-2 font-mono text-xs uppercase tracking-wider">
            <!-- WA Direct Order -->
            <button
              @click="openBundleOrderModal(bundle)"
              class="w-full py-3 bg-brand-950 hover:bg-brand-900 text-white font-black zine-border zine-shadow-sm zine-shadow-hover zine-btn-active flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle class="w-4 h-4 text-scripture-gold fill-scripture-gold" />
              <span>Pesan Bundle via WA</span>
            </button>

            <!-- View Detail Items Button -->
            <button
              @click="openBundleModal(bundle)"
              class="w-full py-2 bg-white hover:bg-brand-100 text-brand-950 font-black zine-border zine-btn-active transition-all flex items-center justify-center gap-2"
            >
              <Eye class="w-3.5 h-3.5 text-brand-700" />
              <span>Lihat Rincian Item ({{ bundle.items?.length || 0 }})</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- EDITORIAL LOOKBOOK BANNER (ZINE CENTERFOLD) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative bg-white zine-border zine-shadow sm:zine-shadow overflow-hidden">
        <!-- Ambient Halftone Pattern -->
        <div class="absolute inset-0 bg-halftone text-brand-950/[0.07] pointer-events-none"></div>

        <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center">
          
          <!-- Image Frame with Choppy Top-Right Cut (Col 7) -->
          <div class="lg:col-span-7 relative h-72 sm:h-96 lg:h-[460px] overflow-hidden bg-brand-100 zine-border lg:border-r-2 lg:border-b-0 border-b-2 border-brand-950">
            <div class="tape-strip -top-3 left-8 -rotate-2"></div>
            <div class="tape-strip -bottom-3 right-8 rotate-3 hidden sm:block"></div>

            <div class="absolute inset-0 halftone-screen opacity-20 pointer-events-none z-10"></div>
            
            <img
              :src="activeLookbook?.gallery?.[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'"
              alt="Editorial Photography"
              class="w-full h-full object-cover filter contrast-105 hover:scale-105 transition-all duration-700"
            />

            <!-- Top Stamped Sticker -->
            <div class="absolute top-4 left-4 z-20 -rotate-3">
              <span class="px-2.5 py-1 bg-brand-950 text-scripture-gold font-mono font-black text-[10px] sm:text-xs uppercase border-2 border-white shadow-[2px_2px_0px_#f5b025]">
                ✦ 35MM EDITORIAL ARCHIVE
              </span>
            </div>
          </div>

          <!-- Editorial Narrative (Col 5) -->
          <div class="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
            <div class="space-y-3">
              <div class="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-xs text-brand-950 uppercase font-bold tracking-wider">
                <span class="w-2 h-2 bg-scripture-gold border border-brand-950"></span>
                <span>EDITORIAL ARCHIVE // {{ activeLookbook?.season || 'SEASON 2026' }}</span>
              </div>
              <h2 class="font-sans font-black text-2xl sm:text-4xl text-brand-950 uppercase tracking-tight">
                {{ activeLookbook?.title || 'Genesis & Concrete Youth' }}
              </h2>
              <p class="text-brand-800 text-xs sm:text-sm leading-relaxed font-sans font-medium">
                {{ activeLookbook?.description || 'Dokumentasi visual pakaian, outerwear, dan aksesori di lanskap perkotaan. Menghadirkan keseimbangan antara pesan firman yang abadi dan estetika streetwear kontemporer.' }}
              </p>

              <!-- Quick Spec Row -->
              <div class="grid grid-cols-2 gap-2 pt-2 font-mono text-[10px] text-brand-700 border-t border-brand-950/15">
                <div>
                  <span class="text-brand-500 block">MEDIUM</span>
                  <span class="font-bold text-brand-950">35mm Kodak Tri-X</span>
                </div>
                <div>
                  <span class="text-brand-500 block">ARCHIVE</span>
                  <span class="font-bold text-brand-950">Vol. 01 / 8 Looks</span>
                </div>
              </div>
            </div>

            <div class="pt-2 flex items-center gap-3 flex-wrap">
              <router-link
                to="/lookbook"
                class="inline-flex items-center gap-2.5 px-6 py-3.5 font-mono text-xs uppercase font-black tracking-widest bg-brand-950 text-white hover:bg-brand-900 zine-border zine-shadow zine-shadow-hover zine-btn-active transition-all"
              >
                <span>Buka Full Lookbook</span>
                <ArrowRight class="w-4 h-4 text-scripture-gold" />
              </router-link>
              <router-link
                to="/catalog"
                class="inline-flex items-center gap-2 px-4 py-3.5 font-mono text-xs uppercase font-bold text-brand-950 hover:bg-brand-100 border border-brand-950 transition-colors"
              >
                <span>Lihat Katalog</span>
              </router-link>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- BUNDLE DETAIL MODAL (ZINE BRUTALIST DIALOG) -->
    <div
      v-if="selectedBundleModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      @click.self="closeBundleModal"
    >
      <div class="bg-[#fdfcfa] zine-border zine-shadow max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        
        <!-- Modal Header -->
        <div class="px-5 py-3.5 border-b-2 border-brand-950 flex items-center justify-between bg-brand-950 text-white flex-shrink-0 font-mono">
          <div class="flex items-center gap-2">
            <Package class="w-4 h-4 text-scripture-gold" />
            <span class="text-xs uppercase tracking-widest text-scripture-gold font-black">
              Rincian Paket Bundle
            </span>
          </div>
          <button
            @click="closeBundleModal"
            class="p-1 text-white hover:text-scripture-gold transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-5 flex-grow font-sans">
          <!-- Bundle Header Card with Photo -->
          <div class="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b-2 border-brand-950/20">
            <div class="w-full sm:w-32 aspect-square sm:aspect-[4/5] overflow-hidden bg-brand-100 zine-border flex-shrink-0">
              <img
                v-if="selectedBundleModal.image"
                :src="selectedBundleModal.image"
                :alt="selectedBundleModal.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="space-y-1.5 flex-grow">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase bg-scripture-gold text-brand-950 font-black border border-brand-950">
                  {{ selectedBundleModal.savingsText }}
                </span>
                <span class="px-2 py-0.5 text-[9px] font-mono tracking-widest uppercase bg-brand-950 text-white font-bold">
                  {{ selectedBundleModal.badge }}
                </span>
              </div>
              <h3 class="font-sans font-black text-xl text-brand-950 uppercase leading-tight">
                {{ selectedBundleModal.title }}
              </h3>
              <p class="text-xs font-mono text-brand-700 uppercase tracking-wider font-semibold">
                {{ selectedBundleModal.subtitle }}
              </p>
            </div>
          </div>

          <!-- Price Highlight -->
          <div class="p-3.5 bg-white zine-border flex items-center justify-between font-mono">
            <div>
              <span class="text-[10px] text-brand-600 block uppercase font-bold">Total Harga Paket:</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-brand-950">
                  {{ catalogStore.formatPrice(selectedBundleModal.bundlePrice) }}
                </span>
                <span class="text-xs text-brand-400 line-through font-bold">
                  {{ catalogStore.formatPrice(selectedBundleModal.originalPrice) }}
                </span>
              </div>
            </div>
            <span class="px-2.5 py-1 bg-scripture-gold border-2 border-brand-950 text-brand-950 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#153227]">
              {{ selectedBundleModal.savingsText }}
            </span>
          </div>

          <!-- Items Breakdown -->
          <div class="space-y-2.5">
            <h4 class="font-mono text-xs uppercase tracking-widest text-brand-950 font-black flex items-center gap-1.5">
              <span class="w-2 h-2 bg-brand-950"></span>
              Item yang Termasuk Dalam Paket:
            </h4>
            <div class="space-y-2">
              <div
                v-for="(item, idx) in selectedBundleModal.items"
                :key="idx"
                class="p-2.5 bg-white zine-border flex items-start gap-3"
              >
                <div class="w-5 h-5 bg-brand-950 text-scripture-gold flex items-center justify-center flex-shrink-0 text-[10px] font-black font-mono mt-0.5">
                  {{ idx + 1 }}
                </div>
                <div>
                  <div class="text-xs sm:text-sm font-bold text-brand-950">
                    {{ item.name }}
                  </div>
                  <div class="text-[11px] text-brand-600 mt-0.5 font-mono">
                    {{ item.detail }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="text-[11px] text-brand-800 font-mono bg-white p-3 zine-border">
            💡 <em>Catatan: Pemilihan ukuran kaos (S, M, L, XL) dapat dikonfirmasi langsung saat chat dengan admin via WhatsApp.</em>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-5 py-3.5 border-t-2 border-brand-950 bg-white flex items-center justify-end gap-3 flex-shrink-0 font-mono text-xs uppercase">
          <button
            @click="closeBundleModal"
            class="px-4 py-2 text-brand-950 font-bold hover:bg-brand-100 zine-border"
          >
            Tutup
          </button>
          <button
            @click="openBundleOrderModal(selectedBundleModal); closeBundleModal()"
            class="px-5 py-2 bg-brand-950 hover:bg-brand-900 text-white font-black zine-border zine-shadow-sm zine-btn-active flex items-center gap-2"
          >
            <MessageCircle class="w-4 h-4 text-scripture-gold fill-scripture-gold" />
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
