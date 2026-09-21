<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCatalogStore } from '../stores/catalogStore'
import ProductCard from '../components/catalog/ProductCard.vue'
import { Search, X, ArrowUpDown } from 'lucide-vue-next'

const route = useRoute()
const catalogStore = useCatalogStore()

onMounted(() => {
  if (route.query.category) {
    catalogStore.activeCategory = route.query.category
  }
})

watch(() => route.query.category, (newCategory) => {
  if (newCategory !== undefined) {
    catalogStore.activeCategory = newCategory || null
  }
})

const onlyInStock = ref(false)
const sortOption = ref('newest') // newest, price_asc, price_desc

// Filter & Sort Logic
const displayedProducts = computed(() => {
  let list = [...catalogStore.products]

  // Category filter
  if (catalogStore.activeCategory) {
    list = list.filter((p) => p.category?.slug === catalogStore.activeCategory)
  }

  // Search filter
  if (catalogStore.searchQuery.trim()) {
    const q = catalogStore.searchQuery.toLowerCase().trim()
    list = list.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }

  // In-stock only filter
  if (onlyInStock.value) {
    list = list.filter((p) => {
      if (p.status === 'sold_out') return false
      if (!p.variants || p.variants.length === 0) return true
      const total = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      return total > 0
    })
  }

  // Sorting
  if (sortOption.value === 'price_asc') {
    list.sort((a, b) => Number(a.price) - Number(b.price))
  } else if (sortOption.value === 'price_desc') {
    list.sort((a, b) => Number(b.price) - Number(a.price))
  } else {
    // Newest
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  return list
})

// Filter categories: only show tabs for categories that have at least 1 product
// Sold out products still count (only categories with zero products are hidden)
const categoriesWithProducts = computed(() => {
  if (catalogStore.loading && catalogStore.products.length === 0) {
    return catalogStore.categories
  }
  return catalogStore.categories.filter((cat) => {
    return catalogStore.products.some(
      (p) => p.category?.slug === cat.slug || p.category?.id === cat.id || p.category_id === cat.id
    )
  })
})

function selectCategory(slug) {
  catalogStore.activeCategory = slug
}

function clearFilters() {
  catalogStore.activeCategory = null
  catalogStore.searchQuery = ''
  onlyInStock.value = false
  sortOption.value = 'newest'
}
</script>

<template>
  <div class="relative bg-[#faf8f4] min-h-screen overflow-hidden">
    
    <!-- Ambient Halftone Dot Background Pattern -->
    <div class="absolute inset-0 bg-halftone text-brand-950/[0.07] pointer-events-none z-0"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      
      <!-- SLEEK COMPACT HEADER -->
      <div class="flex items-center justify-between pb-3 border-b-2 border-brand-950">
        <div>
          <h1 class="font-sans font-black text-2xl sm:text-4xl text-brand-950 uppercase tracking-tight leading-none">
            KATALOG
            <span class="inline-block bg-brand-950 text-scripture-gold px-2 sm:px-2.5 py-0.5 ml-1 -rotate-1 text-xl sm:text-3xl font-black shadow-[2px_2px_0px_#153227]">
              RILISAN.
            </span>
          </h1>
          <p class="text-xs sm:text-sm text-brand-700 font-sans mt-1.5 max-w-lg leading-relaxed">
            Eksplorasi seluruh rilisan pakaian, outerwear, dan aksesori bernuansa firman—dibuat untuk dipakai dan mengingatkan.
          </p>
        </div>
      </div>

      <!-- STREAMLINED CATEGORY TABS & CONTROLS -->
      <div class="space-y-3">
        
        <!-- Category Chips -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
          <button
            @click="selectCategory(null)"
            class="px-3 py-1.5 uppercase whitespace-nowrap transition-all border border-brand-950 font-bold text-[11px] sm:text-xs"
            :class="!catalogStore.activeCategory ? 'bg-brand-950 text-scripture-gold font-black shadow-[2px_2px_0px_#153227]' : 'bg-white text-brand-950 hover:bg-brand-100'"
          >
            Semua ({{ catalogStore.products.length }})
          </button>

          <button
            v-for="cat in categoriesWithProducts"
            :key="cat.id"
            @click="selectCategory(cat.slug)"
            class="px-3 py-1.5 uppercase whitespace-nowrap transition-all border border-brand-950 font-bold text-[11px] sm:text-xs"
            :class="catalogStore.activeCategory === cat.slug ? 'bg-brand-950 text-scripture-gold font-black shadow-[2px_2px_0px_#153227]' : 'bg-white text-brand-950 hover:bg-brand-100'"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Search & Quick Filters (Unified Inline Row) -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <!-- Live Search Input -->
          <div class="relative flex-grow">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
            <input
              v-model="catalogStore.searchQuery"
              type="text"
              placeholder="Cari artikel pakaian..."
              class="w-full pl-9 pr-8 py-2 bg-white border border-brand-950 text-xs sm:text-sm text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-950 font-mono shadow-[2px_2px_0px_#153227]"
            />
            <button
              v-if="catalogStore.searchQuery"
              @click="catalogStore.searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-500 hover:text-brand-950 p-0.5"
              title="Hapus pencarian"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Inline Filters (Ready Stock & Sort) -->
          <div class="flex items-center gap-2 font-mono text-xs shrink-0">
            <!-- Ready Stock Only Checkbox -->
            <label class="flex items-center gap-1.5 cursor-pointer bg-white border border-brand-950 px-3 py-2 hover:bg-brand-50 select-none transition-colors shadow-[2px_2px_0px_#153227]">
              <input
                type="checkbox"
                v-model="onlyInStock"
                class="w-3.5 h-3.5 accent-brand-950 rounded-none cursor-pointer"
              />
              <span class="text-brand-950 font-bold uppercase tracking-wider text-[11px]">Ready Stock</span>
            </label>

            <!-- Sort Select -->
            <div class="relative">
              <select
                v-model="sortOption"
                class="appearance-none bg-white border border-brand-950 text-brand-950 font-bold uppercase tracking-wider py-2 pl-3 pr-7 focus:outline-none cursor-pointer text-[11px] shadow-[2px_2px_0px_#153227]"
              >
                <option value="newest">Terbaru</option>
                <option value="price_asc">Termurah</option>
                <option value="price_desc">Termahal</option>
              </select>
              <ArrowUpDown class="w-3 h-3 text-brand-950 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

      </div>

      <!-- PRODUCTS GRID -->
      <div class="pt-2">
        <!-- Empty State (Tactile Zine Card Style) -->
        <div
          v-if="displayedProducts.length === 0"
          class="relative py-16 px-6 text-center bg-white zine-border zine-shadow max-w-lg mx-auto space-y-4 my-8"
        >
          <div class="tape-strip -top-3 left-1/2 -translate-x-1/2 rotate-1"></div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-100 text-brand-800 font-mono text-[10px] uppercase font-bold tracking-widest">
            <span>[ 0 ARTIKEL DITEMUKAN ]</span>
          </div>
          <h3 class="font-sans font-black text-xl sm:text-2xl text-brand-950 uppercase tracking-tight">
            Tidak Ada Pakaian Sesuai Kriteria
          </h3>
          <p class="text-xs text-brand-700 font-sans max-w-sm mx-auto leading-relaxed">
            Coba ubah kata kunci pencarian atau reset filter kategori untuk melihat seluruh rilisan koleksi.
          </p>
          <div class="pt-2">
            <button
              @click="clearFilters"
              class="px-5 py-2.5 font-mono text-xs bg-brand-950 text-scripture-gold font-black uppercase zine-border zine-shadow-sm zine-btn-active hover:bg-brand-900 transition-all inline-flex items-center gap-2"
            >
              <span>Reset Semua Filter</span>
            </button>
          </div>
        </div>

        <!-- Grid Cards (Choppy Crops Streetwear Product Cards) -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <ProductCard
            v-for="product in displayedProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>

    </div>

    <!-- RUNNING STREETWEAR TICKER TAPE AT BOTTOM OF CATALOG -->
    <div class="mt-16 border-t-2 border-brand-950 bg-brand-950 text-scripture-gold py-2.5 overflow-hidden select-none font-mono text-xs uppercase tracking-widest font-black">
      <div class="animate-marquee flex items-center gap-8">
        <span class="flex items-center gap-3">
          <span>✦ BIBLE TALK ARCHIVE</span>
          <span class="text-white">/</span>
          <span class="text-white">MADE TO WEAR, MADE TO REMIND</span>
          <span class="text-white">/</span>
          <span>HEAVYWEIGHT 16s COTTON</span>
          <span class="text-white">/</span>
          <span>MATTHEW 28:19-20</span>
          <span class="text-white">/</span>
          <span>BOXY FIT</span>
          <span class="text-white">/</span>
          <span>ORIGINAL FAITH APPAREL</span>
        </span>
        <span class="flex items-center gap-3">
          <span>✦ BIBLE TALK ARCHIVE</span>
          <span class="text-white">/</span>
          <span class="text-white">MADE TO WEAR, MADE TO REMIND</span>
          <span class="text-white">/</span>
          <span>HEAVYWEIGHT 16s COTTON</span>
        </span>
      </div>
    </div>

  </div>
</template>
