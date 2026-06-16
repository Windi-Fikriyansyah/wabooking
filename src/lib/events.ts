import { redis } from "@/lib/redis"

export type EventType = "booking_new" | "booking_cancelled" | "booking_confirmed"

interface EventData {
  type: EventType
  data: Record<string, unknown>
  timestamp: string
}

export async function publishEvent(businessId: string, type: EventType, data: Record<string, unknown>) {
  const event: EventData = {
    type,
    data,
    timestamp: new Date().toISOString(),
  }

  await redis.publish(`business:${businessId}:events`, JSON.stringify(event))
}
