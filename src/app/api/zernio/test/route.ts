import { NextResponse } from "next/server"
import { decryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { businessId } = await req.json()

    if (!businessId) {
      return NextResponse.json({ error: "Business ID wajib diisi" }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { zernioApiKey: true },
    })

    if (!business?.zernioApiKey) {
      return NextResponse.json({ error: "Belum terhubung ke Zernio" }, { status: 400 })
    }

    const apiKey = decryptApiKey(business.zernioApiKey)
    const zernio = new ZernioClient(apiKey)
    const status = await zernio.checkConnection()

    return NextResponse.json(status)
  } catch (error) {
    console.error("[ZERNIO TEST]", error)
    return NextResponse.json(
      { error: "Gagal mengetes koneksi Zernio" },
      { status: 500 }
    )
  }
}
