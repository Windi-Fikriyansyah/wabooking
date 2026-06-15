import { prisma } from "@/lib/db"
import { getAvailableSlots, getNext7Days, formatDate, isSlotAvailable } from "@/lib/bot/availability"
import type { BotState, BotContext } from "@/lib/bot/state-machine"

interface HandlerParams {
  businessId: string
  waNumber: string
  message: string
  state: BotState
  context: BotContext
}

export async function handleIdle({ businessId, waNumber }: HandlerParams) {
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  if (services.length === 0) {
    return {
      reply: "Maaf, belum ada layanan tersedia saat ini.",
      newState: "IDLE" as BotState,
    }
  }

  const serviceList = services
    .map((s, i) => `${i + 1}. ${s.name} — ${s.durationMinutes} menit${s.price ? ` (Rp${s.price})` : ""}`)
    .join("\n")

  const welcome = business?.welcomeMessage || "Halo! Selamat datang di layanan booking kami."
  const reply = `${welcome}\n\nSilakan pilih layanan:\n\n${serviceList}\n\nKetik nomor layanan yang dipilih.`

  return { reply, newState: "SELECT_SERVICE" as BotState }
}

export async function handleSelectService({ businessId, message, context }: HandlerParams) {
  const services = await prisma.service.findMany({
    where: { businessId, isActive: true },
    orderBy: { sortOrder: "asc" },
  })

  const idx = parseInt(message.trim()) - 1
  if (isNaN(idx) || idx < 0 || idx >= services.length) {
    return {
      reply: "Pilihan tidak valid. Silakan ketik nomor layanan yang tersedia.",
      newState: "SELECT_SERVICE" as BotState,
      context,
    }
  }

  const selected = services[idx]
  const days = getNext7Days()
  const dayList = days
    .map((d, i) => `${i + 1}. ${formatDate(d)}`)
    .join("\n")

  return {
    reply: `Kamu memilih *${selected.name}* (${selected.durationMinutes} menit).\n\nPilih tanggal:\n\n${dayList}\n\nKetik nomor tanggal.`,
    newState: "SELECT_DATE" as BotState,
    context: {
      serviceId: selected.id,
      serviceName: selected.name,
      serviceDuration: selected.durationMinutes,
    },
  }
}

export async function handleSelectDate({ businessId, message, context }: HandlerParams) {
  const idx = parseInt(message.trim()) - 1
  const days = getNext7Days()

  if (isNaN(idx) || idx < 0 || idx >= days.length) {
    return {
      reply: "Pilihan tidak valid. Silakan ketik nomor tanggal yang tersedia.",
      newState: "SELECT_DATE" as BotState,
      context,
    }
  }

  const selectedDate = days[idx]
  const slots = await getAvailableSlots(businessId, selectedDate, context.serviceDuration || 60)

  if (slots.length === 0) {
    return {
      reply: "Maaf, tidak ada slot tersedia untuk tanggal tersebut. Silakan pilih tanggal lain.",
      newState: "SELECT_DATE" as BotState,
      context,
    }
  }

  const slotList = slots
    .map((s, i) => `${i + 1}. ${s.time}`)
    .join("\n")

  return {
    reply: `Tanggal *${formatDate(selectedDate)}*. Pilih jam:\n\n${slotList}\n\nKetik nomor jam.`,
    newState: "SELECT_TIME" as BotState,
    context: {
      ...context,
      date: selectedDate.toISOString(),
      dateIndex: idx,
    },
  }
}

export async function handleSelectTime({ businessId, message, context }: HandlerParams) {
  if (!context.date) {
    return {
      reply: "Terjadi kesalahan. Silakan mulai lagi dengan mengetik *booking*.",
      newState: "IDLE" as BotState,
    }
  }

  const selectedDate = new Date(context.date)
  const slots = await getAvailableSlots(businessId, selectedDate, context.serviceDuration || 60)

  const idx = parseInt(message.trim()) - 1
  if (isNaN(idx) || idx < 0 || idx >= slots.length) {
    return {
      reply: "Pilihan tidak valid. Silakan ketik nomor jam yang tersedia.",
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
        reply: "Slot sudah diambil orang lain. Tidak ada slot lain tersedia untuk tanggal ini. Silakan pilih tanggal lain.",
        newState: "SELECT_DATE" as BotState,
        context: { serviceId: context.serviceId, serviceName: context.serviceName, serviceDuration: context.serviceDuration },
      }
    }
    const slotList = remaining.map((s, i) => `${i + 1}. ${s.time}`).join("\n")
    return {
      reply: `Maaf, slot tersebut sudah diambil. Silakan pilih jam lain:\n\n${slotList}\n\nKetik nomor jam.`,
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
      reply: "Booking dibatalkan. Jika ingin booking lagi, ketik *booking*.",
      newState: "IDLE" as BotState,
    }
  }

  if (!context.serviceId || !context.date || !context.time || !context.customerName) {
    return {
      reply: "Data booking tidak lengkap. Silakan mulai lagi dengan mengetik *booking*.",
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
      reply: "Maaf, slot sudah diambil orang lain. Silakan mulai lagi dengan mengetik *booking*.",
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
      `Terima kasih telah menggunakan layanan kami 🙏`,
    newState: "IDLE" as BotState,
  }
}

export const handlers: Record<
  BotState,
  (params: HandlerParams) => Promise<{ reply: string; newState: BotState; context?: any }>
> = {
  IDLE: handleIdle,
  SELECT_SERVICE: handleSelectService,
  SELECT_DATE: handleSelectDate,
  SELECT_TIME: handleSelectTime,
  INPUT_NAME: handleInputName,
  CONFIRM: handleConfirm,
}
