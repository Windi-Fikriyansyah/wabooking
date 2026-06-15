import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { encryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"

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
    const status = await zernio.checkConnection()

    if (!status.connected) {
      return NextResponse.json(
        { error: status.error || "Gagal terhubung ke Zernio" },
        { status: 400 }
      )
    }

    const encrypted = encryptApiKey(apiKey)

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioApiKey: encrypted,
        zernioConnected: true,
      },
    })

    return NextResponse.json({
      success: true,
      connected: true,
      waNumber: status.waNumber,
      message: "Zernio berhasil terhubung",
    })
  } catch (error) {
    console.error("[ZERNIO SAVE]", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan koneksi Zernio" },
      { status: 500 }
    )
  }
}
