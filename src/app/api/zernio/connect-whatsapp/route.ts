import { NextResponse } from "next/server"
import { ZernioClient } from "@/lib/zernio"

export async function POST(req: Request) {
  try {
    const { businessId } = await req.json()
    if (!businessId) {
      return NextResponse.json({ error: "Business ID wajib diisi" }, { status: 400 })
    }

    const zernio = new ZernioClient()

    const profile = await zernio.getOrCreateProfile()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const state = `${businessId}:${profile.id}`
    const redirectUrl = `${baseUrl}/api/zernio/callback`
    const authUrl = await zernio.getConnectUrl("whatsapp", profile.id, redirectUrl, state)

    return NextResponse.json({ authUrl, profileId: profile.id })
  } catch (error) {
    console.error("[ZERNIO CONNECT WA]", error)
    return NextResponse.json(
      { error: "Gagal membuat tautan koneksi WhatsApp" },
      { status: 500 }
    )
  }
}
