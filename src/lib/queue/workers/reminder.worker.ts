import { Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

export function createReminderWorker() {
  const worker = new Worker(
    "reminders",
    async (job) => {
      const { reminderId } = job.data

      const reminder = await prisma.reminder.findUnique({
        where: { id: reminderId },
        include: {
          booking: {
            include: {
              business: true,
              service: true,
            },
          },
        },
      })

      if (!reminder) {
        throw new Error(`Reminder ${reminderId} not found`)
      }

      const { booking } = reminder
      const business = booking.business

      if (booking.status !== "CONFIRMED") {
        await prisma.reminder.update({
          where: { id: reminderId },
          data: { status: "FAILED" },
        })
        return
      }

      if (!process.env.ZERNIO_API_KEY) {
        await prisma.reminder.update({
          where: { id: reminderId },
          data: { status: "FAILED" },
        })
        return
      }

      const zernio = new ZernioClient()

      const scheduledTime = booking.scheduledAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
      const scheduledDate = booking.scheduledAt.toLocaleDateString("id-ID")

      let message = ""
      if (reminder.type === "DAY_BEFORE") {
        const template = business.reminderTemplate
        if (template) {
          message = template
            .replace(/{nama_pelanggan}/g, booking.customerName)
            .replace(/{layanan}/g, booking.service.name)
            .replace(/{tanggal}/g, scheduledDate)
            .replace(/{jam}/g, scheduledTime)
            .replace(/{nama_bisnis}/g, business.name)
            .replace(/{kode_booking}/g, booking.bookingCode)
        } else {
          message = `Halo ${booking.customerName}, ini adalah pengingat untuk booking kamu besok:\n\nLayanan: ${booking.service.name}\nTanggal: ${scheduledDate}\nJam: ${scheduledTime}\n\nTerima kasih!`
        }
      } else if (reminder.type === "HOUR_BEFORE") {
        message = `Halo ${booking.customerName}, booking kamu dalam 1 jam:\n\nLayanan: ${booking.service.name}\nJam: ${scheduledTime}\n\nMohon tepat waktu!`
      }

      if (message && business.zernioAccountId) {
        await zernio.sendText(booking.customerWa, message, business.zernioAccountId)
      } else if (message) {
        console.error("[REMINDER_WORKER] No zernioAccountId for business", business.id)
        await prisma.reminder.update({
          where: { id: reminderId },
          data: { status: "FAILED" },
        })
        return
      }

      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "SENT", sentAt: new Date() },
      })
    },
    {
      connection: connection as any,
      concurrency: 5,
    }
  )

  worker.on("failed", async (job, err) => {
    console.error("[REMINDER_WORKER] Job failed:", job?.id, err)
    const reminderId = job?.data?.reminderId
    if (reminderId) {
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "FAILED" },
      }).catch(() => {})
    }
  })

  return worker
}
