<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { Lock, ArrowLeft, AlertCircle, Loader2, ShieldCheck } from 'lucide-vue-next'

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
  <div class="relative min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#faf8f4] overflow-hidden text-brand-950">
    
    <!-- Ambient Halftone Dot Background Pattern -->
    <div class="absolute inset-0 bg-halftone text-brand-950/[0.07] pointer-events-none z-0"></div>

    <div class="relative z-10 max-w-md w-full bg-[#fdfcfa] border-2 border-brand-950 shadow-[6px_6px_0px_#153227] p-6 sm:p-8 space-y-6">
      
      <!-- Masking Tape Accent -->
      <div class="tape-strip -top-2.5 right-10 rotate-1 hidden sm:block"></div>

      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="w-10 h-10 bg-brand-950 text-scripture-gold border-2 border-brand-950 mx-auto flex items-center justify-center shadow-[2px_2px_0px_#153227] mb-2">
          <Lock class="w-5 h-5" />
        </div>
        
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-100 border border-brand-950 text-[10px] font-mono uppercase font-bold text-brand-900 tracking-wider">
          <span class="w-1.5 h-1.5 bg-scripture-gold inline-block"></span>
          <span>BT // SECURE OWNER ACCESS</span>
        </div>

        <h1 class="font-sans font-black text-2xl sm:text-3xl text-brand-950 uppercase tracking-tight">
          STAFF / OWNER ACCESS
        </h1>
        
        <p class="font-mono text-xs text-brand-600">
          Kelola katalog produk distro, stok ukuran, galeri lookbook, dan jadwal CS WhatsApp.
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="authStore.errorMessage"
        class="p-3 bg-rose-100 border-2 border-rose-600 flex items-center gap-2 text-xs font-mono text-rose-900 shadow-[2px_2px_0px_#991b1b]"
      >
        <AlertCircle class="w-4 h-4 shrink-0 text-rose-700" />
        <span>{{ authStore.errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4 font-mono text-xs">
        <div class="space-y-1">
          <label class="block uppercase tracking-wider text-brand-950 font-bold">
            Email Admin
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@bibletalk.com"
            class="w-full px-3.5 py-2.5 bg-white border-2 border-brand-950 text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-950 shadow-[2px_2px_0px_#153227]"
          />
        </div>

        <div class="space-y-1">
          <label class="block uppercase tracking-wider text-brand-950 font-bold">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-3.5 py-2.5 bg-white border-2 border-brand-950 text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-950 shadow-[2px_2px_0px_#153227]"
          />
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full py-3 px-4 mt-2 bg-brand-950 hover:bg-brand-900 text-scripture-gold uppercase font-black tracking-widest border-2 border-brand-950 shadow-[3px_3px_0px_#153227] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <Loader2 v-if="authStore.loading" class="w-4 h-4 animate-spin" />
          <span>{{ authStore.loading ? 'Memverifikasi...' : 'Masuk ke Panel CMS' }}</span>
        </button>
      </form>

      <!-- Back Link -->
      <div class="text-center pt-1 border-t border-brand-950/15">
        <router-link
          to="/"
          class="inline-flex items-center gap-1.5 text-xs font-mono text-brand-700 hover:text-brand-950 font-bold transition-colors"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Kembali ke Website Utama</span>
        </router-link>
      </div>

    </div>
  </div>
</template>
