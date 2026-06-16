import webpush from "web-push"
import { prisma } from "@/lib/db"

const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@wabooking.com"
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export async function sendPushNotification(
  businessId: string,
  title: string,
  body: string,
  icon?: string,
  url?: string
) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { businessId },
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title,
            body,
            icon: icon || "/icon-192.png",
            data: { url: url || "/dashboard" },
          })
        )
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
        throw err
      }
    })
  )

  return results
}
