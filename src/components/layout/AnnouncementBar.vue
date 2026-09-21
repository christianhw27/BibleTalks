<script setup>
import { useCatalogStore } from '../../stores/catalogStore'
const catalogStore = useCatalogStore()
</script>

<template>
  <div class="bg-brand-950 text-scripture-gold text-[11px] sm:text-xs font-mono tracking-widest py-2.5 overflow-hidden border-b-2 border-brand-950 select-none">
    <div class="flex items-center whitespace-nowrap animate-marquee">
      <span class="mx-4 font-bold uppercase text-white">
        COLOSSIANS 3:12 — CLOTHED IN PURPOSE & LIGHT
      </span>
      <span class="mx-3 text-scripture-gold font-black">✦</span>
      <span class="mx-4 font-bold uppercase text-scripture-gold">
        {{ catalogStore.storeSettings.announcement_bar || 'DROP 01 AVAILABLE • FREE SHIPPING NATIONWIDE' }}
      </span>
      <span class="mx-3 text-white font-black">/</span>
      <span class="mx-4 font-bold uppercase text-white">
        MATTHEW 5:14 — YOU ARE THE LIGHT OF THE WORLD
      </span>
      <span class="mx-3 text-scripture-gold font-black">✦</span>
      <span class="mx-4 font-bold uppercase text-scripture-gold">
        HEAVYWEIGHT 16S ORGANIC COTTON • SIGNATURE BOXY SILHOUETTE
      </span>
      <span class="mx-3 text-white font-black">/</span>
      <span class="mx-4 font-black uppercase text-scripture-gold">
        MADE TO WEAR, MADE TO REMIND
      </span>
      <span class="mx-3 text-scripture-gold font-black">✦</span>
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
  animation: marquee 26s linear infinite;
  will-change: transform;
}
.animate-marquee:hover {
  animation-play-state: paused;
}
</style>
