/**
 * WhatsApp Contact Person (CP) Time-Based Shift Resolver
 * All time calculations are strictly normalized to WIB (Waktu Indonesia Barat / Asia/Jakarta, UTC+7)
 */

export const DEFAULT_SHIFTS = [
  {
    id: 'shift-1',
    name: 'CP 1 (Shift Pagi - Siang)',
    start_time: '00:00',
    end_time: '12:00',
    whatsapp_number: '6281234567890',
    is_active: true,
  },
  {
    id: 'shift-2',
    name: 'CP 2 (Shift Siang - Malam)',
    start_time: '12:01',
    end_time: '23:59',
    whatsapp_number: '6289876543210',
    is_active: true,
  },
]

/**
 * Returns current hours and minutes in WIB (Asia/Jakarta)
 */
export function getWIBTimeParts(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10)
    const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10)

    const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    return {
      hour,
      minute,
      second,
      formattedTime,
      totalMinutes: hour * 60 + minute,
    }
  } catch (err) {
    // Fallback if Intl is unavailable or fails
    const utcHours = date.getUTCHours()
    const utcMinutes = date.getUTCMinutes()
    const wibHours = (utcHours + 7) % 24
    const formattedTime = `${String(wibHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`
    return {
      hour: wibHours,
      minute: utcMinutes,
      second: date.getUTCSeconds(),
      formattedTime,
      totalMinutes: wibHours * 60 + utcMinutes,
    }
  }
}

/**
 * Converts "HH:mm" to total minutes from midnight
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0)
  return h * 60 + m
}

/**
 * Checks if currentMinutes falls inside [startStr, endStr]
 * Supports both normal range (e.g., 08:00 - 17:00) and overnight range (e.g., 22:00 - 06:00)
 */
export function isWithinShift(currentMinutes, startStr, endStr) {
  const start = parseTimeToMinutes(startStr)
  const end = parseTimeToMinutes(endStr)

  if (start <= end) {
    // Standard daytime shift (e.g. 00:00 to 12:00)
    return currentMinutes >= start && currentMinutes <= end
  } else {
    // Overnight shift crossing midnight (e.g. 22:00 to 06:00)
    return currentMinutes >= start || currentMinutes <= end
  }
}

/**
 * Resolves the currently active WhatsApp Contact Person based on WIB time and store settings
 */
export function getActiveWhatsAppCP(storeSettings = {}, date = new Date()) {
  const defaultNumber = storeSettings?.whatsapp_number || '6281234567890'
  const brandName = storeSettings?.brand_name || 'Bible Talk'
  const wib = getWIBTimeParts(date)

  const shiftsEnabled = storeSettings?.whatsapp_shifts_enabled !== false
  const rawShifts = Array.isArray(storeSettings?.whatsapp_shifts) && storeSettings.whatsapp_shifts.length > 0
    ? storeSettings.whatsapp_shifts
    : DEFAULT_SHIFTS

  if (shiftsEnabled && rawShifts.length > 0) {
    // Filter active shifts
    const activeShifts = rawShifts.filter((s) => s.is_active !== false)

    // Find shift matching current WIB time
    const matchedShift = activeShifts.find((shift) => {
      return isWithinShift(wib.totalMinutes, shift.start_time, shift.end_time)
    })

    if (matchedShift && matchedShift.whatsapp_number) {
      return {
        id: matchedShift.id,
        name: matchedShift.name || 'Customer Service',
        whatsapp_number: matchedShift.whatsapp_number.replace(/[^0-9]/g, ''),
        start_time: matchedShift.start_time,
        end_time: matchedShift.end_time,
        is_shift: true,
        wib_time: `${wib.formattedTime} WIB`,
        displayText: `${matchedShift.name} (${matchedShift.start_time} - ${matchedShift.end_time} WIB)`,
      }
    }
  }

  // Fallback to general store WhatsApp number
  return {
    id: 'default',
    name: `${brandName} CS Official`,
    whatsapp_number: defaultNumber.replace(/[^0-9]/g, ''),
    start_time: '00:00',
    end_time: '23:59',
    is_shift: false,
    wib_time: `${wib.formattedTime} WIB`,
    displayText: `${brandName} CS Official`,
  }
}
