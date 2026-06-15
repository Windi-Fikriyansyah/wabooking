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

    const body = await req.json()
    const waNumber = body.from || body.waNumber
    const message = body.message?.text || body.message || body.text || ""
    const messageType = body.message?.type || body.type || "text"

    if (!waNumber || !message) {
      return NextResponse.json({ error: "waNumber and message required" }, { status: 400 })
    }

    const apiKey = business.zernioApiKey ? decryptApiKey(business.zernioApiKey) : null

    const now = new Date()
    let session = await prisma.botSession.findUnique({
      where: { businessId_waNumber: { businessId, waNumber } },
    })

    if (!session || session.expiresAt < now) {
      session = await prisma.botSession.upsert({
        where: { businessId_waNumber: { businessId, waNumber } },
        update: {
          state: "IDLE",
          contextData: {},
          expiresAt: new Date(now.getTime() + SESSION_TTL),
        },
        create: {
          businessId,
          waNumber,
          state: "IDLE",
          contextData: {},
          expiresAt: new Date(now.getTime() + SESSION_TTL),
        },
      })
    }

    const currentState = session.state as BotState
    const currentContext = (session.contextData || {}) as BotContext

    const globalCmd = isGlobalCommand(message)
    if (globalCmd) {
      if (globalCmd === "CANCEL") {
        await prisma.botSession.update({
          where: { id: session.id },
          data: { state: "IDLE", contextData: {} },
        })
        const reply = "Proses dibatalkan. Jika ingin booking lagi, ketik *booking*."
        if (apiKey) {
          const zernio = new ZernioClient(apiKey)
          await zernio.sendText(waNumber, reply).catch(() => {})
        }
        return NextResponse.json({ reply })
      }

      if (globalCmd === "HELP") {
        const help =
          "*Daftar Perintah*\n\n" +
          "• *booking* — Mulai booking baru\n" +
          "• *status [kode]* — Cek status booking\n" +
          "• *batal* / *cancel* — Batalkan proses\n" +
          "• *bantuan* / *help* — Tampilkan ini"
        if (apiKey) {
          const zernio = new ZernioClient(apiKey)
          await zernio.sendText(waNumber, help).catch(() => {})
        }
        return NextResponse.json({ reply: help })
      }

      if (globalCmd === "STATUS") {
        const code = message.trim().slice(7).trim().toUpperCase()
        const booking = await prisma.booking.findFirst({
          where: { bookingCode: code, businessId },
          include: { service: true },
        })
        let reply: string
        if (!booking) {
          reply = `Booking dengan kode *${code}* tidak ditemukan.`
        } else {
          const dateStr = booking.scheduledAt.toLocaleDateString("id-ID", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })
          const timeStr = booking.scheduledAt.toLocaleTimeString("id-ID", {
            hour: "2-digit", minute: "2-digit",
          })
          reply =
            `*Status Booking*\n\n` +
            `Kode: ${booking.bookingCode}\n` +
            `Layanan: ${booking.service.name}\n` +
            `Tanggal: ${dateStr}\n` +
            `Jam: ${timeStr}\n` +
            `Status: ${booking.status}`
        }
        if (apiKey) {
          const zernio = new ZernioClient(apiKey)
          await zernio.sendText(waNumber, reply).catch(() => {})
        }
        return NextResponse.json({ reply })
      }
    }

    const handler = handlers[currentState]
    let result: { reply: string; newState: BotState; context?: BotContext }

    if (handler) {
      result = await handler({
        businessId,
        waNumber,
        message,
        state: currentState,
        context: currentContext,
      })
    } else {
      result = await handlers.IDLE({
        businessId,
        waNumber,
        message,
        state: "IDLE",
        context: {},
      })
    }

    const ttl = result.newState === "CONFIRM" ? CONFIRM_TTL : SESSION_TTL

    await prisma.botSession.update({
      where: { id: session.id },
      data: {
        state: result.newState,
        contextData: (result.context || currentContext) as any,
        expiresAt: new Date(Date.now() + ttl),
      },
    })

    if (apiKey) {
      const zernio = new ZernioClient(apiKey)
      await zernio.sendText(waNumber, result.reply).catch((err) => {
        console.error("[WEBHOOK] Gagal kirim pesan:", err.message)
      })
    }

    return NextResponse.json({ reply: result.reply })
  } catch (error) {
    console.error("[WEBHOOK]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
