import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"

export async function POST(req: Request) {
  try {
    const { businessId, accountId } = await req.json()

    if (!businessId || !accountId) {
      return NextResponse.json(
        { error: "Business ID dan Account ID wajib diisi" },
        { status: 400 }
      )
    }

    const zernio = new ZernioClient()

    await zernio.disconnectAccount(accountId)

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioConnected: false,
        zernioAccountId: null,
        waNumber: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ZERNIO DISCONNECT WA]", error)
    return NextResponse.json(
      { error: "Gagal memutuskan koneksi WhatsApp" },
      { status: 500 }
    )
  }
}
