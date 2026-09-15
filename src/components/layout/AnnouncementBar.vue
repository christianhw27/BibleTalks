<script setup>
import { useCatalogStore } from '../../stores/catalogStore'
const catalogStore = useCatalogStore()
</script>

<template>
  <div class="bg-scripture-linen text-brand-700 text-xs font-mono tracking-widest py-2.5 overflow-hidden border-b border-scripture-sand/80">
    <div class="flex items-center whitespace-nowrap animate-marquee">
      <span class="mx-6 font-semibold uppercase text-scripture-bronze">
        COLOSSIANS 3:12 — CLOTHE YOURSELVES WITH COMPASSION, KINDNESS & HUMILITY
      </span>
      <span class="mx-3 text-scripture-gold font-bold">✦</span>
      <span class="mx-6 font-semibold uppercase">
        {{ catalogStore.storeSettings.announcement_bar || 'DROP 01 AVAILABLE • FREE SHIPPING NATIONWIDE' }}
      </span>
      <span class="mx-3 text-scripture-gold font-bold">✦</span>
      <span class="mx-6 font-semibold uppercase text-scripture-bronze">
        MATTHEW 5:14 — YOU ARE THE LIGHT OF THE WORLD
      </span>
      <span class="mx-3 text-scripture-gold font-bold">✦</span>
      <span class="mx-6 font-semibold uppercase">
        HEAVYWEIGHT 16S ORGANIC COTTON • SIGNATURE BOXY SILHOUETTE
      </span>
      <span class="mx-3 text-scripture-gold font-bold">✦</span>
      <span class="mx-6 font-semibold uppercase text-scripture-bronze">
        WALK IN PURPOSE & GRACE
      </span>
    </div>
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}
.animate-marquee {
  display: inline-flex;
  animation: marquee 28s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}
</style>
