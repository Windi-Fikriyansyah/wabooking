import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID wajib diisi" },
        { status: 400 }
      )
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { zernioApiKey: true, zernioConnected: true },
    })

    if (!business || !business.zernioApiKey) {
      return NextResponse.json({
        connected: false,
        message: "Belum terhubung ke Zernio",
      })
    }

    const apiKey = decryptApiKey(business.zernioApiKey)
    const zernio = new ZernioClient(apiKey)
    const status = await zernio.checkConnection()

    if (status.connected !== business.zernioConnected) {
      await prisma.business.update({
        where: { id: businessId },
        data: { zernioConnected: status.connected },
      })
    }

    return NextResponse.json({
      connected: status.connected,
      waNumber: status.waNumber,
    })
  } catch (error) {
    console.error("[ZERNIO STATUS]", error)
    return NextResponse.json(
      { error: "Gagal mengecek status koneksi Zernio" },
      { status: 500 }
    )
  }
}
