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
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    
    <!-- PAGE HEADER -->
    <div class="space-y-3 border-b border-brand-300 pb-8">
      <div class="flex items-center gap-2 text-xs font-mono text-brand-500 uppercase tracking-widest">
        <router-link to="/" class="hover:text-brand-800">Home</router-link>
        <span>/</span>
        <span class="text-scripture-bronze font-medium">Katalog Pakaian</span>
      </div>
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="font-serif font-bold text-3xl sm:text-5xl text-brand-950 uppercase tracking-tight">
            Katalog Rilisan
          </h1>
          <p class="text-sm text-brand-600 mt-1 font-sans">
            Koleksi t-shirt heavyweight, outerwear katun tebal, kargo, dan aksesoris berpesan firman.
          </p>
        </div>
        <span class="font-mono text-xs text-brand-600 bg-white border border-brand-300 px-3.5 py-1.5 rounded shadow-sm self-start md:self-auto">
          TOTAL: {{ displayedProducts.length }} ARTIKEL TERSEDIA
        </span>
      </div>
    </div>

    <!-- FILTER & CONTROLS BAR -->
    <div class="space-y-4">
      
      <!-- Categories Horizontal Scroll Tabs -->
      <div class="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none font-mono text-xs">
        <button
          @click="selectCategory(null)"
          class="px-4 py-2.5 rounded uppercase whitespace-nowrap transition-all border font-medium shadow-sm"
          :class="!catalogStore.activeCategory ? 'bg-brand-900 text-white border-brand-900 font-bold' : 'bg-white text-brand-700 border-brand-300 hover:border-brand-400 hover:text-brand-900'"
        >
          Semua ({{ catalogStore.products.length }})
        </button>

        <button
          v-for="cat in categoriesWithProducts"
          :key="cat.id"
          @click="selectCategory(cat.slug)"
          class="px-4 py-2.5 rounded uppercase whitespace-nowrap transition-all border font-medium shadow-sm"
          :class="catalogStore.activeCategory === cat.slug ? 'bg-brand-900 text-white border-brand-900 font-bold' : 'bg-white text-brand-700 border-brand-300 hover:border-brand-400 hover:text-brand-900'"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- Search, Stock Toggle, & Sort Row -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        
        <!-- Live Search Input -->
        <div class="relative flex-grow max-w-md">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
          <input
            v-model="catalogStore.searchQuery"
            type="text"
            placeholder="Cari artikel pakaian atau tema ayat..."
            class="w-full pl-10 pr-9 py-2.5 bg-white border border-brand-300 rounded text-sm text-brand-900 placeholder-brand-400 focus:outline-none focus:border-brand-600 font-sans shadow-sm"
          />
          <button
            v-if="catalogStore.searchQuery"
            @click="catalogStore.searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Filter Options -->
        <div class="flex items-center gap-2.5 self-end sm:self-auto font-mono text-xs">
          <!-- Ready Stock Only Checkbox -->
          <label class="flex items-center gap-2 cursor-pointer bg-white border border-brand-300 px-3.5 py-2.5 rounded hover:border-brand-400 select-none shadow-sm">
            <input
              type="checkbox"
              v-model="onlyInStock"
              class="w-3.5 h-3.5 accent-brand-900 rounded"
            />
            <span class="text-brand-700">Ready Saja</span>
          </label>

          <!-- Sort Select -->
          <div class="relative">
            <select
              v-model="sortOption"
              class="appearance-none bg-white border border-brand-300 text-brand-800 py-2.5 pl-3.5 pr-8 rounded focus:outline-none focus:border-brand-600 font-mono text-xs cursor-pointer shadow-sm"
            >
              <option value="newest">Rilis Terbaru</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
            </select>
            <ArrowUpDown class="w-3 h-3 text-brand-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

    </div>

    <!-- PRODUCTS GRID -->
    <div>
      <!-- Empty State -->
      <div
        v-if="displayedProducts.length === 0"
        class="py-20 text-center border border-dashed border-brand-300 rounded bg-white space-y-4 shadow-sm"
      >
        <p class="text-brand-600 font-sans text-base">
          Tidak ada pakaian yang sesuai dengan kriteria filter pencarian.
        </p>
        <button
          @click="clearFilters"
          class="px-5 py-2.5 font-mono text-xs bg-brand-900 text-white font-semibold uppercase rounded hover:bg-brand-800"
        >
          Reset Semua Filter
        </button>
      </div>

      <!-- Grid Cards -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
        <ProductCard
          v-for="product in displayedProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>

  </div>
</template>
