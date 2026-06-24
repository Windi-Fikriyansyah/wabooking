import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"

export async function POST(req: Request) {
  try {
    const { businessId } = await req.json()

    if (!businessId) {
      return NextResponse.json({ error: "Business ID wajib diisi" }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { zernioAccountId: true },
    })

    if (!business?.zernioAccountId) {
      return NextResponse.json({ connected: false, error: "Belum ada akun WhatsApp terhubung" })
    }

    const zernio = new ZernioClient()
    const status = await zernio.checkConnection(business.zernioAccountId)

    return NextResponse.json(status)
  } catch (error) {
    console.error("[ZERNIO TEST]", error)
    return NextResponse.json(
      { error: "Gagal mengetes koneksi Zernio" },
      { status: 500 }
    )
  }
}
