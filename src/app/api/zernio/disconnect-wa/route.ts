import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { zernioApiKey: true },
    })

    if (!business?.zernioApiKey) {
      return NextResponse.json({ error: "API Key belum tersimpan" }, { status: 400 })
    }

    const apiKey = decryptApiKey(business.zernioApiKey)
    const zernio = new ZernioClient(apiKey)

    await zernio.disconnectAccount(accountId)

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioConnected: false,
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