<script setup>
import { useCatalogStore } from '../../stores/catalogStore'
import { Instagram, MessageCircle, ArrowUpRight } from 'lucide-vue-next'

const catalogStore = useCatalogStore()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-[#fdfcfa] border-t-2 border-brand-950 text-brand-950 font-sans mt-28 transition-colors select-none">
    
    <!-- Top Scripture Accent Quote Banner (Halftone Streetwear Manifesto) -->
    <div class="relative border-b-2 border-brand-950 py-10 bg-[#faf8f4] text-center px-4 overflow-hidden">
      <!-- Halftone pattern -->
      <div class="absolute inset-0 bg-halftone text-brand-950/[0.07] pointer-events-none"></div>

      <div class="relative z-10 max-w-3xl mx-auto space-y-2">
        <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-950 text-scripture-gold font-mono text-[10px] uppercase font-black tracking-widest border border-brand-950 mb-1">
          <span>✦ THE GREAT COMMISSION</span>
        </div>
        <p class="font-sans font-black text-base sm:text-xl md:text-2xl text-brand-950 uppercase tracking-tight leading-snug">
          &ldquo;Karena itu pergilah, jadikanlah semua bangsa murid-Ku dan baptislah mereka dalam nama Bapa dan Anak dan Roh Kudus... Dan ketahuilah, Aku menyertai kamu senantiasa sampai kepada akhir zaman.&rdquo;
        </p>
        <span class="font-mono text-xs text-brand-700 uppercase tracking-widest font-bold block pt-1">
          MATIUS 28:19-20 // BIBLE TALK FOUNDATION
        </span>
      </div>
    </div>

    <!-- Main Footer Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8">
        
        <!-- Brand Manifesto Column (Col 5) -->
        <div class="md:col-span-5 space-y-4">
          <div class="flex items-center gap-3">
            <img 
              src="/Bible Talk _Text.png" 
              alt="BIBLE TALK" 
              class="h-9 sm:h-10 w-auto object-contain mix-blend-multiply"
            />
          </div>
          <p class="text-xs sm:text-sm text-brand-800 leading-relaxed max-w-md font-sans font-medium">
            {{ catalogStore.storeSettings.about || 'Bible Talk adalah entitas pakaian bernuansa scripture yang menyatukan pesan firman, potongan modern boxy fitting, dan material katun 16s berkualitas tinggi untuk memuliakan nama-Nya.' }}
          </p>
          <div class="pt-2 font-mono text-xs text-brand-700 font-bold flex items-center gap-2">
            <span class="w-2 h-2 bg-scripture-gold border border-brand-950"></span>
            <span>ORIGIN: {{ catalogStore.storeSettings.address || 'KABUPATEN NGAWI, JAWA TIMUR - INDONESIA' }}</span>
          </div>
        </div>

        <!-- Navigation Links (Col 2) -->
        <div class="md:col-span-2 space-y-3">
          <h4 class="font-mono text-xs uppercase tracking-widest text-brand-950 font-black flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 bg-brand-950"></span>
            Koleksi
          </h4>
          <ul class="space-y-2 text-xs sm:text-sm font-mono uppercase font-semibold text-brand-800">
            <li>
              <router-link to="/" class="hover:text-scripture-bronze transition-colors">✦ Home</router-link>
            </li>
            <li>
              <router-link to="/catalog" class="hover:text-scripture-bronze transition-colors">✦ Katalog Pakaian</router-link>
            </li>
            <li>
              <router-link to="/lookbook" class="hover:text-scripture-bronze transition-colors">✦ Lookbook</router-link>
            </li>
          </ul>
        </div>

        <!-- Specifications & Integrity (Col 2) -->
        <div class="md:col-span-2 space-y-3">
          <h4 class="font-mono text-xs uppercase tracking-widest text-brand-950 font-black flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 bg-brand-950"></span>
            Integritas
          </h4>
          <ul class="space-y-1.5 text-[11px] sm:text-xs font-mono text-brand-700 font-bold uppercase">
            <li>[16s] Heavy Cotton</li>
            <li>[HD] Plastisol Ink</li>
            <li>[Boxy] Drop-Shoulder</li>
            <li>[Pre-Shrunk] Wash</li>
          </ul>
        </div>

        <!-- Social & Direct Channels (Col 3) -->
        <div class="md:col-span-3 space-y-3.5">
          <h4 class="font-mono text-xs uppercase tracking-widest text-brand-950 font-black flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 bg-brand-950"></span>
            Direct Order & Info
          </h4>
          <p class="text-xs text-brand-800 font-sans font-medium">
            Pertanyaan stok pakaian, kolaborasi pelayanan, atau pemesanan langsung:
          </p>
          <div class="flex flex-col gap-2 font-mono">
            <a
              :href="`https://wa.me/${catalogStore.activeWhatsAppCP?.whatsapp_number || catalogStore.storeSettings.whatsapp_number || '6281234567890'}`"
              target="_blank"
              class="inline-flex items-center justify-between px-3.5 py-2.5 text-xs bg-white hover:bg-brand-50 text-brand-950 zine-border zine-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 font-bold transition-all"
            >
              <span class="flex items-center gap-2">
                <MessageCircle class="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>{{ catalogStore.activeWhatsAppCP?.name || 'WhatsApp Admin' }}</span>
              </span>
              <ArrowUpRight class="w-3.5 h-3.5 text-brand-950" />
            </a>

            <a
              v-if="catalogStore.storeSettings.instagram_url"
              :href="catalogStore.storeSettings.instagram_url"
              target="_blank"
              class="inline-flex items-center justify-between px-3.5 py-2.5 text-xs bg-white hover:bg-brand-50 text-brand-950 zine-border zine-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 font-bold transition-all"
            >
              <span class="flex items-center gap-2">
                <Instagram class="w-4 h-4 text-pink-600" />
                <span>Instagram @bibletalk.merch</span>
              </span>
              <ArrowUpRight class="w-3.5 h-3.5 text-brand-950" />
            </a>
          </div>
        </div>

      </div>

      <!-- Bottom Footnote & Copyright (Industrial Spec Strip) -->
      <div class="mt-12 pt-6 border-t-2 border-brand-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-brand-700 font-bold uppercase">
        <div>
          &copy; {{ currentYear }} BIBLE TALK APPAREL CO. // MADE TO WEAR, MADE TO REMIND.
        </div>
        <div class="flex items-center gap-3">
          <span>WALK IN THE LIGHT</span>
          <span>✦</span>
          <span>EST. 2026</span>
          <span>✦</span>
          <span>NGAWI, INDONESIA</span>
        </div>
      </div>
    </div>
  </footer>
</template>
