import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { notificationQueue, reminderQueue } from "@/lib/queue"
import { publishEvent } from "@/lib/events"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const { status } = await req.json()

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
    }

    const booking = await prisma.booking.findFirst({
      where: { id, business: { ownerId: session.user.id } },
      include: { service: true, business: true },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { service: true, customer: true },
    })

    // Kirim notifikasi ke pemilik bisnis
    const scheduledTime = booking.scheduledAt.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    })

    if (status === "CONFIRMED") {
      // Notifikasi konfirmasi ke pemilik
      await notificationQueue.add("booking-status", {
        businessId: booking.businessId,
        type: "booking_confirmed",
        customerName: booking.customerName,
        serviceName: booking.service.name,
        scheduledAt: scheduledTime,
        bookingId: booking.id,
        status,
      })

      // Buat reminder DAY_BEFORE (24 jam sebelum booking)
      const reminderTime = new Date(booking.scheduledAt.getTime() - 24 * 60 * 60 * 1000)
      if (reminderTime > new Date()) {
        await prisma.reminder.create({
          data: {
            bookingId: booking.id,
            type: "DAY_BEFORE",
            scheduledAt: reminderTime,
          },
        })
      }

      // Buat reminder HOUR_BEFORE (1 jam sebelum booking)
      const hourBeforeTime = new Date(booking.scheduledAt.getTime() - 60 * 60 * 1000)
      if (hourBeforeTime > new Date()) {
        await prisma.reminder.create({
          data: {
            bookingId: booking.id,
            type: "HOUR_BEFORE",
            scheduledAt: hourBeforeTime,
          },
        })
      }

      // Publish event SSE
      await publishEvent(booking.businessId, "booking_confirmed", {
        id: booking.id,
        customerName: booking.customerName,
        serviceName: booking.service.name,
        scheduledAt: booking.scheduledAt.toISOString(),
      })
    }

    if (status === "CANCELLED") {
      await notificationQueue.add("booking-status", {
        businessId: booking.businessId,
        type: "booking_cancelled",
        customerName: booking.customerName,
        serviceName: booking.service.name,
        scheduledAt: scheduledTime,
        bookingId: booking.id,
        status,
      })

      // Cancel pending reminders
      await prisma.reminder.updateMany({
        where: { bookingId: booking.id, status: "PENDING" },
        data: { status: "FAILED" },
      })

      await publishEvent(booking.businessId, "booking_cancelled", {
        id: booking.id,
        customerName: booking.customerName,
        serviceName: booking.service.name,
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[BOOKING_STATUS_PUT]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
