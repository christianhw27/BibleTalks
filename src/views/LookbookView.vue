<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalogStore'
import {
  X,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  ShoppingBag,
  Maximize2,
  Check,
  Camera,
} from 'lucide-vue-next'

const router = useRouter()
const catalogStore = useCatalogStore()

const currentLookbook = computed(() => {
  return catalogStore.lookbooks?.[0] || {
    title: 'Drop 01 // Genesis & Concrete Youth',
    season: 'Vol.01 // Season 2026 Archive',
    description: 'Eksplorasi kontras antara narasi scripture dan lanskap urban perkotaan kontemporer.',
    gallery: [],
  }
})

// Normalisasi foto galeri murni dari database (tanpa dummy fallback)
const allFrames = computed(() => {
  const rawList = currentLookbook.value?.gallery || []
  const validDbFrames = []

  if (Array.isArray(rawList) && rawList.length > 0) {
    rawList.forEach((item, idx) => {
      if (!item) return
      let url = ''
      let title = ''
      let caption = ''
      let verse = 'MATTHEW 5:14'
      let spec = '16s COMBED COTTON 235+ GSM'
      let fit = 'Boxy Drop-Shoulder Silhouette'
      let lookCode = `LOOK 0${idx + 1}`

      if (typeof item === 'object' && item !== null) {
        url = item.url || ''
        title = item.title || item.caption || `Editorial Look 0${idx + 1}`
        caption = item.caption || ''
        verse = item.verse || 'MATTHEW 5:14'
        spec = item.spec || '16s COMBED COTTON 235+ GSM'
        fit = item.fit || 'Boxy Drop-Shoulder Silhouette'
        lookCode = item.lookCode || `LOOK 0${idx + 1}`
      } else if (typeof item === 'string') {
        const trimmed = item.trim()
        if (trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (parsed.url) {
              url = parsed.url
              title = parsed.title || parsed.caption || `Editorial Look 0${idx + 1}`
              caption = parsed.caption || ''
              verse = parsed.verse || 'MATTHEW 5:14'
              spec = parsed.spec || '16s COMBED COTTON 235+ GSM'
              fit = parsed.fit || 'Boxy Drop-Shoulder Silhouette'
              lookCode = parsed.lookCode || `LOOK 0${idx + 1}`
            }
          } catch (_) {}
        }
        if (!url) {
          url = trimmed
          title = `Editorial Look 0${idx + 1}`
          caption = 'Dokumentasi arsip rilisan Bible Talk.'
        }
      }

      if (url) {
        const catList = ['tees', 'outerwear', 'accessories']
        const assignedCat = catList[idx % 3]
        const catLabels = {
          tees: 'BOXY TEE',
          outerwear: 'OUTERWEAR',
          accessories: 'AKSESORI // GEAR',
        }
        validDbFrames.push({
          id: `db-frame-${idx}`,
          url,
          title: title || `Editorial Look 0${idx + 1}`,
          caption: caption || title || 'Dokumentasi arsip rilisan Bible Talk.',
          lookCode: lookCode || `LOOK 0${idx + 1}`,
          category: assignedCat,
          categoryLabel: catLabels[assignedCat],
          spec: spec || '16s COMBED COTTON 235+ GSM',
          verse: verse || 'MATTHEW 5:14',
          fit: fit || 'Boxy Drop-Shoulder Silhouette',
          frameNum: `▲ 0${idx + 1}A`,
        })
      }
    })
  }

  return validDbFrames
})

// Lightbox Modal
const activeLightboxIndex = ref(null)
const isLightboxOpen = computed(() => activeLightboxIndex.value !== null)
const activeFrame = computed(() => {
  if (activeLightboxIndex.value === null) return null
  return allFrames.value[activeLightboxIndex.value] || null
})

function openLightbox(index) {
  activeLightboxIndex.value = index
}

function closeLightbox() {
  activeLightboxIndex.value = null
}

function nextLightbox() {
  if (activeLightboxIndex.value === null) return
  activeLightboxIndex.value = (activeLightboxIndex.value + 1) % allFrames.value.length
}

function prevLightbox() {
  if (activeLightboxIndex.value === null) return
  activeLightboxIndex.value = (activeLightboxIndex.value - 1 + allFrames.value.length) % allFrames.value.length
}

function handleKeyDown(e) {
  if (!isLightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextLightbox()
  if (e.key === 'ArrowLeft') prevLightbox()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function inquiryLookWhatsApp(frame, index) {
  const activeCP = catalogStore.activeWhatsAppCP
  const wa = activeCP?.whatsapp_number || catalogStore.storeSettings.whatsapp_number || '6281234567890'
  const text = encodeURIComponent(
    `Halo ${activeCP?.name || 'Bible Talk'}, saya tertarik dengan artikel di Lookbook ${frame.lookCode || 'Look ' + (index + 1)}: "${frame.title}". Apakah masih ready stock di katalog?`
  )
  window.open(`https://wa.me/${wa}?text=${text}`, '_blank')
}

// Asymmetric Abstract Puzzle Spans & Dynamic Heights
function getPuzzleClasses(idx) {
  const mod = idx % 6
  if (mod === 0) {
    // Big Hero Frame (Full width on mobile, 8 cols on desktop)
    return 'col-span-2 md:col-span-8 min-h-[300px] sm:min-h-[440px] md:min-h-[520px]'
  }
  if (mod === 1) {
    // Tall Portrait Sidekick (1 col on mobile, 4 cols on desktop)
    return 'col-span-1 md:col-span-4 min-h-[260px] sm:min-h-[440px] md:min-h-[520px]'
  }
  if (mod === 2) {
    // Medium Left (1 col on mobile, 5 cols on desktop)
    return 'col-span-1 md:col-span-5 min-h-[260px] sm:min-h-[380px] md:min-h-[440px]'
  }
  if (mod === 3) {
    // Wide Offset Right (Full width on mobile, 7 cols on desktop)
    return 'col-span-2 md:col-span-7 min-h-[280px] sm:min-h-[380px] md:min-h-[440px]'
  }
  if (mod === 4) {
    // Half Width Left (1 col on mobile, 6 cols on desktop)
    return 'col-span-1 md:col-span-6 min-h-[250px] sm:min-h-[360px] md:min-h-[420px]'
  }
  // mod === 5: Half Width Right (1 col on mobile, 6 cols on desktop)
  return 'col-span-1 md:col-span-6 min-h-[250px] sm:min-h-[360px] md:min-h-[420px]'
}
</script>

<template>
  <div class="relative bg-[#faf8f4] min-h-screen overflow-hidden text-brand-950">
    
    <!-- Ambient Halftone Dot Background -->
    <div class="absolute inset-0 bg-halftone text-brand-950/[0.07] pointer-events-none z-0"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      <!-- CLEAN & MATCHED EDITORIAL HEADER -->
      <div class="space-y-4 pb-6 border-b-2 border-brand-950">
        <!-- Top Editorial Meta -->
        <div class="flex items-center justify-between flex-wrap gap-2 font-mono text-xs text-brand-950">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 bg-scripture-gold border border-brand-950 inline-block"></span>
            <span class="font-bold uppercase tracking-widest text-[11px] sm:text-xs">
              VOL.01 // EDITORIAL ARCHIVE / MATTHEW 5:14
            </span>
          </div>
          <div class="hidden sm:flex items-center gap-3 text-[11px] text-brand-600 font-bold">
            <span>35MM KODAK TRI-X</span>
            <span>•</span>
            <span class="text-brand-950 font-black">
              {{ allFrames.length < 10 ? '0' + allFrames.length : allFrames.length }} EDITORIAL LOOKS
            </span>
          </div>
        </div>

        <!-- Main Title & Narrative with Side Zine Scripture Box -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Left: Title, Narrative & Accent Tags -->
          <div class="lg:col-span-8 space-y-3">
            <h1 class="font-sans font-black text-4xl sm:text-6xl uppercase tracking-tight text-brand-950 leading-none flex items-center flex-wrap gap-3">
              <span>LOOKBOOK</span>
              <span class="inline-block bg-brand-950 text-scripture-gold border-2 border-brand-950 px-3.5 py-0.5 shadow-[3px_3px_0px_#153227] text-3xl sm:text-5xl font-black">
                2026.
              </span>
            </h1>

            <p class="text-sm sm:text-base text-brand-800 font-sans leading-relaxed max-w-2xl">
              Dokumentasi editorial seluruh rilisan pakaian, outerwear, dan aksesori bernuansa firman. Menghadirkan keseimbangan antara pesan kebenaran abadi dan estetika streetwear kontemporer di lanskap perkotaan.
            </p>
          </div>

          <!-- Right: Compact Scripture & Catalog Card -->
          <div class="lg:col-span-4 flex flex-col justify-between gap-3 p-4 bg-white border-2 border-brand-950 shadow-[3px_3px_0px_#153227]">
            <div class="space-y-1 font-mono">
              <div class="flex items-center justify-between text-[10px] text-brand-500 uppercase font-bold pb-1 border-b border-brand-200">
                <span>MATTHEW 5:14</span>
                <span class="text-brand-950">VOL.01 // 2026</span>
              </div>
              <p class="text-xs text-brand-900 font-serif italic leading-snug pt-1">
                "Kamu adalah terang dunia. Kota yang terletak di atas gunung tidak mungkin tersembunyi."
              </p>
            </div>

            <router-link
              to="/catalog"
              class="w-full py-2.5 px-4 bg-brand-950 hover:bg-brand-900 text-scripture-gold font-mono text-xs uppercase font-black tracking-wider border-2 border-brand-950 shadow-[2px_2px_0px_#153227] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <ShoppingBag class="w-3.5 h-3.5" />
                <span>Lihat Katalog</span>
              </div>
              <ArrowRight class="w-3.5 h-3.5" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- ABSTRACT PUZZLE EDITORIAL GALLERY (Asymmetric Scrapbook Spreads) -->
      <div v-if="allFrames.length === 0" class="p-16 text-center bg-white border-2 border-dashed border-brand-950/40 font-mono text-xs text-brand-600 space-y-2">
        <Camera class="w-8 h-8 stroke-[1.5] mx-auto text-brand-950 opacity-40 mb-2" />
        <p class="font-bold text-sm text-brand-950 uppercase tracking-wider">Belum Ada Frame Foto Editorial</p>
        <p class="text-[11px] text-brand-500 max-w-md mx-auto leading-relaxed">
          Galeri foto lookbook saat ini masih kosong. Admin dapat menambahkan foto editorial melalui menu CMS Editorial Lookbook.
        </p>
      </div>
      <div v-else class="grid grid-cols-2 md:grid-cols-12 gap-3.5 sm:gap-6 md:gap-8 items-stretch">
        <div
          v-for="(frame, idx) in allFrames"
          :key="frame.id"
          class="group relative flex flex-col bg-[#fdfcfa] zine-border zine-shadow zine-shadow-hover overflow-hidden cursor-pointer select-none transition-all duration-200"
          :class="getPuzzleClasses(idx)"
          @click="openLightbox(idx)"
        >
          <!-- Masking Tape on select cards -->
          <div
            v-if="idx % 2 === 0"
            class="tape-strip hidden sm:block -top-2.5 right-8"
          ></div>

          <!-- Photo Container filling full height -->
          <div class="relative w-full h-full bg-brand-900/10 overflow-hidden">
            <!-- Halftone Dot Overlay on Hover -->
            <div class="absolute inset-0 halftone-screen opacity-0 group-hover:opacity-40 transition-opacity duration-300 z-10 pointer-events-none"></div>

            <img
              :src="frame.url"
              :alt="frame.title"
              loading="lazy"
              class="w-full h-full object-cover object-center filter contrast-105 group-hover:scale-105 transition-transform duration-700 ease-out"
            />

            <!-- Top Left: Look Tag -->
            <div class="absolute top-2.5 left-2.5 z-20 flex items-center gap-1">
              <span class="px-2 py-0.5 bg-brand-950 text-scripture-gold font-mono text-[9px] sm:text-[10px] uppercase font-black tracking-widest border border-brand-950 shadow-[2px_2px_0px_#153227]">
                {{ frame.lookCode }}
              </span>
            </div>

            <!-- Choppy Corner Cut Accent on Top Right -->
            <div class="absolute top-0 right-0 w-6 h-6 bg-brand-950 [clip-path:polygon(100%_0,0_0,100%_100%)] z-10 opacity-90 group-hover:opacity-100 transition-opacity"></div>

            <!-- Bottom Floating Caption (Streetwear Zine Tape Tag) -->
            <div class="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 zine-border shadow-[2px_2px_0px_#153227] flex flex-col font-mono z-20 gap-1">
              <div class="flex items-center justify-between gap-2 border-b border-brand-100 pb-1">
                <span class="text-[8px] sm:text-[9px] text-brand-600 uppercase tracking-widest font-bold truncate">
                  {{ frame.spec }}
                </span>
                <span class="shrink-0 text-[8px] sm:text-[9px] text-brand-950 font-black uppercase border border-brand-950/30 px-1 py-0.2 bg-brand-100">
                  {{ frame.verse }}
                </span>
              </div>

              <div class="flex items-center justify-between gap-2 pt-0.5">
                <h3 class="font-sans font-black text-xs sm:text-sm text-brand-950 group-hover:text-scripture-bronze truncate transition-colors leading-tight">
                  {{ frame.title }}
                </h3>
                <span class="text-[9px] text-brand-500 font-bold uppercase shrink-0 flex items-center gap-0.5 group-hover:text-brand-950 transition-colors">
                  <span>Lihat</span>
                  <ArrowRight class="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CLEAN BOTTOM CTA -->
      <div class="border-t-2 border-brand-950 pt-8 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="space-y-0.5 text-center sm:text-left font-mono">
          <div class="text-xs font-black uppercase tracking-wider text-brand-950">
            Tertarik dengan artikel di lookbook ini?
          </div>
          <div class="text-[11px] text-brand-600">
            Seluruh koleksi tersedia dengan stok terbatas di katalog resmi.
          </div>
        </div>

        <router-link
          to="/catalog"
          class="px-6 py-2.5 bg-brand-950 text-scripture-gold font-mono text-xs font-black uppercase zine-border zine-shadow-sm hover:bg-brand-900 transition-all inline-flex items-center gap-2"
        >
          <span>Eksplor Katalog Pakaian</span>
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>

    </div>

    <!-- CLEAN INTERACTIVE LIGHTBOX MODAL -->
    <div
      v-if="isLightboxOpen && activeFrame"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs select-none"
      @click.self="closeLightbox"
    >
      <div class="relative w-full max-w-4xl bg-[#faf8f4] zine-border shadow-[6px_6px_0px_#0c1c16] overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header Bar -->
        <div class="flex items-center justify-between px-4 py-2.5 bg-brand-950 text-scripture-gold border-b-2 border-brand-950 font-mono text-xs font-bold uppercase">
          <div class="flex items-center gap-2">
            <span class="px-1.5 py-0.5 bg-scripture-gold text-brand-950 font-black text-[10px]">
              {{ activeFrame.lookCode }}
            </span>
            <span>FRAME {{ (activeLightboxIndex + 1).toString().padStart(2, '0') }} / {{ allFrames.length.toString().padStart(2, '0') }}</span>
          </div>

          <button
            @click="closeLightbox"
            class="p-1 bg-white text-brand-950 hover:bg-rose-500 hover:text-white transition-colors border border-brand-950"
            title="Tutup (Esc)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
          <!-- Image -->
          <div class="md:col-span-7 bg-brand-950 flex items-center justify-center relative min-h-[260px] sm:min-h-[420px] p-3">
            <img
              :src="activeFrame.url"
              :alt="activeFrame.title"
              class="max-w-full max-h-[60vh] object-contain border border-white/20"
            />
            
            <button
              @click="prevLightbox"
              class="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-[#faf8f4] text-brand-950 zine-border shadow-[2px_2px_0px_#000] hover:bg-scripture-gold transition-colors"
            >
              <ArrowLeft class="w-4 h-4" />
            </button>

            <button
              @click="nextLightbox"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#faf8f4] text-brand-950 zine-border shadow-[2px_2px_0px_#000] hover:bg-scripture-gold transition-colors"
            >
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>

          <!-- Info -->
          <div class="md:col-span-5 p-5 flex flex-col justify-between gap-5 bg-[#faf8f4] border-t-2 md:border-t-0 md:border-l-2 border-brand-950 font-mono">
            <div class="space-y-3">
              <div class="flex items-center justify-between text-[10px] text-brand-600 uppercase">
                <span class="font-bold text-brand-950">EDITORIAL SPEC</span>
                <span class="px-1.5 py-0.5 bg-brand-200 text-brand-900 font-bold">{{ activeFrame.verse }}</span>
              </div>

              <h2 class="font-sans font-black text-xl uppercase tracking-tight text-brand-950 leading-tight">
                {{ activeFrame.title }}
              </h2>

              <p v-if="activeFrame.caption && activeFrame.caption !== activeFrame.title" class="text-xs text-brand-800 font-sans leading-relaxed">
                {{ activeFrame.caption }}
              </p>

              <div class="p-2.5 bg-white zine-border space-y-1.5 text-[11px] text-brand-900">
                <div class="flex items-center gap-2">
                  <Check class="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span class="font-bold">{{ activeFrame.spec }}</span>
                </div>
                <div v-if="activeFrame.fit" class="flex items-center gap-2">
                  <Check class="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{{ activeFrame.fit }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t-2 border-brand-950 text-xs">
              <router-link
                to="/catalog"
                @click="closeLightbox"
                class="w-full py-2.5 bg-brand-950 text-scripture-gold font-black uppercase zine-border zine-shadow-sm hover:bg-brand-900 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag class="w-4 h-4" />
                <span>Lihat di Katalog</span>
              </router-link>

              <button
                @click="inquiryLookWhatsApp(activeFrame, activeLightboxIndex)"
                class="w-full py-2 bg-scripture-gold text-brand-950 font-bold uppercase zine-border zine-shadow-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle class="w-4 h-4" />
                <span>Tanya via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- BOTTOM RUNNING MARQUEE TICKER TAPE -->
    <div class="border-t-2 border-brand-950 bg-brand-950 text-scripture-gold py-2 overflow-hidden select-none font-mono text-xs uppercase tracking-widest font-black">
      <div class="animate-marquee flex items-center gap-8">
        <span class="flex items-center gap-3">
          <span>✦ BIBLE TALK EDITORIAL</span>
          <span class="text-white">/</span>
          <span>VOL.01 ARCHIVE</span>
          <span class="text-white">/</span>
          <span class="text-white">MADE TO WEAR, MADE TO REMIND</span>
          <span class="text-white">/</span>
          <span>16s HEAVYWEIGHT COTTON 235+ GSM</span>
          <span class="text-white">/</span>
          <span>MATTHEW 5:14</span>
        </span>
        <span class="flex items-center gap-3">
          <span>✦ BIBLE TALK EDITORIAL</span>
          <span class="text-white">/</span>
          <span>VOL.01 ARCHIVE</span>
          <span class="text-white">/</span>
          <span class="text-white">MADE TO WEAR, MADE TO REMIND</span>
        </span>
      </div>
    </div>

  </div>
</template>
