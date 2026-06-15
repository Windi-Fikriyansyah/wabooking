import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"

export async function POST(req: Request) {
  try {
    const now = new Date()
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

    const reminders = await prisma.reminder.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: now },
      },
      include: {
        booking: {
          include: {
            business: true,
            service: true,
          },
        },
      },
    })

    let sent = 0
    let failed = 0

    for (const reminder of reminders) {
      const { booking } = reminder
      const business = booking.business

      if (!business.zernioApiKey) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED", sentAt: now },
        })
        failed++
        continue
      }

      try {
        const apiKey = decryptApiKey(business.zernioApiKey)
        const zernio = new ZernioClient(apiKey)

        let message = ""
        if (reminder.type === "DAY_BEFORE") {
          message = `Halo ${booking.customerName}, ini adalah pengingat untuk booking kamu besok:\n\nLayanan: ${booking.service.name}\nTanggal: ${booking.scheduledAt.toLocaleDateString("id-ID")}\nJam: ${booking.scheduledAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}\n\nTerima kasih!`
        } else if (reminder.type === "HOUR_BEFORE") {
          message = `Halo ${booking.customerName}, booking kamu dalam 1 jam:\n\nLayanan: ${booking.service.name}\nJam: ${booking.scheduledAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}\n\nMohon tepat waktu!`
        }

        if (message) {
          await zernio.sendText(booking.customerWa, message)
        }

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "SENT", sentAt: now },
        })
        sent++
      } catch (err) {
        console.error("[REMINDERS] Gagal kirim reminder:", err)
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED", sentAt: now },
        })
        failed++
      }
    }

    const pendingBookingsNextHour = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        scheduledAt: { gte: now, lte: inOneHour },
        reminders: { none: { type: "HOUR_BEFORE" } },
      },
      include: { business: true, service: true },
    })

    for (const booking of pendingBookingsNextHour) {
      await prisma.reminder.create({
        data: {
          bookingId: booking.id,
          type: "HOUR_BEFORE",
          scheduledAt: booking.scheduledAt,
        },
      })
    }

    const pendingBookingsTomorrow = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        scheduledAt: { gte: tomorrow, lt: tomorrowEnd },
        reminders: { none: { type: "DAY_BEFORE" } },
      },
      include: { business: true },
    })

    for (const booking of pendingBookingsTomorrow) {
      const dayBefore = new Date(booking.scheduledAt)
      dayBefore.setDate(dayBefore.getDate() - 1)
      dayBefore.setHours(9, 0, 0, 0)

      await prisma.reminder.create({
        data: {
          bookingId: booking.id,
          type: "DAY_BEFORE",
          scheduledAt: dayBefore,
        },
      })
    }

    return NextResponse.json({ sent, failed, processed: reminders.length })
  } catch (error) {
    console.error("[REMINDERS_CRON]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
