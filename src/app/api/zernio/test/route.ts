import { NextResponse } from "next/server"
import { ZernioClient } from "@/lib/zernio"

export async function POST(req: Request) {
  try {
    const zernio = new ZernioClient()
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
