import { prisma } from "@/lib/db"
import { getAvailableSlots, getNext7Days, formatDate, isSlotAvailable } from "@/lib/bot/availability"
import type { BotState, BotContext, HandlerResult } from "@/lib/bot/state-machine"

interface HandlerParams {
  businessId: string
  waNumber: string
  message: string
  state: BotState
  context: BotContext
}

export async function handleIdle({ businessId }: HandlerParams): Promise<HandlerResult> {
  const business = await prisma.business.findUnique({ where: { id: businessId } })

  const welcome = business?.welcomeMessage || "Halo! Selamat datang di layanan booking kami."

  const reply =
    `${welcome}\n\n` +
    `Silakan pilih menu di bawah ini:`

  const interactive = {
    type: "list",
    header: { type: "text", text: "Menu Utama" },
    body: { text: welcome },
    footer: { text: "Pilih salah satu menu" },
    action: {
      button: "Lihat Menu",
      sections: [
        {
          title: "Menu",
          rows: [
            { id: "1", title: "Detail Bisnis", description: "Informasi tentang bisnis kami" },
            { id: "2", title: "Booking", description: "Booking layanan sekarang" },
            { id: "3", title: "Lihat Booking", description: "Cek status booking" },
            { id: "4", title: "Jam Operasional", description: "Lihat jam kerja" },
          ],
        },
      ],
    },
  }

  return { reply, newState: "MAIN_MENU", interactive }
}

export async function handleMainMenu({ businessId, message }: HandlerParams): Promise<HandlerResult> {
  const lower = message.trim()

  if (lower === "1" || lower.toLowerCase() === "detail bisnis") {
    const business = await prisma.business.findUnique({ where: { id: businessId } })
    const info =
      `*Detail Bisnis*\n\n` +
      `${business?.name || "Nama bisnis tidak tersedia"}\n\n` +
      `${business?.description || "Belum ada deskripsi."}\n\n` +
      `Ketik *menu* untuk kembali.`
    return { reply: info, newState: "MAIN_MENU" }
  }

  if (lower === "2" || lower.toLowerCase() === "booking") {
    return await handleBookingStart({ businessId, waNumber: "", message, state: "MAIN_MENU", context: {} })
  }

  if (lower === "3" || lower.toLowerCase() === "lihat booking") {
    return {
      reply: "Masukkan kode booking kamu untuk cek status:\n\nKetik kode booking atau ketik *menu* untuk kembali.",
      newState: "VIEW_BOOKING",
    }
  }

  if (lower === "4" || lower.toLowerCase() === "jam operasional") {
    const schedules = await prisma.schedule.findMany({
      where: { businessId, isActive: true },
      orderBy: { dayOfWeek: "asc" },
    })

    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    let info = "*Jam Operasional*\n\n"
    if (schedules.length > 0) {
      for (const s of schedules) {
        info += `${dayNames[s.dayOfWeek]}: ${s.openTime} - ${s.closeTime}\n`
      }
    } else {
      info += "Belum diatur.\n"
    }
    info += "\nKetik *menu* untuk kembali."
    return { reply: info, newState: "MAIN_MENU" }
  }

  return {
    reply: "Pilihan tidak valid. Silakan pilih 1-4 atau ketik *menu*.\n\n1. Detail Bisnis\n2. Booking\n3. Lihat Booking\n4. Jam Operasional",
    newState: "MAIN_MENU",
  }
}

export async function handleBookingStart({ businessId }: HandlerParams): Promise<HandlerResult> {
  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  if (services.length === 0) {
    return {
      reply: "Maaf, belum ada layanan tersedia. Ketik *menu* untuk kembali.",
      newState: "MAIN_MENU",
    }
  }

  const serviceList = services
    .map((s, i) => `${i + 1}. ${s.name} — ${s.durationMinutes} menit${s.price ? ` (Rp${s.price})` : ""}`)
    .join("\n")

  const interactive = {
    type: "list",
    header: { type: "text", text: "Pilih Layanan" },
    body: { text: `Untuk melanjutkan proses booking, silakan pilih layanan yang Anda butuhkan:` },
    action: {
      button: "Pilih Layanan",
      sections: [
        {
          title: "Layanan Tersedia",
          rows: services.map((s, i) => ({
            id: String(i + 1),
            title: s.name,
            description: `${s.durationMinutes} menit${s.price ? ` - Rp${Number(s.price).toLocaleString("id-ID")}` : ""}`,
          })),
        },
      ],
    },
  }

  return {
    reply: `Untuk melanjutkan proses booking, silakan pilih layanan yang Anda butuhkan:\n\n${serviceList}`,
    newState: "SELECT_SERVICE",
    interactive,
  }
}

export async function handleViewBooking({ businessId, message }: HandlerParams): Promise<HandlerResult> {
  const code = message.trim().toUpperCase()

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    include: { service: true },
  })

  if (!booking || booking.businessId !== businessId) {
    return {
      reply: "Kode booking tidak ditemukan. Periksa kembali kode atau ketik *menu*.\n\nMasukkan kode booking:",
      newState: "VIEW_BOOKING",
    }
  }

  const dateStr = booking.scheduledAt.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  const timeStr = booking.scheduledAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })

  const statusMap: Record<string, string> = {
    PENDING: "Menunggu Konfirmasi",
    CONFIRMED: "Dikonfirmasi",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  }

  return {
    reply:
      `*Detail Booking*\n\n` +
      `Kode: ${booking.bookingCode}\n` +
      `Layanan: ${booking.service?.name || "-"}\n` +
      `Tanggal: ${dateStr}\n` +
      `Jam: ${timeStr}\n` +
      `Status: ${statusMap[booking.status] || booking.status}\n\n` +
      `Ketik *menu* untuk kembali.`,
    newState: "MAIN_MENU",
  }
}

// ── Existing booking flow handlers ────────────────────────────

export async function handleSelectService({ businessId, message, context }: HandlerParams): Promise<HandlerResult> {
  const lower = message.trim().toLowerCase()
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({ businessId, waNumber: "", message, state: "IDLE", context: {} })
  }

  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  const idx = parseInt(message.trim()) - 1
  if (isNaN(idx) || idx < 0 || idx >= services.length) {
    return {
      reply: "Pilihan tidak valid. Silakan ketik nomor layanan yang tersedia atau ketik *menu*.",
      newState: "SELECT_SERVICE",
      context,
    }
  }

  const selected = services[idx]
  const days = getNext7Days()
  const dayList = days
    .map((d, i) => `${i + 1}. ${formatDate(d)}`)
    .join("\n")

  const interactive = {
    type: "list",
    header: { type: "text", text: selected.name },
    body: { text: `📅 *Pilih Tanggal Booking*\n\nSilakan pilih tanggal yang Anda inginkan untuk layanan yang telah dipilih.\n\nPastikan tanggal yang dipilih sesuai dengan ketersediaan jadwal kami.` },
    action: {
      button: "Pilih Tanggal",
      sections: [
        {
          title: "7 Hari Kedepan",
          rows: days.map((d, i) => ({
            id: String(i + 1),
            title: formatDate(d),
          })),
        },
      ],
    },
  }

  return {
    reply: `📅 *Pilih Tanggal Booking*\n\nSilakan pilih tanggal yang Anda inginkan untuk layanan yang telah dipilih.\n\nPastikan tanggal yang dipilih sesuai dengan ketersediaan jadwal kami.\n\n${dayList}\n\nKlik tombol *Pilih Tanggal* untuk melihat kalender dan melanjutkan proses booking.`,
    newState: "SELECT_DATE",
    context: {
      serviceId: selected.id,
      serviceName: selected.name,
      serviceDuration: selected.durationMinutes,
    },
    interactive,
  }
}

export async function handleSelectDate({ businessId, message, context }: HandlerParams) {
  const lower = message.trim().toLowerCase()
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({ businessId, waNumber: "", message, state: "IDLE", context: {} })
  }

  const idx = parseInt(message.trim()) - 1
  const days = getNext7Days()

  if (isNaN(idx) || idx < 0 || idx >= days.length) {
    return {
      reply: "Pilihan tidak valid. Silakan ketik nomor tanggal yang tersedia atau ketik *menu*.",
      newState: "SELECT_DATE" as BotState,
      context,
    }
  }

  const selectedDate = days[idx]
  const slots = await getAvailableSlots(businessId, selectedDate, context.serviceDuration || 60)

  if (slots.length === 0) {
    return {
      reply: "Maaf, tidak ada slot tersedia untuk tanggal tersebut. Silakan pilih tanggal lain atau ketik *menu*.",
      newState: "SELECT_DATE" as BotState,
      context,
    }
  }

  const slotList = slots
    .map((s, i) => `${i + 1}. ${s.time}`)
    .join("\n")

  const interactive = {
    type: "list",
    header: { type: "text", text: formatDate(selectedDate) },
    body: { text: `⏰ *Pilih Jam Booking*\n\nSilakan pilih jam yang tersedia untuk tanggal yang telah Anda pilih.\n\nJam yang ditampilkan merupakan slot yang masih tersedia.\n\n${slotList}` },
    action: {
      button: "Pilih Jam",
      sections: [
        {
          title: "Jam Tersedia",
          rows: slots.map((s, i) => ({
            id: String(i + 1),
            title: s.time,
          })),
        },
      ],
    },
  }

  return {
    reply: `⏰ *Pilih Jam Booking*\n\nSilakan pilih jam yang tersedia untuk tanggal yang telah Anda pilih.\n\nJam yang ditampilkan merupakan slot yang masih tersedia.\n\n${slotList}\n\nKlik tombol *Pilih Jam* untuk melanjutkan.`,
    newState: "SELECT_TIME" as BotState,
    context: {
      ...context,
      date: selectedDate.toISOString(),
      dateIndex: idx,
    },
    interactive,
  }
}

export async function handleSelectTime({ businessId, message, context }: HandlerParams) {
  const lower = message.trim().toLowerCase()
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({ businessId, waNumber: "", message, state: "IDLE", context: {} })
  }

  if (!context.date) {
    return {
      reply: "Terjadi kesalahan. Silakan mulai lagi dengan mengetik *menu*.",
      newState: "IDLE" as BotState,
    }
  }

  const selectedDate = new Date(context.date)
  const slots = await getAvailableSlots(businessId, selectedDate, context.serviceDuration || 60)

  const idx = parseInt(message.trim()) - 1
  if (isNaN(idx) || idx < 0 || idx >= slots.length) {
    return {
      reply: "Pilihan tidak valid. Silakan ketik nomor jam yang tersedia atau ketik *menu*.",
      newState: "SELECT_TIME" as BotState,
      context,
    }
  }

  const selectedSlot = slots[idx]
  const stillAvailable = await isSlotAvailable(
    businessId,
    selectedSlot.datetime,
    context.serviceDuration || 60
  )

  if (!stillAvailable) {
    const remaining = slots.filter((s) => s.time !== selectedSlot.time)
    if (remaining.length === 0) {
      return {
        reply: "Slot sudah diambil orang lain. Tidak ada slot lain tersedia untuk tanggal ini. Silakan pilih tanggal lain atau ketik *menu*.",
        newState: "SELECT_DATE" as BotState,
        context: { serviceId: context.serviceId, serviceName: context.serviceName, serviceDuration: context.serviceDuration },
      }
    }
    const slotList = remaining.map((s, i) => `${i + 1}. ${s.time}`).join("\n")
    return {
      reply: `Maaf, slot tersebut sudah diambil. Silakan pilih jam lain:\n\n${slotList}\n\nKetik nomor jam atau *menu*.`,
      newState: "SELECT_TIME" as BotState,
      context,
    }
  }

  return {
    reply: "Terima kasih. Masukkan nama kamu untuk booking ini.",
    newState: "INPUT_NAME" as BotState,
    context: {
      ...context,
      time: selectedSlot.time,
    },
  }
}

export async function handleInputName({ businessId, waNumber, message, context }: HandlerParams) {
  const lower = message.trim().toLowerCase()
  if (["menu", "balik", "kembali"].includes(lower)) {
    return await handleIdle({ businessId, waNumber: "", message, state: "IDLE", context: {} })
  }

  const name = message.trim()
  if (name.length < 2 || /^\d+$/.test(name)) {
    return {
      reply: "Nama tidak valid. Masukkan minimal 2 karakter dan tidak boleh hanya angka.",
      newState: "INPUT_NAME" as BotState,
      context,
    }
  }

  const { serviceName, serviceDuration, date, time } = context
  const bookingDate = date ? new Date(date) : new Date()
  const dateStr = bookingDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const summary =
    `*Konfirmasi Booking*\n\n` +
    `Layanan: ${serviceName || "-"}\n` +
    `Tanggal: ${dateStr}\n` +
    `Jam: ${time || "-"}\n` +
    `Durasi: ${serviceDuration || "-"} menit\n` +
    `Nama: ${name}\n\n` +
    `Ketik *1* atau *YA* untuk konfirmasi.\n` +
    `Ketik *2* atau *TIDAK* untuk batalkan.`

  return {
    reply: summary,
    newState: "CONFIRM" as BotState,
    context: { ...context, customerName: name, customerWa: waNumber },
  }
}

export async function handleConfirm({ businessId, waNumber, message, context }: HandlerParams) {
  const lower = message.trim().toLowerCase()

  const isYes = ["1", "ya", "yes", "konfirmasi", "confirm"].includes(lower)
  const isNo = ["2", "tidak", "no", "batal", "cancel"].includes(lower)

  if (!isYes && !isNo) {
    return {
      reply: "Ketik *1* (YA) untuk konfirmasi atau *2* (TIDAK) untuk batalkan.",
      newState: "CONFIRM" as BotState,
      context,
    }
  }

  if (isNo) {
    return {
      reply: "Booking dibatalkan. Ketik *menu* untuk kembali.",
      newState: "IDLE" as BotState,
    }
  }

  if (!context.serviceId || !context.date || !context.time || !context.customerName) {
    return {
      reply: "Data booking tidak lengkap. Silakan mulai lagi dengan mengetik *menu*.",
      newState: "IDLE" as BotState,
    }
  }

  const bookingDate = new Date(context.date)
  const [hour, min] = context.time.split(":").map(Number)
  bookingDate.setHours(hour, min, 0, 0)

  const stillAvailable = await isSlotAvailable(
    businessId,
    bookingDate,
    context.serviceDuration || 60
  )

  if (!stillAvailable) {
    return {
      reply: "Maaf, slot sudah diambil orang lain. Silakan mulai lagi dengan mengetik *menu*.",
      newState: "IDLE" as BotState,
    }
  }

  const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  let customer = await prisma.customer.findUnique({
    where: { businessId_waNumber: { businessId, waNumber } },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: { businessId, name: context.customerName, waNumber },
    })
  }

  await prisma.booking.create({
    data: {
      businessId,
      serviceId: context.serviceId,
      customerId: customer.id,
      customerName: context.customerName,
      customerWa: waNumber,
      scheduledAt: bookingDate,
      durationMinutes: context.serviceDuration!,
      bookingCode,
      status: "PENDING",
    },
  })

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalBookings: { increment: 1 },
      lastBookingAt: new Date(),
    },
  })

  return {
    reply:
      `✅ *Booking Berhasil!*\n\n` +
      `Kode Booking: *${bookingCode}*\n\n` +
      `Gunakan kode ini untuk cek status atau perubahan.\n` +
      `Kami akan kirimkan reminder sebelum jadwal.\n\n` +
      `Terima kasih telah menggunakan layanan kami 🙏\n\n` +
      `Ketik *menu* untuk kembali.`,
    newState: "MAIN_MENU" as BotState,
  }
}

export const handlers: Record<
  BotState,
  (params: HandlerParams) => Promise<HandlerResult>
> = {
  IDLE: handleIdle,
  MAIN_MENU: handleMainMenu,
  BOOKING_START: handleBookingStart,
  SELECT_SERVICE: handleSelectService,
  SELECT_DATE: handleSelectDate,
  SELECT_TIME: handleSelectTime,
  INPUT_NAME: handleInputName,
  CONFIRM: handleConfirm,
  VIEW_BOOKING: handleViewBooking,
}