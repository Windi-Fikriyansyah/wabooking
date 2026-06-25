import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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
      select: { zernioConnected: true, waNumber: true, zernioAccountId: true, zernioProfileId: true },
    })

    if (!business || !business.zernioAccountId) {
      return NextResponse.json({
        hasApiKey: true,
        connected: false,
        waNumber: null,
      })
    }

    let liveConnected = false
    let liveWaNumber: string | null = null

    try {
      const zernio = new ZernioClient()
      const status = await zernio.checkConnection(business.zernioAccountId, business.zernioProfileId || undefined)
      liveConnected = status.connected
      liveWaNumber = status.waNumber || null

      // Update DB only with this tenant's actual data
      await prisma.business.update({
        where: { id: businessId },
        data: {
          zernioConnected: liveConnected,
          waNumber: liveWaNumber,
        },
      })
    } catch {
      // Live check failed; DB state is stale
    }

    return NextResponse.json({
      hasApiKey: true,
      connected: liveConnected || business.zernioConnected,
      waNumber: liveWaNumber || business.waNumber,
    })
  } catch (error) {
    console.error("[ZERNIO STATUS]", error)
    return NextResponse.json(
      { hasApiKey: true, connected: false, waNumber: null, error: "Gagal mengecek status koneksi Zernio" },
      { status: 500 }
    )
  }
}
