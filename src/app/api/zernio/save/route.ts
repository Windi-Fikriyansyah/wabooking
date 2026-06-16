import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { encryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"

const APP_URL = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(req: Request) {
  try {
    const { apiKey, businessId } = await req.json()

    if (!apiKey || !businessId) {
      return NextResponse.json(
        { error: "API Key dan Business ID wajib diisi" },
        { status: 400 }
      )
    }

    const zernio = new ZernioClient(apiKey)
    const validation = await zernio.validateApiKey()

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "API Key tidak valid" },
        { status: 400 }
      )
    }

    const connection = await zernio.checkConnection()
    const encrypted = encryptApiKey(apiKey)

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioApiKey: encrypted,
        zernioConnected: connection.connected,
        waNumber: connection.waNumber || null,
      },
    })

    // Register webhook ke Zernio
    const webhookUrl = `${APP_URL.replace(/\/+$/, "")}/api/webhook/${businessId}`
    const existing = await zernio.listWebhooks()
    const already = existing.find((w) => w.url === webhookUrl)
    if (!already) {
      await zernio.registerWebhook(webhookUrl)
    }

    return NextResponse.json({
      success: true,
      connected: connection.connected,
      waNumber: connection.waNumber || null,
      message: connection.connected
        ? "Zernio berhasil terhubung"
        : "API Key tersimpan, namun belum ada nomor WhatsApp terhubung di akun Zernio",
    })
  } catch (error) {
    console.error("[ZERNIO SAVE]", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan koneksi Zernio" },
      { status: 500 }
    )
  }
}
