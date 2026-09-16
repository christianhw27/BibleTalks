<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCatalogStore } from '../../stores/catalogStore'
import { useAuthStore } from '../../stores/authStore'
import {
  Menu,
  X,
  Search,
  Lock,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const catalogStore = useCatalogStore()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)
const isSearchOpen = ref(false)
const searchInput = ref('')

function handleSearchSubmit() {
  if (searchInput.value.trim()) {
    catalogStore.searchQuery = searchInput.value.trim()
    catalogStore.activeCategory = null
    router.push('/catalog')
    isSearchOpen.value = false
  }
}

function openWhatsApp() {
  const wa = catalogStore.storeSettings.whatsapp_number || '6281234567890'
  const text = encodeURIComponent('Halo Bible Talk, saya ingin bertanya tentang katalog rilisan pakaian.')
  window.open(`https://wa.me/${wa}?text=${text}`, '_blank')
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-brand-300/80 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-18 sm:h-22">
        
        <!-- Left: Brand Logo (Official Bible Talk Asset) -->
        <div class="flex items-center gap-10">
          <router-link to="/" class="flex items-center gap-3 group py-1">
            <img 
              src="/Bible Talk _Text.png" 
              alt="BIBLE TALK" 
              class="h-8 sm:h-10 md:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </router-link>

          <!-- Desktop Navigation Links -->
          <nav class="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-widest">
            <router-link
              to="/"
              class="transition-colors hover:text-brand-900 py-1 border-b-2"
              :class="route.path === '/' ? 'text-brand-900 border-scripture-gold font-semibold' : 'text-brand-600 border-transparent'"
            >
              Home
            </router-link>
            <router-link
              to="/catalog"
              class="transition-colors hover:text-brand-900 py-1 border-b-2"
              :class="route.path.startsWith('/catalog') ? 'text-brand-900 border-scripture-gold font-semibold' : 'text-brand-600 border-transparent'"
            >
              Katalog
            </router-link>
            <router-link
              to="/lookbook"
              class="transition-colors hover:text-brand-900 py-1 border-b-2 flex items-center gap-1.5"
              :class="route.path === '/lookbook' ? 'text-brand-900 border-scripture-gold font-semibold' : 'text-brand-600 border-transparent'"
            >
              Lookbook
            </router-link>
          </nav>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-3">
          <!-- Search toggle -->
          <button
            @click="isSearchOpen = !isSearchOpen"
            class="p-2 text-brand-600 hover:text-brand-900 hover:bg-brand-100 rounded-full transition-colors"
            title="Cari Pakaian"
            aria-label="Cari Pakaian"
          >
            <Search class="w-4 h-4" />
          </button>

          <!-- WhatsApp Direct -->
          <button
            @click="openWhatsApp"
            class="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-mono tracking-wider text-brand-800 bg-brand-100 hover:bg-brand-200 border border-brand-300 rounded transition-all"
          >
            <MessageCircle class="w-3.5 h-3.5 text-emerald-600" />
            <span>Chat Admin</span>
          </button>

          <!-- Mobile Hamburger -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 text-brand-700 hover:text-brand-900 hover:bg-brand-100 rounded"
            aria-label="Toggle Menu"
          >
            <Menu v-if="!isMobileMenuOpen" class="w-5 h-5" />
            <X v-else class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Expandable Search Overlay -->
      <div
        v-if="isSearchOpen"
        class="py-3 border-t border-brand-200 transition-all"
      >
        <form @submit.prevent="handleSearchSubmit" class="relative flex items-center">
          <Search class="absolute left-3.5 w-4 h-4 text-brand-400" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Cari artikel pakaian, bahan katun 16s, atau tema firman..."
            class="w-full pl-10 pr-24 py-2.5 bg-brand-50 border border-brand-300 rounded text-sm text-brand-900 placeholder-brand-400 focus:outline-none focus:border-brand-600 font-sans"
            autofocus
          />
          <button
            type="submit"
            class="absolute right-2 px-3 py-1 text-xs font-mono uppercase bg-brand-900 text-white rounded hover:bg-brand-800 transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      <!-- Mobile Menu Drawer -->
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden py-4 border-t border-brand-200 space-y-3 font-mono text-xs uppercase"
      >
        <router-link
          to="/"
          @click="isMobileMenuOpen = false"
          class="block px-3 py-2 rounded hover:bg-brand-100"
          :class="route.path === '/' ? 'text-brand-900 font-bold bg-brand-100' : 'text-brand-600'"
        >
          Home
        </router-link>
        <router-link
          to="/catalog"
          @click="isMobileMenuOpen = false"
          class="block px-3 py-2 rounded hover:bg-brand-100"
          :class="route.path.startsWith('/catalog') ? 'text-brand-900 font-bold bg-brand-100' : 'text-brand-600'"
        >
          Katalog Pakaian
        </router-link>
        <router-link
          to="/lookbook"
          @click="isMobileMenuOpen = false"
          class="flex items-center justify-between px-3 py-2 rounded hover:bg-brand-100"
          :class="route.path === '/lookbook' ? 'text-brand-900 font-bold bg-brand-100' : 'text-brand-600'"
        >
          <span>Lookbook Editorial</span>
          <span class="text-[10px] bg-scripture-linen text-scripture-bronze px-2 py-0.5 rounded border border-scripture-sand">Vol. 01</span>
        </router-link>

        <div class="pt-3 border-t border-brand-200 space-y-2">
          <button
            @click="openWhatsApp(); isMobileMenuOpen = false"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-brand-800 bg-brand-100 border border-brand-300 rounded"
          >
            <MessageCircle class="w-4 h-4 text-emerald-600" />
            <span>Chat WhatsApp CS</span>
          </button>
        </div>
      </div>

    </div>
  </header>
</template>
