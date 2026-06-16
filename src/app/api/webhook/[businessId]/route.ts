import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"
import { isGlobalCommand } from "@/lib/bot"
import { handlers } from "@/lib/bot/handlers"
import type { BotState, BotContext } from "@/lib/bot"

const SESSION_TTL = 30 * 60 * 1000
const CONFIRM_TTL = 5 * 60 * 1000

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    })

    if (!business || !business.isActive) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const raw = await req.text()
    const body = JSON.parse(raw)

    // Abaikan event selain message.received
    if (body.event && body.event !== "message.received") {
      return NextResponse.json({ received: true })
    }

    // Respond cepat, proses sisanya async
    const res = NextResponse.json({ received: true })

    ;(async () => {
      try {
        const msg = body.message || body
        const sender = msg.sender || body.sender || {}
        const conversation = body.conversation || {}
        const account = body.account || {}

        const waNumber = sender.phoneNumber || sender.id || conversation.participantId || body.from || body.waNumber || ""
        const message = msg.text || msg.caption || ""

        if (!waNumber || !message) return

        if (!business.zernioApiKey) return
        const apiKey = decryptApiKey(business.zernioApiKey)

        const displayName = sender.name || conversation.participantName || body.senderName || body.name || waNumber
        const avatarUrl = sender.avatar || body.avatarUrl || null
        const channelId = account.id || body.channelId || conversation.id || waNumber

        await prisma.contact.upsert({
          where: { businessId_waNumber: { businessId, waNumber } },
          update: { displayName, avatarUrl, lastInteractionAt: new Date() },
          create: { businessId, waNumber, displayName, avatarUrl },
        })

        const contact = await prisma.contact.findUnique({
          where: { businessId_waNumber: { businessId, waNumber } },
          select: { id: true },
        })

        if (contact) {
          await prisma.contactChannel.upsert({
            where: { contactId_channelId: { contactId: contact.id, channelId } },
            update: {},
            create: { contactId: contact.id, channelId, channelType: account.platform || body.channelType || "whatsapp" },
          })
        }

        const now = new Date()
        let session = await prisma.botSession.findUnique({
          where: { businessId_waNumber: { businessId, waNumber } },
        })

        if (!session || session.expiresAt < now) {
          session = await prisma.botSession.upsert({
            where: { businessId_waNumber: { businessId, waNumber } },
            update: { state: "IDLE", contextData: {}, expiresAt: new Date(now.getTime() + SESSION_TTL) },
            create: { businessId, waNumber, state: "IDLE", contextData: {}, expiresAt: new Date(now.getTime() + SESSION_TTL) },
          })
        }

        const currentState = session.state as BotState
        const currentContext = (session.contextData || {}) as BotContext

        const globalCmd = isGlobalCommand(message)
        if (globalCmd) {
          if (globalCmd === "CANCEL") {
            await prisma.botSession.update({ where: { id: session.id }, data: { state: "IDLE", contextData: {} } })
            const zernio = new ZernioClient(apiKey)
            await zernio.sendText(waNumber, "Proses dibatalkan. Jika ingin booking lagi, ketik *booking*.").catch(() => {})
            return
          }
          if (globalCmd === "HELP") {
            const help = "*Daftar Perintah*\n\n• *booking* — Mulai booking baru\n• *status [kode]* — Cek status booking\n• *batal* / *cancel* — Batalkan proses\n• *bantuan* / *help* — Tampilkan ini"
            const zernio = new ZernioClient(apiKey)
            await zernio.sendText(waNumber, help).catch(() => {})
            return
          }
          if (globalCmd === "STATUS") {
            const code = message.trim().slice(7).trim().toUpperCase()
            const booking = await prisma.booking.findFirst({ where: { bookingCode: code, businessId }, include: { service: true } })
            let reply: string
            if (!booking) {
              reply = `Booking dengan kode *${code}* tidak ditemukan.`
            } else {
              const dateStr = booking.scheduledAt.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              const timeStr = booking.scheduledAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              reply = `*Status Booking*\n\nKode: ${booking.bookingCode}\nLayanan: ${booking.service.name}\nTanggal: ${dateStr}\nJam: ${timeStr}\nStatus: ${booking.status}`
            }
            const zernio = new ZernioClient(apiKey)
            await zernio.sendText(waNumber, reply).catch(() => {})
            return
          }
        }

        const handler = handlers[currentState]
        const result = handler
          ? await handler({ businessId, waNumber, message, state: currentState, context: currentContext })
          : await handlers.IDLE({ businessId, waNumber, message, state: "IDLE", context: {} })

        const ttl = result.newState === "CONFIRM" ? CONFIRM_TTL : SESSION_TTL
        await prisma.botSession.update({ where: { id: session.id }, data: { state: result.newState, contextData: (result.context || currentContext) as any, expiresAt: new Date(Date.now() + ttl) } })

        const zernio = new ZernioClient(apiKey)
        await zernio.sendText(waNumber, result.reply).catch((err: Error) => console.error("[WEBHOOK] Gagal kirim pesan:", err.message))
      } catch (e) {
        console.error("[WEBHOOK] Async error:", e)
      }
    })()

    return res
  } catch (error) {
    console.error("[WEBHOOK]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
