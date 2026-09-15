<script setup>
import { useCatalogStore } from '../../stores/catalogStore'
import { Instagram, MessageCircle, ArrowUpRight } from 'lucide-vue-next'

const catalogStore = useCatalogStore()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-[#f8f8f6] border-t border-brand-300 text-brand-600 font-sans mt-28 transition-colors">
    
    <!-- Top Scripture Accent Quote Banner -->
    <div class="border-b border-brand-300/80 py-8 bg-white text-center px-4">
      <p class="font-serif italic text-sm sm:text-base text-brand-800 max-w-2xl mx-auto tracking-wide">
        &ldquo;Sebab segala sesuatu adalah dari Dia, dan oleh Dia, dan kepada Dia: Bagi Dialah kemuliaan sampai selama-lamanya!&rdquo;
      </p>
      <span class="font-mono text-xs text-scripture-bronze uppercase tracking-widest mt-1 block">
        ROMA 11:36
      </span>
    </div>

    <!-- Main Footer Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
        
        <!-- Brand Manifesto Column -->
        <div class="md:col-span-5 space-y-4">
          <div class="flex items-center gap-2.5">
            <span class="text-scripture-gold font-serif text-xl">✦</span>
            <span class="font-serif font-bold text-2xl text-brand-900 tracking-wider">
              {{ catalogStore.storeSettings.brand_name || 'BIBLE TALKS' }}
            </span>
          </div>
          <p class="text-sm text-brand-600 leading-relaxed max-w-md font-normal">
            {{ catalogStore.storeSettings.about || 'Bible Talks adalah entitas pakaian bernuansa scripture yang menyatukan pesan firman, potongan modern boxy fitting, dan material katun 16s berkualitas tinggi untuk memuliakan nama-Nya.' }}
          </p>
          <div class="pt-2 font-mono text-xs text-brand-500">
            CRAFTED WITH INTENT: <span class="text-brand-800 font-medium">{{ catalogStore.storeSettings.address || 'KABUPATEN NGAWI, JAWA TIMUR - INDONESIA' }}</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="md:col-span-2 space-y-3">
          <h4 class="font-mono text-xs uppercase tracking-widest text-brand-900 font-semibold">
            Koleksi
          </h4>
          <ul class="space-y-2.5 text-sm">
            <li>
              <router-link to="/" class="hover:text-brand-900 transition-colors">Home</router-link>
            </li>
            <li>
              <router-link to="/catalog" class="hover:text-brand-900 transition-colors">Katalog Pakaian</router-link>
            </li>
            <li>
              <router-link to="/lookbook" class="hover:text-brand-900 transition-colors">Editorial Lookbook</router-link>
            </li>
            <li>
              <router-link to="/admin" class="hover:text-brand-900 transition-colors text-brand-400 hover:text-brand-700 text-xs font-mono">
                Staff Portal
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Specifications & Integrity -->
        <div class="md:col-span-2 space-y-3">
          <h4 class="font-mono text-xs uppercase tracking-widest text-brand-900 font-semibold">
            Integritas Kain
          </h4>
          <ul class="space-y-2 text-xs font-mono text-brand-600">
            <li>16s Heavyweight Cotton</li>
            <li>High-Density Plastisol</li>
            <li>Signature Boxy Silhouette</li>
            <li>Pre-Shrunk Treatment</li>
          </ul>
        </div>

        <!-- Social & Direct Channels -->
        <div class="md:col-span-3 space-y-4">
          <h4 class="font-mono text-xs uppercase tracking-widest text-brand-900 font-semibold">
            Pemesanan & Kontak
          </h4>
          <p class="text-xs text-brand-600">
            Pertanyaan stok pakaian, kolaborasi pelayanan, atau pemesanan langsung:
          </p>
          <div class="flex flex-col gap-2 font-mono">
            <a
              :href="`https://wa.me/${catalogStore.storeSettings.whatsapp_number || '6281234567890'}`"
              target="_blank"
              class="inline-flex items-center justify-between px-4 py-2.5 text-xs bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 rounded shadow-sm transition-colors"
            >
              <span class="flex items-center gap-2">
                <MessageCircle class="w-4 h-4 text-emerald-600" />
                WhatsApp Customer Service
              </span>
              <ArrowUpRight class="w-3.5 h-3.5 text-brand-400" />
            </a>

            <a
              v-if="catalogStore.storeSettings.instagram_url"
              :href="catalogStore.storeSettings.instagram_url"
              target="_blank"
              class="inline-flex items-center justify-between px-4 py-2.5 text-xs bg-white hover:bg-brand-100 text-brand-800 border border-brand-300 rounded shadow-sm transition-colors"
            >
              <span class="flex items-center gap-2">
                <Instagram class="w-4 h-4 text-pink-600" />
                Instagram @bibletalks
              </span>
              <ArrowUpRight class="w-3.5 h-3.5 text-brand-400" />
            </a>
          </div>
        </div>

      </div>

      <!-- Bottom Footnote & Copyright -->
      <div class="mt-16 pt-8 border-t border-brand-300 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-brand-500">
        <div>
          &copy; {{ currentYear }} BIBLE TALKS APPAREL CO. CLOTHED IN PURPOSE & TRUTH.
        </div>
        <div class="flex items-center gap-4">
          <span>WALK IN THE LIGHT</span>
          <span>•</span>
          <span>EST. 2026</span>
          <span>•</span>
          <span>KABUPATEN NGAWI, JAWA TIMUR</span>
        </div>
      </div>
    </div>
  </footer>
</template>
