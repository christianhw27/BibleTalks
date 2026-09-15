import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { loginAdmin, logoutAdmin, getCurrentAdmin } from '../services/adminService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isInitialized = ref(false)
  const loading = ref(false)
  const errorMessage = ref('')

  const isAuthenticated = computed(() => Boolean(user.value))

  async function initAuth() {
    if (isInitialized.value) return
    try {
      loading.value = true
      const currentUser = await getCurrentAdmin()
      user.value = currentUser

      // Listen to auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user || null
      })
    } catch (err) {
      console.error('Error initializing auth:', err)
      user.value = null
    } finally {
      isInitialized.value = true
      loading.value = false
    }
  }

  async function login(email, password) {
    try {
      loading.value = true
      errorMessage.value = ''
      const data = await loginAdmin(email, password)
      user.value = data.user
      return data
    } catch (err) {
      errorMessage.value = err.message || 'Gagal login. Periksa email & password Anda.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      loading.value = true
      await logoutAdmin()
      user.value = null
    } catch (err) {
      console.error('Error during logout:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    isInitialized,
    loading,
    errorMessage,
    isAuthenticated,
    initAuth,
    login,
    logout,
  }
})
