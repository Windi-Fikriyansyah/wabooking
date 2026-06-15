import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { businessId } = await req.json()

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID wajib diisi" },
        { status: 400 }
      )
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioApiKey: null,
        zernioConnected: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Koneksi Zernio berhasil diputuskan",
    })
  } catch (error) {
    console.error("[ZERNIO DISCONNECT]", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memutuskan koneksi Zernio" },
      { status: 500 }
    )
  }
}
