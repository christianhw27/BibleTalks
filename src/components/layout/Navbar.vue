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
  const activeCP = catalogStore.activeWhatsAppCP
  const wa = activeCP?.whatsapp_number || catalogStore.storeSettings.whatsapp_number || '6281234567890'
  const text = encodeURIComponent(`Halo ${activeCP?.name || 'Bible Talk'}, saya ingin bertanya tentang katalog rilisan pakaian.`)
  window.open(`https://wa.me/${wa}?text=${text}`, '_blank')
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full bg-[#faf8f4]/95 backdrop-blur-md border-b-2 border-brand-950 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 sm:h-20">
        
        <!-- Left: Brand Logo & Navigation -->
        <div class="flex items-center gap-8 lg:gap-10">
          <router-link to="/" class="flex items-center gap-3 group py-1">
            <img 
              src="/Bible Talk _Text.png" 
              alt="BIBLE TALK" 
              class="h-8 sm:h-9 md:h-10 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
            />
          </router-link>

          <!-- Desktop Navigation Links (Streetwear Zine Tabs) -->
          <nav class="hidden md:flex items-center gap-3 text-xs font-mono uppercase tracking-wider">
            <router-link
              to="/"
              class="px-3 py-1 font-bold transition-all"
              :class="route.path === '/' ? 'bg-brand-950 text-scripture-gold zine-border zine-shadow-sm' : 'text-brand-950 hover:bg-brand-200/60'"
            >
              Home
            </router-link>
            <router-link
              to="/catalog"
              class="px-3 py-1 font-bold transition-all"
              :class="route.path.startsWith('/catalog') ? 'bg-brand-950 text-scripture-gold zine-border zine-shadow-sm' : 'text-brand-950 hover:bg-brand-200/60'"
            >
              Katalog
            </router-link>
            <router-link
              to="/lookbook"
              class="px-3 py-1 font-bold transition-all flex items-center gap-1.5"
              :class="route.path === '/lookbook' ? 'bg-brand-950 text-scripture-gold zine-border zine-shadow-sm' : 'text-brand-950 hover:bg-brand-200/60'"
            >
              <span>Lookbook</span>
              <span class="text-[9px] bg-scripture-gold text-brand-950 px-1 font-black border border-brand-950">VOL.01</span>
            </router-link>
          </nav>
        </div>

        <!-- Right: Actions (Search, WhatsApp, Mobile Toggle) -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Search toggle (Tactile Zine Button) -->
          <button
            @click="isSearchOpen = !isSearchOpen"
            class="p-2 sm:p-2.5 text-brand-950 bg-white zine-border zine-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            title="Cari Pakaian"
            aria-label="Cari Pakaian"
          >
            <Search class="w-4 h-4" />
          </button>

          <!-- WhatsApp Direct (Sticker Slap Style) -->
          <button
            @click="openWhatsApp"
            class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono uppercase font-black tracking-wider text-brand-950 bg-scripture-gold zine-border zine-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <MessageCircle class="w-4 h-4 text-brand-950 fill-brand-950" />
            <span>Chat Admin</span>
          </button>

          <!-- Mobile Hamburger Toggle -->
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 text-brand-950 bg-white zine-border zine-shadow-sm hover:bg-brand-100"
            aria-label="Toggle Menu"
          >
            <Menu v-if="!isMobileMenuOpen" class="w-5 h-5" />
            <X v-else class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Expandable Search Overlay (Zine Brutalist Style) -->
      <div
        v-if="isSearchOpen"
        class="py-3 border-t-2 border-brand-950 transition-all bg-[#faf8f4]"
      >
        <form @submit.prevent="handleSearchSubmit" class="relative flex items-center">
          <Search class="absolute left-3.5 w-4 h-4 text-brand-500" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Cari artikel pakaian, bahan katun 16s, atau tema firman..."
            class="w-full pl-10 pr-24 py-2 bg-white zine-border text-sm text-brand-950 placeholder-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-950 font-mono"
            autofocus
          />
          <button
            type="submit"
            class="absolute right-1.5 px-3 py-1 text-xs font-mono uppercase font-black bg-brand-950 text-white zine-btn-active hover:bg-brand-800 transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      <!-- Mobile Menu Drawer (Tactile Zine Dropdown) -->
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden py-4 border-t-2 border-brand-950 space-y-2 font-mono text-xs uppercase bg-[#faf8f4]"
      >
        <router-link
          to="/"
          @click="isMobileMenuOpen = false"
          class="block px-3 py-2.5 zine-border font-bold transition-all"
          :class="route.path === '/' ? 'bg-brand-950 text-scripture-gold zine-shadow-sm' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          ✦ Home
        </router-link>
        <router-link
          to="/catalog"
          @click="isMobileMenuOpen = false"
          class="block px-3 py-2.5 zine-border font-bold transition-all"
          :class="route.path.startsWith('/catalog') ? 'bg-brand-950 text-scripture-gold zine-shadow-sm' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          ✦ Katalog Pakaian
        </router-link>
        <router-link
          to="/lookbook"
          @click="isMobileMenuOpen = false"
          class="flex items-center justify-between px-3 py-2.5 zine-border font-bold transition-all"
          :class="route.path === '/lookbook' ? 'bg-brand-950 text-scripture-gold zine-shadow-sm' : 'bg-white text-brand-950 hover:bg-brand-100'"
        >
          <span>✦ Lookbook Editorial</span>
          <span class="text-[9px] bg-scripture-gold text-brand-950 px-1.5 py-0.5 border border-brand-950 font-black">VOL. 01</span>
        </router-link>

        <div class="pt-2">
          <button
            @click="openWhatsApp(); isMobileMenuOpen = false"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-brand-950 font-black uppercase tracking-wider bg-scripture-gold zine-border zine-shadow-sm"
          >
            <MessageCircle class="w-4 h-4 text-brand-950 fill-brand-950" />
            <span>Chat WhatsApp CS</span>
          </button>
        </div>
      </div>

    </div>
  </header>
</template>
