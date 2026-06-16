import { redis } from "@/lib/redis"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const businessId = searchParams.get("businessId")

  if (!businessId) {
    return new Response("businessId query parameter required", { status: 400 })
  }

  const channel = `business:${businessId}:events`

  const stream = new ReadableStream({
    start(controller) {
      const subscriber = redis.duplicate()

      subscriber.subscribe(channel, (err) => {
        if (err) {
          console.error("[SSE] Subscribe error:", err)
          controller.error(err)
          return
        }
      })

      subscriber.on("message", (_channel, message) => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
        } catch {
          // stream closed
        }
      })

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"))
        } catch {
          clearInterval(keepAlive)
        }
      }, 30000)

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive)
        subscriber.unsubscribe(channel).catch(() => {})
        subscriber.quit().catch(() => {})
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
