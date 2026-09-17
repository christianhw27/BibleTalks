<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCatalogStore } from '../../stores/catalogStore'
import {
  X,
  MessageCircle,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Minus,
  Plus,
  Clock,
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  product: {
    type: Object,
    default: null,
  },
  initialSize: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'ordered'])

const catalogStore = useCatalogStore()

// Form state
const selectedSize = ref('')
const quantity = ref(1)
const customerName = ref('')
const customerPhone = ref('')
const customerAddress = ref('')
const customerNotes = ref('')
const saveInfo = ref(true)
const errorMessage = ref('')

// Pre-fill / load saved customer info from localStorage
const LOCAL_STORAGE_KEY = 'bibletalk_customer_data'

onMounted(() => {
  loadSavedCustomerData()
})

function loadSavedCustomerData() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.name) customerName.value = data.name
      if (data.phone) customerPhone.value = data.phone
      if (data.address) customerAddress.value = data.address
    }
  } catch (err) {
    console.error('Failed to read saved customer data', err)
  }
}

// Reset or synchronize state when modal opens or product changes
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      errorMessage.value = ''
      quantity.value = 1
      loadSavedCustomerData()

      if (props.initialSize) {
        selectedSize.value = props.initialSize
      } else if (availableVariants.value.length > 0) {
        // Find first in-stock variant if available
        const firstInStock = availableVariants.value.find((v) => v.stock > 0)
        selectedSize.value = firstInStock ? firstInStock.size : availableVariants.value[0].size
      } else {
        selectedSize.value = ''
      }
    }
  }
)

watch(
  () => props.initialSize,
  (val) => {
    if (val) selectedSize.value = val
  }
)

// Computed helpers
const availableVariants = computed(() => {
  return props.product?.variants || []
})

const currentVariant = computed(() => {
  if (!availableVariants.value.length) return null
  return availableVariants.value.find((v) => v.size === selectedSize.value) || null
})

const maxStock = computed(() => {
  if (currentVariant.value) {
    return currentVariant.value.stock
  }
  return 99
})

const isOutOfStock = computed(() => {
  if (currentVariant.value) {
    return currentVariant.value.stock <= 0
  }
  return false
})

const unitPrice = computed(() => {
  if (!props.product) return 0
  return props.product.price || props.product.bundlePrice || 0
})

const subtotal = computed(() => {
  return unitPrice.value * quantity.value
})

const productImage = computed(() => {
  if (props.product?.images && props.product.images.length > 0) {
    return props.product.images[0]
  }
  if (props.product?.image) {
    return props.product.image
  }
  return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80'
})

// Quantity controls
function decreaseQty() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function increaseQty() {
  if (quantity.value < maxStock.value) {
    quantity.value++
  }
}

// Close modal handler
function closeModal() {
  errorMessage.value = ''
  emit('close')
}

// Validation & WhatsApp dispatch
function submitOrder() {
  errorMessage.value = ''

  // Validate size if variants exist
  if (availableVariants.value.length > 0 && !selectedSize.value) {
    errorMessage.value = 'Silakan pilih ukuran pakaian terlebih dahulu.'
    return
  }

  if (isOutOfStock.value) {
    errorMessage.value = `Ukuran ${selectedSize.value} saat ini habis. Silakan pilih ukuran lain.`
    return
  }

  // Validate Name
  if (!customerName.value.trim()) {
    errorMessage.value = 'Nama lengkap pemesan wajib diisi.'
    return
  }

  // Validate Phone
  const cleanedPhone = customerPhone.value.trim().replace(/[^0-9+]/g, '')
  if (!cleanedPhone || cleanedPhone.length < 8) {
    errorMessage.value = 'Nomor WhatsApp / HP tidak valid (minimal 8 digit).'
    return
  }

  // Validate Address
  if (!customerAddress.value.trim()) {
    errorMessage.value = 'Alamat lengkap pengiriman wajib diisi agar CS dapat mengecek ongkir.'
    return
  }

  // Save to localStorage if enabled
  if (saveInfo.value) {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          name: customerName.value.trim(),
          phone: cleanedPhone,
          address: customerAddress.value.trim(),
        })
      )
    } catch (e) {
      console.error('Failed to save to localStorage', e)
    }
  }

  // Construct structured WhatsApp message routed to the active CP (WIB based)
  const activeCP = catalogStore.activeWhatsAppCP
  const wa = activeCP?.whatsapp_number || catalogStore.storeSettings.whatsapp_number || '6281234567890'
  const brandName = catalogStore.storeSettings.brand_name || 'Bible Talk'
  const cpGreeting = activeCP?.name ? `Halo *${activeCP.name}* (${brandName})` : `Halo *${brandName}*`
  const formattedPrice = catalogStore.formatPrice(unitPrice.value)
  const formattedTotal = catalogStore.formatPrice(subtotal.value)
  const productUrl = window.location.href

  const messageLines = [
    `Shalom / ${cpGreeting}, saya ingin memesan artikel berikut:`,
    '',
    `📋 *DETAIL PEMESANAN*`,
    `• Produk: *${props.product?.title || 'Artikel Pakaian'}*`,
    selectedSize.value ? `• Ukuran: *${selectedSize.value}*` : '',
    `• Jumlah: *${quantity.value} pcs*`,
    `• Harga Satuan: *${formattedPrice}*`,
    `• Estimasi Subtotal: *${formattedTotal}*`,
    props.product?.slug ? `• Link Artikel: ${productUrl}` : '',
    '',
    `👤 *DATA PENERIMA & ALAMAT*`,
    `• Nama Penerima: *${customerName.value.trim()}*`,
    `• No. WhatsApp: *${cleanedPhone}*`,
    `• Alamat Lengkap:\n${customerAddress.value.trim()}`,
    customerNotes.value.trim() ? `• Catatan: _${customerNotes.value.trim()}_` : '',
    '',
    `Mohon info ketersediaan stok & nomor rekening resmi transfer beserta total ongkos kirim. Terima kasih dan Tuhan memberkati! 🙏`
  ].filter(line => line !== null && line !== undefined && line !== false)

  const finalMessage = messageLines.join('\n')
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(finalMessage)}`

  // Open WhatsApp in new tab
  window.open(waUrl, '_blank')

  emit('ordered', {
    product: props.product,
    size: selectedSize.value,
    quantity: quantity.value,
    customerName: customerName.value.trim(),
  })

  closeModal()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn"
      aria-labelledby="order-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        @click="closeModal"
      ></div>

      <!-- Modal Card -->
      <div
        class="relative w-full max-w-lg bg-[#fbfbfa] border border-brand-300 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh] my-auto"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-brand-200 bg-white flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-brand-900 text-white flex items-center justify-center">
              <ShoppingBag class="w-4 h-4 text-scripture-sand" />
            </div>
            <div>
              <h2 id="order-modal-title" class="font-serif font-bold text-base sm:text-lg text-brand-950 uppercase tracking-tight leading-none">
                Formulir Pemesanan
              </h2>
              <p class="font-mono text-[10px] text-brand-500 uppercase tracking-wider mt-0.5">
                Konfirmasi cepat langsung via WhatsApp CS
              </p>
            </div>
          </div>

          <button
            @click="closeModal"
            class="p-1.5 rounded-full text-brand-400 hover:text-brand-800 hover:bg-brand-100 transition-colors"
            aria-label="Tutup form pemesanan"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="px-5 py-4 overflow-y-auto space-y-5 text-brand-800 font-sans">
          
          <!-- Active Serving CP Badge (WIB Based) -->
          <div class="px-3.5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span class="text-emerald-900 font-medium">
                Melayani Sekarang: <strong class="text-emerald-950 font-bold">{{ catalogStore.activeWhatsAppCP?.name }}</strong>
              </span>
            </div>
            <div class="inline-flex items-center gap-1.5 text-[10px] text-emerald-800 bg-white/90 border border-emerald-300 px-2 py-0.5 rounded font-semibold">
              <Clock class="w-3 h-3 text-emerald-600" />
              <span>{{ catalogStore.activeWhatsAppCP?.is_shift ? `${catalogStore.activeWhatsAppCP.start_time} - ${catalogStore.activeWhatsAppCP.end_time} WIB` : 'Standby CS' }}</span>
            </div>
          </div>

          <!-- Product Summary Preview -->
          <div v-if="product" class="flex gap-3.5 p-3 rounded-lg bg-white border border-brand-200 shadow-xs">
            <div class="w-20 h-24 rounded bg-brand-100 overflow-hidden flex-shrink-0 border border-brand-200">
              <img
                :src="productImage"
                :alt="product.title"
                class="w-full h-full object-cover object-center"
              />
            </div>

            <div class="flex flex-col justify-between flex-grow py-0.5">
              <div>
                <span class="font-mono text-[10px] uppercase text-scripture-bronze tracking-wider block">
                  {{ product.category?.name || 'Bible Talk Exclusive' }}
                </span>
                <h3 class="font-serif font-bold text-sm sm:text-base text-brand-950 leading-snug line-clamp-2">
                  {{ product.title }}
                </h3>
              </div>

              <div class="flex items-baseline justify-between pt-1 border-t border-brand-100">
                <span class="font-mono text-xs text-brand-500">Harga Satuan:</span>
                <span class="font-mono font-bold text-sm text-brand-900">
                  {{ catalogStore.formatPrice(unitPrice) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Size Selection (if variants exist) -->
          <div v-if="availableVariants.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-mono text-xs uppercase tracking-wider text-brand-800 font-semibold flex items-center gap-1.5">
                <span>Pilih Ukuran</span>
                <span class="text-rose-500">*</span>
              </label>
              <span v-if="currentVariant" class="font-mono text-[11px] text-brand-500">
                Tersedia: 
                <strong :class="currentVariant.stock > 0 ? 'text-emerald-700' : 'text-rose-600'">
                  {{ currentVariant.stock > 0 ? `${currentVariant.stock} pcs` : 'Habis' }}
                </strong>
              </span>
            </div>

            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="v in availableVariants"
                :key="v.id || v.size"
                type="button"
                @click="selectedSize = v.size"
                :disabled="v.stock <= 0"
                class="py-2.5 px-2 rounded font-mono text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-0.5"
                :class="[
                  selectedSize === v.size
                    ? 'bg-brand-900 text-white border-brand-900 shadow-sm'
                    : v.stock > 0
                    ? 'bg-white border-brand-300 text-brand-800 hover:border-brand-600'
                    : 'bg-brand-100/70 border-brand-200 text-brand-300 cursor-not-allowed line-through'
                ]"
              >
                <span>{{ v.size }}</span>
                <span
                  class="text-[9px] font-normal"
                  :class="selectedSize === v.size ? 'text-scripture-sand' : v.stock > 0 ? 'text-brand-500' : 'text-rose-400'"
                >
                  {{ v.stock > 0 ? `${v.stock}` : '✕' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-brand-200">
            <div>
              <span class="font-mono text-xs uppercase tracking-wider text-brand-800 font-semibold block">
                Jumlah Pesanan
              </span>
              <span class="font-mono text-[11px] text-brand-500">
                Maksimal sesuai sisa stok
              </span>
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                @click="decreaseQty"
                :disabled="quantity <= 1"
                class="w-8 h-8 rounded border border-brand-300 flex items-center justify-center text-brand-700 hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Kurangi jumlah"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>

              <span class="font-mono font-bold text-sm w-6 text-center text-brand-950">
                {{ quantity }}
              </span>

              <button
                type="button"
                @click="increaseQty"
                :disabled="quantity >= maxStock"
                class="w-8 h-8 rounded border border-brand-300 flex items-center justify-center text-brand-700 hover:bg-brand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Tambah jumlah"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="space-y-3.5">
            
            <!-- Customer Name -->
            <div>
              <label class="block font-mono text-xs uppercase tracking-wider text-brand-800 font-semibold mb-1">
                Nama Lengkap Penerima <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-brand-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="customerName"
                  type="text"
                  placeholder="Contoh: Daniel Christian"
                  class="w-full pl-9 pr-3.5 py-2.5 bg-white border border-brand-300 rounded text-sm text-brand-900 placeholder-brand-400 focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
                />
              </div>
            </div>

            <!-- Customer WhatsApp / Phone -->
            <div>
              <label class="block font-mono text-xs uppercase tracking-wider text-brand-800 font-semibold mb-1">
                Nomor WhatsApp / HP Aktif <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <Phone class="w-4 h-4 text-brand-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="customerPhone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  class="w-full pl-9 pr-3.5 py-2.5 bg-white border border-brand-300 rounded text-sm text-brand-900 placeholder-brand-400 focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800"
                />
              </div>
              <p class="font-mono text-[10px] text-brand-500 mt-1">
                Admin CS akan mengirimkan nomor resi & rincian transfer ke nomor ini.
              </p>
            </div>

            <!-- Shipping Address -->
            <div>
              <label class="block font-mono text-xs uppercase tracking-wider text-brand-800 font-semibold mb-1">
                Alamat Lengkap Tujuan Pengiriman <span class="text-rose-500">*</span>
              </label>
              <div class="relative">
                <MapPin class="w-4 h-4 text-brand-400 absolute left-3 top-3" />
                <textarea
                  v-model="customerAddress"
                  rows="3"
                  placeholder="Contoh: Jl. Diponegoro No. 45, RT 02 / RW 05, Kec. Menteng, Jakarta Pusat, 10310"
                  class="w-full pl-9 pr-3.5 py-2.5 bg-white border border-brand-300 rounded text-sm text-brand-900 placeholder-brand-400 focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800 resize-none"
                ></textarea>
              </div>
              <p class="font-mono text-[10px] text-brand-500 mt-1">
                Mohon sertakan nama jalan, RT/RW, kecamatan, kota, serta kode pos untuk hitung ongkir.
              </p>
            </div>

            <!-- Notes (Optional) -->
            <div>
              <label class="block font-mono text-xs uppercase tracking-wider text-brand-800 font-semibold mb-1">
                Catatan Khusus <span class="text-brand-400 font-normal">(Opsional)</span>
              </label>
              <div class="relative">
                <FileText class="w-4 h-4 text-brand-400 absolute left-3 top-3" />
                <textarea
                  v-model="customerNotes"
                  rows="2"
                  placeholder="Contoh: Titipkan di pos satpam jika tidak ada orang / request ucapan rohani."
                  class="w-full pl-9 pr-3.5 py-2.5 bg-white border border-brand-300 rounded text-sm text-brand-900 placeholder-brand-400 focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-800 resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Checkbox Remember Info -->
            <label class="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                v-model="saveInfo"
                class="w-4 h-4 accent-brand-900 rounded border-brand-300"
              />
              <span class="font-mono text-xs text-brand-600">
                Simpan data alamat saya untuk pesanan berikutnya
              </span>
            </label>

          </div>

          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="flex items-start gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono animate-fadeIn"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Order Summary Card -->
          <div class="p-3.5 bg-brand-100/60 border border-brand-200 rounded-lg space-y-2 font-mono text-xs">
            <div class="flex items-center justify-between text-brand-600">
              <span>Subtotal Produk ({{ quantity }}x):</span>
              <span class="text-brand-900 font-medium">{{ catalogStore.formatPrice(subtotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-brand-600">
              <span>Ongkos Kirim:</span>
              <span class="text-brand-500 italic">Dihitung oleh Admin CS via WA</span>
            </div>
            <div class="pt-2 border-t border-brand-200 flex items-center justify-between font-bold text-sm text-brand-950">
              <span>Estimasi Total:</span>
              <span class="text-brand-950 font-serif text-base">{{ catalogStore.formatPrice(subtotal) }}</span>
            </div>
          </div>

        </div>

        <!-- Modal Footer CTA -->
        <div class="p-4 border-t border-brand-200 bg-white flex flex-col gap-2">
          <button
            type="button"
            @click="submitOrder"
            :disabled="isOutOfStock"
            class="w-full py-3.5 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2.5 shadow-md transition-all"
            :class="{ 'opacity-50 cursor-not-allowed': isOutOfStock }"
          >
            <MessageCircle class="w-4 h-4 text-white" />
            <span>PESAN VIA {{ catalogStore.activeWhatsAppCP?.name || 'WHATSAPP' }}</span>
          </button>

          <p class="text-center font-mono text-[10px] text-brand-500">
            Aman & Langsung • Terhubung ke {{ catalogStore.activeWhatsAppCP?.displayText || 'Customer Service Resmi' }}
          </p>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
