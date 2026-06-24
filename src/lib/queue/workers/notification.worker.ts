import { Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

export function createNotificationWorker() {
  const worker = new Worker(
    "notifications",
    async (job) => {
      const { businessId, type, customerName, serviceName, scheduledAt, bookingId, status } = job.data

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      })

      if (!business) {
        throw new Error(`Business ${businessId} not found`)
      }

      if (!process.env.ZERNIO_API_KEY) {
        throw new Error(`Business ${businessId} has no Zernio API key configured globally`)
      }

      if (!business.waNumber) {
        throw new Error(`Business ${businessId} has no WA number configured`)
      }

      if (!business.zernioAccountId) {
        throw new Error(`Business ${businessId} has no Zernio account connected`)
      }

      const zernio = new ZernioClient()

      let message = ""
      switch (type) {
        case "booking_new":
          message = `🔔 Booking Baru!\n${customerName} minta booking ${serviceName} pada ${scheduledAt}`
          break
        case "booking_cancelled":
          message = `❌ Booking Dibatalkan!\n${customerName} membatalkan booking ${serviceName} pada ${scheduledAt}`
          break
        case "booking_confirmed":
          message = `✅ Booking Dikonfirmasi!\n${customerName} dikonfirmasi untuk ${serviceName} pada ${scheduledAt}`
          break
        case "daily_summary":
          message = `📊 Ringkasan Hari Ini\n\n${customerName}`
          break
        default:
          message = `Notifikasi: ${customerName} - ${serviceName}`
      }

      await zernio.sendText(business.waNumber, message, business.zernioAccountId)
    },
    {
      connection: connection as any,
      concurrency: 5,
    }
  )

  worker.on("failed", (job, err) => {
    console.error("[NOTIFICATION_WORKER] Job failed:", job?.id, err)
  })

  return worker
}
