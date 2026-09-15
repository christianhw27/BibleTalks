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
    cover_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1200&q=80',
    ],
  }
})
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
          EDITORIAL ARCHIVE // HIGH-KEY DOCUMENTARY
        </h2>
        <span class="font-mono text-xs text-scripture-bronze font-semibold">
          BANDUNG HERITAGE
        </span>
      </div>

      <!-- Asymmetric Editorial Grid -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        <!-- Large Frame 1 -->
        <div class="md:col-span-8 group relative overflow-hidden bg-white border border-brand-300 rounded shadow-sm">
          <img
            :src="currentLookbook.gallery?.[0] || currentLookbook.cover_image"
            alt="Lookbook 1"
            class="w-full h-[540px] object-cover object-center filter contrast-105 hover:scale-105 transition-all duration-700"
          />
          <div class="absolute bottom-4 left-4 bg-white/95 px-3 py-1.5 rounded font-mono text-[10px] tracking-wider text-brand-800 border border-brand-300 shadow-sm">
            FRAME 01 // OVERSIZED BOXY TEE
          </div>
        </div>

        <!-- Medium Frame 2 -->
        <div class="md:col-span-4 group relative overflow-hidden bg-white border border-brand-300 rounded shadow-sm">
          <img
            :src="currentLookbook.gallery?.[1] || currentLookbook.cover_image"
            alt="Lookbook 2"
            class="w-full h-[540px] object-cover object-center filter contrast-105 hover:scale-105 transition-all duration-700"
          />
          <div class="absolute bottom-4 left-4 bg-white/95 px-3 py-1.5 rounded font-mono text-[10px] tracking-wider text-brand-800 border border-brand-300 shadow-sm">
            FRAME 02 // ACID WASH TREATMENT
          </div>
        </div>

        <!-- Medium Frame 3 -->
        <div class="md:col-span-5 group relative overflow-hidden bg-white border border-brand-300 rounded shadow-sm">
          <img
            :src="currentLookbook.gallery?.[2] || currentLookbook.cover_image"
            alt="Lookbook 3"
            class="w-full h-[460px] object-cover object-center filter contrast-105 hover:scale-105 transition-all duration-700"
          />
          <div class="absolute bottom-4 left-4 bg-white/95 px-3 py-1.5 rounded font-mono text-[10px] tracking-wider text-brand-800 border border-brand-300 shadow-sm">
            FRAME 03 // HEAVY FLEECE HOODIE
          </div>
        </div>

        <!-- Large Frame 4 -->
        <div class="md:col-span-7 group relative overflow-hidden bg-white border border-brand-300 rounded shadow-sm">
          <img
            :src="currentLookbook.gallery?.[3] || currentLookbook.cover_image"
            alt="Lookbook 4"
            class="w-full h-[460px] object-cover object-center filter contrast-105 hover:scale-105 transition-all duration-700"
          />
          <div class="absolute bottom-4 left-4 bg-white/95 px-3 py-1.5 rounded font-mono text-[10px] tracking-wider text-brand-800 border border-brand-300 shadow-sm">
            FRAME 04 // TACTICAL RIPSTOP CARGO
          </div>
        </div>

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
