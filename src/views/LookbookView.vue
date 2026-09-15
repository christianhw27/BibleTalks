<script setup>
import { computed } from 'vue'
import { useCatalogStore } from '../stores/catalogStore'
import { ArrowRight, Camera, Sparkles } from 'lucide-vue-next'

const catalogStore = useCatalogStore()

const currentLookbook = computed(() => {
  return catalogStore.lookbooks?.[0] || {
    title: 'Drop 01 // Genesis & Concrete Youth',
    season: 'Season 2026 Editorial',
    description: 'Eksplorasi kontras antara narasi scripture dan lanskap perkotaan kontemporer di bawah terangnya cahaya mentari.',
    cover_image: '',
    gallery: [],
  }
})

// Normalisasi foto galeri: mendukung URL string murni maupun format object { url, caption }
const parsedGallery = computed(() => {
  const rawList = currentLookbook.value?.gallery || []
  if (!Array.isArray(rawList) || rawList.length === 0) {
    if (currentLookbook.value?.cover_image) {
      return [{ url: currentLookbook.value.cover_image, caption: '' }]
    }
    return []
  }

  return rawList
    .map((item) => {
      if (!item) return null
      if (typeof item === 'object' && item.url) {
        return { url: item.url, caption: (item.caption || '').trim() }
      }
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (parsed.url) {
              return { url: parsed.url, caption: (parsed.caption || '').trim() }
            }
          } catch (_) {}
        }
        return { url: trimmed, caption: '' }
      }
      return null
    })
    .filter((p) => p && p.url)
})

// Pola tata letak editorial asimetris dinamis untuk jumlah foto berapa pun
function getGridClasses(idx, total) {
  if (total === 1) {
    return 'md:col-span-12 h-[500px] sm:h-[620px]'
  }
  if (total === 2) {
    return 'md:col-span-6 h-[460px] sm:h-[560px]'
  }
  const pattern = idx % 4
  if (pattern === 0) return 'md:col-span-8 h-[480px] sm:h-[560px]'
  if (pattern === 1) return 'md:col-span-4 h-[480px] sm:h-[560px]'
  if (pattern === 2) return 'md:col-span-5 h-[440px] sm:h-[500px]'
  return 'md:col-span-7 h-[440px] sm:h-[500px]'
}
</script>

<template>
  <div class="space-y-20">
    
    <!-- LOOKBOOK COVER HERO (LIGHT & BRIGHT EDITORIAL) -->
    <section class="relative min-h-[72vh] flex items-end justify-start border-b border-brand-300 overflow-hidden bg-brand-100">
      <img
        :src="currentLookbook.cover_image"
        :alt="currentLookbook.title"
        class="absolute inset-0 w-full h-full object-cover object-center filter contrast-105"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#fcfcfb] via-[#fcfcfb]/60 to-transparent"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full space-y-4">
        <span class="inline-flex items-center gap-2 font-mono text-xs text-scripture-bronze bg-white border border-brand-300 px-3.5 py-1.5 rounded-full shadow-sm">
          <Camera class="w-3.5 h-3.5" />
          <span>{{ currentLookbook.season || 'EDITORIAL SEASON 2026' }}</span>
        </span>
        
        <h1 class="font-serif font-bold text-4xl sm:text-6xl md:text-7xl text-brand-950 uppercase tracking-tight max-w-3xl">
          {{ currentLookbook.title }}
        </h1>

        <p class="text-brand-600 text-sm sm:text-base max-w-xl leading-relaxed font-sans">
          {{ currentLookbook.description }}
        </p>

        <div class="pt-2 font-serif italic text-sm text-scripture-bronze">
          &ldquo;Kamu adalah terang dunia. Kota yang terletak di atas gunung tidak mungkin tersembunyi.&rdquo; — Matius 5:14
        </div>
      </div>
    </section>

    <!-- EDITORIAL GALLERY MASONRY -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div class="flex items-center justify-between border-b border-brand-300 pb-4">
        <h2 class="font-mono text-xs uppercase tracking-widest text-brand-500">
          EDITORIAL ARCHIVE // HIGH-KEY DOCUMENTARY ({{ parsedGallery.length }} FOTO)
        </h2>
        <span class="font-mono text-xs text-scripture-bronze font-semibold">
          BANDUNG HERITAGE
        </span>
      </div>

      <!-- Asymmetric Editorial Grid: Menampilkan SEMUA foto yang diunggah -->
      <div v-if="parsedGallery.length > 0" class="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        <div
          v-for="(photo, idx) in parsedGallery"
          :key="idx"
          class="group relative overflow-hidden bg-white border border-brand-300 rounded shadow-sm w-full"
          :class="getGridClasses(idx, parsedGallery.length)"
        >
          <img
            :src="photo.url"
            :alt="photo.caption || currentLookbook.title || 'Lookbook Frame'"
            loading="lazy"
            class="w-full h-full object-cover object-center filter contrast-105 hover:scale-105 transition-all duration-700"
          />
          <!-- Hanya tampilkan caption jika memang ditulis oleh admin saat upload -->
          <div
            v-if="photo.caption"
            class="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded font-mono text-[10px] sm:text-xs tracking-wider text-brand-900 border border-brand-300 shadow-sm"
          >
            {{ photo.caption }}
          </div>
        </div>
      </div>

      <!-- Empty State jika belum ada foto galeri -->
      <div v-else class="p-16 border border-dashed border-brand-300 rounded text-center font-mono text-xs text-brand-500">
        Belum ada foto galeri lookbook yang diunggah. Tambahkan melalui Dashboard Admin.
      </div>

      <!-- Bottom Call To Action to Catalog -->
      <div class="pt-16 pb-8 text-center space-y-4 border-t border-brand-300">
        <h3 class="font-serif font-bold text-2xl sm:text-3xl uppercase text-brand-950">
          Tertarik dengan Artikel di Lookbook Ini?
        </h3>
        <p class="text-sm text-brand-600 font-sans max-w-md mx-auto">
          Periksa seluruh ketersediaan ukuran dan pesan pakaian favorit Anda langsung dari katalog.
        </p>
        <router-link
          to="/catalog"
          class="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-semibold tracking-widest rounded shadow transition-colors"
        >
          <span>Eksplor Katalog Pakaian</span>
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>

    </section>

  </div>
</template>
