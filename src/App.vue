<script setup>
import { onMounted } from 'vue'
import { useCatalogStore } from './stores/catalogStore'
import { useAuthStore } from './stores/authStore'
import AnnouncementBar from './components/layout/AnnouncementBar.vue'
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'

const catalogStore = useCatalogStore()
const authStore = useAuthStore()

onMounted(() => {
  catalogStore.initStore()
  authStore.initAuth()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#fcfcfb] text-brand-900 font-sans selection:bg-scripture-sand selection:text-brand-950">
    <!-- Announcement Ticker -->
    <AnnouncementBar />

    <!-- Distro Main Navigation Header -->
    <Navbar />

    <!-- Main Content View -->
    <main class="flex-grow">
      <router-view />
    </main>

    <!-- Streetwear Footer -->
    <Footer />
  </div>
</template>
