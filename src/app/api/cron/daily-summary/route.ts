import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const businesses = await prisma.business.findMany({
      where: {
        dailySummaryEnabled: true,
        zernioApiKey: { not: null },
        waNumber: { not: null },
      },
    })

    let sent = 0
    let skipped = 0

    for (const business of businesses) {
      try {
        if (!business.zernioApiKey || !business.waNumber) {
          skipped++
          continue
        }

        const bookingsToday = await prisma.booking.findMany({
          where: {
            businessId: business.id,
            scheduledAt: { gte: todayStart, lt: todayEnd },
          },
          include: { service: true },
        })

        if (bookingsToday.length === 0) {
          skipped++
          continue
        }

        const total = bookingsToday.length
        const confirmed = bookingsToday.filter((b) => b.status === "CONFIRMED").length
        const pending = bookingsToday.filter((b) => b.status === "PENDING").length
        const cancelled = bookingsToday.filter((b) => b.status === "CANCELLED").length
        const completed = bookingsToday.filter((b) => b.status === "COMPLETED").length

        const message = `📊 Ringkasan Harian ${business.name}\n${todayStart.toLocaleDateString("id-ID")}\n\nTotal Booking: ${total}\n✅ Dikonfirmasi: ${confirmed}\n⏳ Pending: ${pending}\n❌ Dibatalkan: ${cancelled}\n✔️ Selesai: ${completed}\n\nTerima kasih telah menggunakan WaBooking!`

        const apiKey = decryptApiKey(business.zernioApiKey)
        const zernio = new ZernioClient(apiKey)
        await zernio.sendText(business.waNumber, message)
        sent++
      } catch (err) {
        console.error(`[DAILY_SUMMARY] Failed for business ${business.id}:`, err)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      total: businesses.length,
    })
  } catch (error) {
    console.error("[DAILY_SUMMARY_CRON]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
