import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { reminderQueue } from "@/lib/queue"
import { redis } from "@/lib/redis"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000)

    const reminders = await prisma.reminder.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: fiveMinutesLater },
      },
      include: {
        booking: {
          select: { status: true },
        },
      },
    })

    let queued = 0
    let skipped = 0

    for (const reminder of reminders) {
      if (reminder.booking.status !== "CONFIRMED") {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { status: "FAILED" },
        })
        skipped++
        continue
      }

      await reminderQueue.add(
        "send-reminder",
        { reminderId: reminder.id },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        }
      )

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "PROCESSING" },
      })
      queued++
    }

    return NextResponse.json({
      success: true,
      queued,
      skipped,
      total: reminders.length,
    })
  } catch (error) {
    console.error("[CRON_REMINDERS]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
