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
      select: { zernioProfileId: true, name: true, description: true },
    })

    if (!business) {
      return NextResponse.json({ error: "Bisnis tidak ditemukan" }, { status: 404 })
    }

    const zernio = new ZernioClient()

    // Pakai profileId yang sudah tersimpan, atau buat baru
    let profileId = business.zernioProfileId
    if (!profileId) {
      const profile = await zernio.createProfile(
        `${business.name} - ${businessId}`,
        business.description || `Profile for ${business.name}`,
        "#4CAF50"
      )
      profileId = profile.id
      await prisma.business.update({
        where: { id: businessId },
        data: { zernioProfileId: profileId },
      })
    }

    if (!profileId) {
      return NextResponse.json({ error: "Gagal membuat profile Zernio" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const state = `${businessId}:${profileId}`
    const redirectUrl = `${baseUrl}/api/zernio/callback`
    const authUrl = await zernio.getConnectUrl("whatsapp", profileId, redirectUrl, state)

    return NextResponse.json({ authUrl, profileId })
  } catch (error) {
    console.error("[ZERNIO CONNECT WA]", error)
    return NextResponse.json(
      { error: "Gagal membuat tautan koneksi WhatsApp" },
      { status: 500 }
    )
  }
}
