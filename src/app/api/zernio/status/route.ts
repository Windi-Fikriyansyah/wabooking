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
      select: { zernioConnected: true, waNumber: true },
    })

    if (!business) {
      return NextResponse.json({
        hasApiKey: false,
        connected: false,
        waNumber: null,
      })
    }

    // Report DB state first, then try live check without overwriting
    let liveConnected = business.zernioConnected
    let liveWaNumber: string | null = business.waNumber

    try {
      const zernio = new ZernioClient()
      const status = await zernio.checkConnection()
      liveConnected = status.connected
      liveWaNumber = status.waNumber || null

      // Only update DB if we detect a NEW connection (don't un-connect)
      if (liveConnected && !business.zernioConnected) {
        await prisma.business.update({
          where: { id: businessId },
          data: { zernioConnected: true, waNumber: liveWaNumber },
        })
      }
    } catch {
      // Live check will reflect stale data; DB state is authoritative
    }

    return NextResponse.json({
      hasApiKey: true,
      connected: business.zernioConnected || liveConnected,
      waNumber: business.waNumber || liveWaNumber,
    })
  } catch (error) {
    console.error("[ZERNIO STATUS]", error)
    return NextResponse.json(
      { hasApiKey: false, connected: false, waNumber: null, error: "Gagal mengecek status koneksi Zernio" },
      { status: 500 }
    )
  }
}
