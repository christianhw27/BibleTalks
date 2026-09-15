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
    class="group cursor-pointer flex flex-col bg-white border border-brand-300 hover:border-scripture-gold/80 rounded overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
  >
    <!-- Image Box -->
    <div class="relative w-full aspect-[4/5] bg-brand-100 overflow-hidden">
      <!-- Main Product Image -->
      <img
        :src="primaryImage"
        :alt="product.title"
        loading="lazy"
        class="w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
        :class="{ 'group-hover:opacity-0': secondaryImage }"
      />

      <!-- Secondary Image on Hover (if available) -->
      <img
        v-if="secondaryImage"
        :src="secondaryImage"
        :alt="product.title + ' view 2'"
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-105"
      />

      <!-- Status Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10 font-mono text-[10px] tracking-wider uppercase">
        <span
          v-if="isSoldOut"
          class="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded font-semibold"
        >
          Sold Out
        </span>
        <span
          v-else-if="product.status === 'pre_order'"
          class="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-semibold"
        >
          Pre-Order
        </span>
        <span
          v-else-if="product.is_featured"
          class="px-2 py-0.5 bg-scripture-linen text-scripture-bronze border border-scripture-sand rounded font-bold flex items-center gap-1 shadow-sm"
        >
          <Sparkles class="w-3 h-3 text-scripture-gold" />
          Signature
        </span>
      </div>

      <!-- Quick Size Pills on Bottom of Image (Hover effect) -->
      <div
        v-if="product.variants && product.variants.length > 0"
        class="absolute bottom-2.5 inset-x-2.5 flex items-center justify-center gap-1.5 bg-white/95 backdrop-blur-sm py-1.5 px-2 border border-brand-300 rounded opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10 shadow-sm"
      >
        <span class="text-[9px] font-mono text-brand-500 uppercase mr-1">Sizes:</span>
        <span
          v-for="v in product.variants"
          :key="v.id"
          class="text-[10px] font-mono px-1.5 py-0.5 rounded font-medium"
          :class="v.stock > 0 ? 'bg-brand-100 text-brand-800 border border-brand-300' : 'text-brand-400 line-through'"
        >
          {{ v.size }}
        </span>
      </div>
    </div>

    <!-- Product Details -->
    <div class="p-4 flex flex-col flex-grow justify-between gap-2.5 bg-white">
      <div>
        <!-- Category & Tag -->
        <div class="flex items-center justify-between text-[11px] font-mono text-brand-500 uppercase tracking-wider mb-1">
          <span>{{ product.category?.name || 'Apparel' }}</span>
          <span v-if="product.tags?.[0]" class="text-scripture-bronze font-medium">#{{ product.tags[0] }}</span>
        </div>

        <!-- Title -->
        <h3 class="font-serif font-semibold text-sm sm:text-base text-brand-900 group-hover:text-scripture-bronze line-clamp-2 sm:line-clamp-3 leading-snug transition-colors min-h-[2.5rem] sm:min-h-[2.75rem]">
          {{ product.title }}
        </h3>
      </div>

      <!-- Price & Stock Status -->
      <div class="flex items-center justify-between pt-1 border-t border-brand-200/80 font-mono">
        <span class="text-sm sm:text-base font-semibold text-brand-900">
          {{ catalogStore.formatPrice(product.price) }}
        </span>
        <span
          class="text-[10px] font-mono tracking-wider uppercase font-semibold"
          :class="isSoldOut ? 'text-rose-600' : 'text-emerald-700'"
        >
          {{ isSoldOut ? 'HABIS' : 'READY' }}
        </span>
      </div>
    </div>
  </div>
</template>
