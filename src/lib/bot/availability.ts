import { prisma } from "@/lib/db"

interface TimeSlot {
  time: string
  datetime: Date
}

export async function getAvailableSlots(
  businessId: string,
  date: Date,
  durationMinutes: number
): Promise<TimeSlot[]> {
  const dayOfWeek = date.getDay()
  const schedule = await prisma.schedule.findUnique({
    where: { businessId_dayOfWeek: { businessId, dayOfWeek } },
  })

  if (!schedule || !schedule.isActive) return []

  const blockedDate = await prisma.blockedDate.findFirst({
    where: {
      businessId,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    },
  })
  if (blockedDate) return []

  const [openHour, openMin] = schedule.openTime.split(":").map(Number)
  const [closeHour, closeMin] = schedule.closeTime.split(":").map(Number)

  const openMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin
  const slotInterval = schedule.slotIntervalMin

  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      scheduledAt: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { scheduledAt: true, durationMinutes: true },
  })

  const slots: TimeSlot[] = []

  for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += slotInterval) {
    const hour = Math.floor(m / 60)
    const min = m % 60
    const slotDate = new Date(date)
    slotDate.setHours(hour, min, 0, 0)

    const slotEnd = new Date(slotDate.getTime() + durationMinutes * 60 * 1000)

    const conflicting = existingBookings.some((b) => {
      const bStart = new Date(b.scheduledAt).getTime()
      const bEnd = bStart + b.durationMinutes * 60 * 1000
      return slotDate.getTime() < bEnd && slotEnd.getTime() > bStart
    })

    if (!conflicting) {
      const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
      slots.push({ time: timeStr, datetime: slotDate })
    }
  }

  return slots
}

export async function isSlotAvailable(
  businessId: string,
  datetime: Date,
  durationMinutes: number
): Promise<boolean> {
  const slots = await getAvailableSlots(businessId, datetime, durationMinutes)
  return slots.some((s) => s.datetime.getTime() === datetime.getTime())
}

export function getNext7Days(): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  return days
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}
