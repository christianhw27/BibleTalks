<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../../stores/catalogStore'
import { Sparkles } from 'lucide-vue-next'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const catalogStore = useCatalogStore()

const primaryImage = computed(() => {
  if (props.product.images && props.product.images.length > 0) {
    return props.product.images[0]
  }
  return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
})

const secondaryImage = computed(() => {
  if (props.product.images && props.product.images.length > 1) {
    return props.product.images[1]
  }
  return null
})

const totalStock = computed(() => {
  if (!props.product.variants || props.product.variants.length === 0) return 0
  return props.product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
})

const isSoldOut = computed(() => {
  return props.product.status === 'sold_out' || (props.product.variants?.length > 0 && totalStock.value === 0)
})

function goToDetail() {
  router.push(`/product/${props.product.slug}`)
}
</script>

<template>
  <div
    @click="goToDetail"
    class="group cursor-pointer flex flex-col bg-[#fdfcfa] zine-border zine-shadow-sm sm:zine-shadow zine-shadow-hover relative overflow-hidden transition-all duration-200 select-none"
  >
    <!-- Physical Masking Tape on Card Header -->
    <div class="tape-strip -top-2.5 right-6 rotate-2 hidden sm:block"></div>

    <!-- Image Box with Halftone Hover & Choppy Corner Accent -->
    <div class="relative w-full aspect-[4/5] bg-brand-100/70 overflow-hidden border-b-2 border-brand-950">
      
      <!-- Halftone Dot Screenprint Overlay (Activates on Hover) -->
      <div class="absolute inset-0 halftone-screen opacity-0 group-hover:opacity-40 transition-opacity duration-300 z-10 pointer-events-none"></div>

      <!-- Main Product Image -->
      <img
        :src="primaryImage"
        :alt="product.title"
        loading="lazy"
        class="w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-105"
        :class="{ 'group-hover:opacity-0': secondaryImage }"
      />

      <!-- Secondary Image on Hover (if available) -->
      <img
        v-if="secondaryImage"
        :src="secondaryImage"
        :alt="product.title + ' view 2'"
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out group-hover:scale-105"
      />

      <!-- Status Badges (Sticker Slap Style with Tilt & Sharp Borders) -->
      <div class="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5 z-20">
        <span
          v-if="isSoldOut"
          class="inline-flex items-center px-2 py-0.5 bg-rose-600 text-white font-mono text-[9px] sm:text-[10px] uppercase font-black tracking-wider border-2 border-brand-950 shadow-[2px_2px_0px_#153227] -rotate-2"
        >
          ✕ Sold Out
        </span>
        <span
          v-else-if="product.status === 'pre_order'"
          class="inline-flex items-center px-2 py-0.5 bg-amber-400 text-brand-950 font-mono text-[9px] sm:text-[10px] uppercase font-black tracking-wider border-2 border-brand-950 shadow-[2px_2px_0px_#153227] rotate-2"
        >
          ⏳ Pre-Order
        </span>
        <span
          v-else-if="product.is_featured"
          class="inline-flex items-center gap-1 px-2 py-0.5 bg-scripture-gold text-brand-950 font-mono text-[9px] sm:text-[10px] uppercase font-black tracking-wider border-2 border-brand-950 shadow-[2px_2px_0px_#153227] -rotate-2"
        >
          <Sparkles class="w-3 h-3 text-brand-950 fill-brand-950" />
          <span>Signature</span>
        </span>
      </div>

      <!-- Quick Size Pills on Bottom of Image (Tactile Stamped Box) -->
      <div
        v-if="product.variants && product.variants.length > 0"
        class="absolute bottom-2 inset-x-2 flex items-center justify-center gap-1 bg-[#fcfbf9]/95 border-2 border-brand-950 py-1 px-2 shadow-[2px_2px_0px_#153227] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-20"
      >
        <span class="text-[8px] sm:text-[9px] font-mono text-brand-700 font-bold uppercase mr-1">SZ:</span>
        <span
          v-for="v in product.variants"
          :key="v.id"
          class="text-[9px] sm:text-[10px] font-mono px-1 py-0.2 font-bold"
          :class="v.stock > 0 ? 'text-brand-950 bg-white border border-brand-950/40' : 'text-brand-400 line-through opacity-60'"
        >
          {{ v.size }}
        </span>
      </div>

      <!-- Choppy Corner Tag (Top Right) -->
      <div class="absolute top-0 right-0 w-6 h-6 bg-brand-950 [clip-path:polygon(100%_0,0_0,100%_100%)] z-10 opacity-90 group-hover:opacity-100 transition-opacity"></div>
    </div>

    <!-- Product Details (Zine Spec Layout) -->
    <div class="p-3 sm:p-4 flex flex-col flex-grow justify-between gap-2.5 bg-[#fdfcfa]">
      <div>
        <!-- Category & Drop Spec -->
        <div class="flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-brand-700 uppercase tracking-wider mb-1">
          <span class="font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-brand-950 inline-block"></span>
            {{ product.category?.name || 'Apparel' }}
          </span>
          <span v-if="product.tags?.[0]" class="text-scripture-bronze font-bold">#{{ product.tags[0] }}</span>
        </div>

        <!-- Title -->
        <h3 class="font-sans font-bold text-xs sm:text-sm md:text-[15px] text-brand-950 group-hover:text-scripture-bronze line-clamp-2 leading-snug transition-colors min-h-[2.25rem] sm:min-h-[2.5rem]">
          {{ product.title }}
        </h3>
      </div>

      <!-- Price, Stock Status & Faux Barcode Detail -->
      <div class="pt-2 border-t-2 border-brand-950/15 flex items-end justify-between font-mono">
        <div>
          <span class="text-[9px] text-brand-600 uppercase tracking-widest block font-semibold leading-none mb-0.5">PRICE</span>
          <span class="text-xs sm:text-sm md:text-base font-extrabold text-brand-950 tracking-tight">
            {{ catalogStore.formatPrice(product.price) }}
          </span>
        </div>

        <div class="flex flex-col items-end gap-0.5">
          <span
            class="text-[9px] sm:text-[10px] font-mono tracking-wider uppercase font-black px-1.5 py-0.5 border border-brand-950"
            :class="isSoldOut ? 'bg-rose-100 text-rose-800' : 'bg-brand-100 text-brand-900'"
          >
            {{ isSoldOut ? 'HABIS' : 'READY' }}
          </span>
          <!-- Faux Barcode Lines for Streetwear Drop Aesthetic -->
          <div class="hidden sm:flex items-center gap-[1px] h-2.5 opacity-40 group-hover:opacity-75 transition-opacity" title="BT-SPEC">
            <span class="w-[2px] h-full bg-brand-950"></span>
            <span class="w-[1px] h-full bg-brand-950"></span>
            <span class="w-[3px] h-full bg-brand-950"></span>
            <span class="w-[1px] h-full bg-brand-950"></span>
            <span class="w-[2px] h-full bg-brand-950"></span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

