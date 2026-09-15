<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { Lock, ArrowLeft, AlertCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  try {
    await authStore.login(email.value, password.value)
    router.push('/admin')
  } catch (err) {
    // Error is handled in authStore.errorMessage
  }
}
</script>

<template>
  <div class="min-h-[75vh] flex items-center justify-center px-4 py-16">
    <div class="max-w-md w-full space-y-8 bg-white border border-brand-300 p-8 rounded-lg shadow-xl">
      
      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-full bg-scripture-linen border border-scripture-sand mx-auto flex items-center justify-center text-scripture-bronze mb-4">
          <Lock class="w-5 h-5" />
        </div>
        <h2 class="font-serif font-bold text-2xl text-brand-950 uppercase tracking-tight">
          STAFF / OWNER ACCESS
        </h2>
        <p class="font-mono text-xs text-brand-500">
          Masuk untuk mengelola katalog produk distro, stok ukuran, dan foto rilisan.
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="authStore.errorMessage"
        class="p-3 bg-rose-50 border border-rose-200 rounded flex items-center gap-2.5 text-xs font-mono text-rose-800"
      >
        <AlertCircle class="w-4 h-4 flex-shrink-0 text-rose-600" />
        <span>{{ authStore.errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4 font-sans">
        <div class="space-y-1.5">
          <label class="block font-mono text-xs text-brand-700 uppercase tracking-wider">
            Email Admin
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@bibletalks.com"
            class="w-full px-3.5 py-2.5 bg-brand-50 border border-brand-300 rounded text-sm text-brand-950 placeholder-brand-400 focus:outline-none focus:border-brand-600"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block font-mono text-xs text-brand-700 uppercase tracking-wider">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-3.5 py-2.5 bg-brand-50 border border-brand-300 rounded text-sm text-brand-950 placeholder-brand-400 focus:outline-none focus:border-brand-600"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full py-3 px-4 mt-2 bg-brand-900 hover:bg-brand-800 text-white font-mono text-xs uppercase font-bold tracking-widest rounded transition-all flex items-center justify-center gap-2 shadow"
        >
          <Loader2 v-if="authStore.loading" class="w-4 h-4 animate-spin" />
          <span>{{ authStore.loading ? 'Memverifikasi...' : 'Masuk ke Panel CMS' }}</span>
        </button>
      </form>

      <!-- Back Link -->
      <div class="text-center pt-2">
        <router-link
          to="/"
          class="inline-flex items-center gap-1.5 text-xs font-mono text-brand-500 hover:text-brand-800 transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali ke Website Utama</span>
        </router-link>
      </div>

    </div>
  </div>
</template>
