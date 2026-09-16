import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getCategories,
  getProducts,
  getLookbooks,
  getStoreSettings,
  getResolvedShowcaseCards,
  getBundles,
} from '../services/catalogService'

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref([])
  const homepageShowcaseCards = ref([])
  const products = ref([])
  const featuredProducts = ref([])
  const lookbooks = ref([])
  const bundles = ref([])
  const storeSettings = ref({
    brand_name: 'BIBLE TALK',
    tagline: 'Subculture & Contemporary Streetwear',
    whatsapp_number: '',
    announcement_bar: 'FREE SHIPPING SPECIAL DROP • WORLDWIDE DELIVERY AVAILABLE',
    address: 'Kabupaten Ngawi, Jawa Timur - Indonesia',
  })

  const loading = ref(false)
  const isLoaded = ref(false)
  const error = ref(null)

  // Filters
  const activeCategory = ref(null) // category slug or null for all
  const searchQuery = ref('')
  const sortBy = ref('created_at')
  const sortAsc = ref(false)

  // Computed Filtered Products for Catalog page
  const filteredProducts = computed(() => {
    let list = [...products.value]

    if (activeCategory.value) {
      list = list.filter((p) => p.category?.slug === activeCategory.value)
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    return list
  })

  // Format currency helper
  function formatPrice(value) {
    if (value === undefined || value === null) return 'Rp0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Load initial global data
  async function initStore() {
    if (isLoaded.value) return
    try {
      loading.value = true
      error.value = null

      const [cats, prods, books, settings, bundleItems] = await Promise.all([
        getCategories().catch(() => []),
        getProducts({ limit: 50 }).catch(() => []),
        getLookbooks().catch(() => []),
        getStoreSettings().catch(() => null),
        getBundles().catch(() => []),
      ])

      categories.value = cats
      homepageShowcaseCards.value = await getResolvedShowcaseCards(cats)
      products.value = prods
      featuredProducts.value = prods.filter((p) => p.is_featured)
      lookbooks.value = books
      bundles.value = bundleItems
      if (settings) {
        storeSettings.value = { ...storeSettings.value, ...settings }
      }

      isLoaded.value = true
    } catch (err) {
      console.error('Error initializing catalog store:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Refresh products list (e.g. after admin update)
  async function refreshProducts() {
    try {
      loading.value = true
      const prods = await getProducts({ limit: 100 })
      products.value = prods
      featuredProducts.value = prods.filter((p) => p.is_featured)
    } catch (err) {
      console.error('Error refreshing products:', err)
    } finally {
      loading.value = false
    }
  }

  // Refresh categories list and showcase cards (e.g. after admin update)
  async function refreshCategories() {
    try {
      const cats = await getCategories()
      categories.value = cats
      homepageShowcaseCards.value = await getResolvedShowcaseCards(cats)
    } catch (err) {
      console.error('Error refreshing categories:', err)
    }
  }

  // Refresh bundles list (e.g. after admin update)
  async function refreshBundles() {
    try {
      const b = await getBundles()
      bundles.value = b
    } catch (err) {
      console.error('Error refreshing bundles:', err)
    }
  }

  return {
    categories,
    homepageShowcaseCards,
    products,
    featuredProducts,
    lookbooks,
    bundles,
    storeSettings,
    loading,
    isLoaded,
    error,
    activeCategory,
    searchQuery,
    sortBy,
    sortAsc,
    filteredProducts,
    formatPrice,
    initStore,
    refreshProducts,
    refreshCategories,
    refreshBundles,
  }
})

