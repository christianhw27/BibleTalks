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
  if (props.product?.images && props.product.images.length > 0 && props.product.images[0]) {
    return props.product.images[0]
  }
  if (props.product?.image) {
    return props.product.image
  }
  return null
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
        class="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        @click="closeModal"
      ></div>

      <!-- Modal Card (Streetwear Zine Style) -->
      <div
        class="relative w-full max-w-lg bg-[#faf8f4] border-2 border-brand-950 shadow-[6px_6px_0px_#153227] overflow-hidden z-10 flex flex-col max-h-[92vh] my-auto"
        @click.stop
      >
        <!-- Masking Tape Accent -->
        <div class="tape-strip -top-2.5 right-10 rotate-1 hidden sm:block"></div>

        <!-- Ambient Halftone Dot Background Pattern -->
        <div class="absolute inset-0 bg-halftone text-brand-950/[0.05] pointer-events-none z-0"></div>

        <!-- Modal Header Bar -->
        <div class="relative z-10 px-5 py-3.5 bg-brand-950 text-scripture-gold border-b-2 border-brand-950 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 bg-scripture-gold text-brand-950 border border-brand-950 flex items-center justify-center font-bold">
              <ShoppingBag class="w-4 h-4" />
            </div>
            <div>
              <h2 id="order-modal-title" class="font-sans font-black text-sm sm:text-base uppercase tracking-tight text-scripture-gold leading-none">
                Formulir Pemesanan
              </h2>
              <p class="font-mono text-[9px] sm:text-[10px] text-white/70 uppercase tracking-widest mt-0.5">
                BT // DIRECT WHATSAPP CHECKOUT
              </p>
            </div>
          </div>

          <button
            @click="closeModal"
            class="p-1 bg-white text-brand-950 hover:bg-rose-600 hover:text-white transition-colors border border-brand-950 shadow-[1px_1px_0px_#000]"
            aria-label="Tutup form pemesanan"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="relative z-10 px-5 py-4 overflow-y-auto space-y-4 text-brand-900 font-sans">
          
          <!-- Active Serving CP Badge (WIB Based) -->
          <div class="p-2.5 bg-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-emerald-600 border border-brand-950"></span>
              <span class="text-brand-900 text-[11px] sm:text-xs">
                Melayani: <strong class="font-black text-brand-950 uppercase">{{ catalogStore.activeWhatsAppCP?.name }}</strong>
              </span>
            </div>
            <div class="inline-flex items-center gap-1 text-[10px] bg-brand-100 border border-brand-950 px-2 py-0.5 font-bold uppercase">
              <Clock class="w-3 h-3 text-brand-950" />
              <span>{{ catalogStore.activeWhatsAppCP?.is_shift ? `${catalogStore.activeWhatsAppCP.start_time} - ${catalogStore.activeWhatsAppCP.end_time} WIB` : 'Standby CS' }}</span>
            </div>
          </div>

          <!-- Product Summary Preview -->
          <div v-if="product" class="flex gap-3 p-3 bg-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227]">
            <div class="w-16 h-20 bg-brand-100 overflow-hidden shrink-0 border border-brand-950 flex items-center justify-center">
              <img
                v-if="productImage"
                :src="productImage"
                :alt="product.title"
                class="w-full h-full object-cover object-center"
              />
              <span v-else class="text-[9px] font-mono text-brand-400 font-bold uppercase">No Img</span>
            </div>

            <div class="flex flex-col justify-between flex-grow py-0.5">
              <div>
                <span class="font-mono text-[9px] uppercase text-brand-600 tracking-wider block font-semibold">
                  {{ product.category?.name || 'Rilisan Bible Talk' }}
                </span>
                <h3 class="font-sans font-black text-xs sm:text-sm text-brand-950 leading-snug line-clamp-2 uppercase">
                  {{ product.title }}
                </h3>
              </div>

              <div class="flex items-baseline justify-between pt-1 border-t border-brand-950/15 font-mono">
                <span class="text-[10px] text-brand-600 font-semibold uppercase">Harga:</span>
                <span class="font-black text-xs sm:text-sm text-brand-950">
                  {{ catalogStore.formatPrice(unitPrice) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Size Selection (if variants exist) -->
          <div v-if="availableVariants.length > 0" class="space-y-1.5 font-mono">
            <div class="flex items-center justify-between text-xs">
              <label class="uppercase tracking-wider text-brand-950 font-bold flex items-center gap-1">
                <span>Pilih Ukuran</span>
                <span class="text-rose-600">*</span>
              </label>
              <span v-if="currentVariant" class="text-[11px] text-brand-600">
                Stok: 
                <strong :class="currentVariant.stock > 0 ? 'text-emerald-800' : 'text-rose-600'" class="font-bold">
                  {{ currentVariant.stock > 0 ? `${currentVariant.stock} pcs` : 'Habis' }}
                </strong>
              </span>
            </div>

            <div class="grid grid-cols-5 gap-1.5">
              <button
                v-for="v in availableVariants"
                :key="v.id || v.size"
                type="button"
                @click="selectedSize = v.size"
                :disabled="v.stock <= 0"
                class="py-2 px-1 font-mono text-xs font-bold border-2 transition-all text-center flex flex-col items-center justify-center"
                :class="[
                  selectedSize === v.size
                    ? 'bg-brand-950 text-scripture-gold border-brand-950 shadow-[2px_2px_0px_#153227]'
                    : v.stock > 0
                    ? 'bg-white border-brand-950 text-brand-950 hover:bg-brand-100 shadow-[1px_1px_0px_#153227]'
                    : 'bg-brand-100 border-brand-950/30 text-brand-400 cursor-not-allowed line-through opacity-60'
                ]"
              >
                <span>{{ v.size }}</span>
                <span
                  class="text-[8px] font-mono"
                  :class="selectedSize === v.size ? 'text-scripture-gold/80' : v.stock > 0 ? 'text-brand-600' : 'text-rose-500'"
                >
                  {{ v.stock > 0 ? `${v.stock}` : '✕' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="flex items-center justify-between bg-white p-2.5 border-2 border-brand-950 shadow-[2px_2px_0px_#153227] font-mono text-xs">
            <div>
              <span class="uppercase tracking-wider text-brand-950 font-bold block">
                Jumlah Pesanan
              </span>
              <span class="text-[10px] text-brand-500">
                Maksimal sesuai sisa stok
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="decreaseQty"
                :disabled="quantity <= 1"
                class="w-7 h-7 border-2 border-brand-950 bg-white flex items-center justify-center text-brand-950 hover:bg-brand-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[1px_1px_0px_#153227]"
                aria-label="Kurangi jumlah"
              >
                <Minus class="w-3.5 h-3.5" />
              </button>

              <span class="font-mono font-black text-sm w-6 text-center text-brand-950">
                {{ quantity }}
              </span>

              <button
                type="button"
                @click="increaseQty"
                :disabled="quantity >= maxStock"
                class="w-7 h-7 border-2 border-brand-950 bg-white flex items-center justify-center text-brand-950 hover:bg-brand-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-[1px_1px_0px_#153227]"
                aria-label="Tambah jumlah"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Form Fields (Clean Brutalist Zine Inputs) -->
          <div class="space-y-3 font-mono text-xs">
            
            <!-- Customer Name -->
            <div>
              <label class="block uppercase tracking-wider text-brand-950 font-bold mb-1">
                Nama Lengkap Penerima <span class="text-rose-600">*</span>
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-brand-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="customerName"
                  type="text"
                  placeholder="Contoh: Daniel Christian"
                  class="w-full pl-9 pr-3.5 py-2 bg-white border-2 border-brand-950 text-xs text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-950 shadow-[2px_2px_0px_#153227]"
                />
              </div>
            </div>

            <!-- Customer WhatsApp / Phone -->
            <div>
              <label class="block uppercase tracking-wider text-brand-950 font-bold mb-1">
                Nomor WhatsApp / HP <span class="text-rose-600">*</span>
              </label>
              <div class="relative">
                <Phone class="w-4 h-4 text-brand-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="customerPhone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  class="w-full pl-9 pr-3.5 py-2 bg-white border-2 border-brand-950 text-xs text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-950 shadow-[2px_2px_0px_#153227]"
                />
              </div>
            </div>

            <!-- Shipping Address -->
            <div>
              <label class="block uppercase tracking-wider text-brand-950 font-bold mb-1">
                Alamat Pengiriman Lengkap <span class="text-rose-600">*</span>
              </label>
              <div class="relative">
                <MapPin class="w-4 h-4 text-brand-500 absolute left-3 top-2.5" />
                <textarea
                  v-model="customerAddress"
                  rows="2"
                  placeholder="Nama jalan, RT/RW, kelurahan, kecamatan, kota & kode pos..."
                  class="w-full pl-9 pr-3.5 py-2 bg-white border-2 border-brand-950 text-xs text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-950 shadow-[2px_2px_0px_#153227] resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Notes (Optional) -->
            <div>
              <label class="block uppercase tracking-wider text-brand-700 font-bold mb-1">
                Catatan Khusus <span class="text-brand-400 font-normal">(Opsional)</span>
              </label>
              <div class="relative">
                <FileText class="w-4 h-4 text-brand-500 absolute left-3 top-2.5" />
                <textarea
                  v-model="customerNotes"
                  rows="1"
                  placeholder="Contoh: Titipkan Satpam"
                  class="w-full pl-9 pr-3.5 py-2 bg-white border-2 border-brand-950 text-xs text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-950 shadow-[2px_2px_0px_#153227] resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Checkbox Remember Info -->
            <label class="flex items-center gap-2 cursor-pointer select-none pt-0.5">
              <input
                type="checkbox"
                v-model="saveInfo"
                class="w-3.5 h-3.5 accent-brand-950 rounded-none cursor-pointer"
              />
              <span class="font-mono text-[11px] text-brand-700">
                Simpan data saya untuk pesanan berikutnya
              </span>
            </label>

          </div>

          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="flex items-start gap-2 p-2.5 bg-rose-100 border-2 border-rose-600 text-rose-900 text-xs font-mono animate-fadeIn"
          >
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Order Summary Card (Monospace Tech Receipt) -->
          <div class="p-3 bg-white border-2 border-brand-950 shadow-[2px_2px_0px_#153227] space-y-1.5 font-mono text-xs">
            <div class="flex items-center justify-between text-brand-700">
              <span>Subtotal ({{ quantity }}x):</span>
              <span class="font-bold text-brand-950">{{ catalogStore.formatPrice(subtotal) }}</span>
            </div>
            <div class="flex items-center justify-between text-brand-600 text-[11px]">
              <span>Ongkir:</span>
              <span class="italic">Dihitung Admin via WA</span>
            </div>
            <div class="pt-1.5 border-t border-brand-950/20 flex items-center justify-between font-black text-sm text-brand-950">
              <span class="uppercase">Total Pesanan:</span>
              <span class="text-brand-950">{{ catalogStore.formatPrice(subtotal) }}</span>
            </div>
          </div>

        </div>

        <!-- Modal Footer CTA Button -->
        <div class="relative z-10 p-4 border-t-2 border-brand-950 bg-white flex flex-col gap-1.5 font-mono">
          <button
            type="button"
            @click="submitOrder"
            :disabled="isOutOfStock"
            class="w-full py-3 px-5 border-2 border-brand-950 bg-brand-950 text-scripture-gold uppercase tracking-widest font-black text-xs flex items-center justify-center gap-2 shadow-[3px_3px_0px_#153227] active:translate-x-0.5 active:translate-y-0.5 hover:bg-brand-900 transition-all"
            :class="{ 'opacity-50 cursor-not-allowed': isOutOfStock }"
          >
            <MessageCircle class="w-4 h-4 text-emerald-400" />
            <span>PESAN VIA WHATSAPP (CS {{ catalogStore.activeWhatsAppCP?.name || 'BIBLE TALK' }})</span>
          </button>

          <p class="text-center text-[10px] text-brand-600 uppercase tracking-wider">
            Terhubung langsung ke WhatsApp resmi Bible Talk
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
  animation: fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
