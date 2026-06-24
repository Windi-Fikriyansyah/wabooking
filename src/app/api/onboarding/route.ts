import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { ZernioClient } from "@/lib/zernio"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { business, services, schedules, waNumber } = body

    if (!business?.name) {
      return NextResponse.json({ error: "Nama bisnis harus diisi" }, { status: 400 })
    }

    if (!services || services.length === 0) {
      return NextResponse.json({ error: "Minimal 1 layanan harus ditambahkan" }, { status: 400 })
    }

    const biz = await prisma.business.create({
      data: {
        ownerId: session.user.id,
        name: business.name,
        type: business.type || "",
        address: business.address || null,
        description: business.description || null,
        logoUrl: business.logoUrl || null,
        waNumber: waNumber || null,
        services: {
          create: services.map((s: any, i: number) => ({
            name: s.name,
            durationMinutes: s.duration || s.durationMinutes,
            price: s.price ? parseFloat(s.price) : null,
            sortOrder: i,
          })),
        },
        schedules: {
          create: (schedules || []).map((s: any) => ({
            dayOfWeek: s.dayOfWeek,
            isActive: s.isActive ?? true,
            openTime: s.openTime || "09:00",
            closeTime: s.closeTime || "17:00",
            slotIntervalMin: s.slotInterval || s.slotIntervalMin || 60,
            maxConcurrent: s.maxConcurrent || 1,
          })),
        },
      },
    })

    // Buat profile Zernio setelah business agar bisa pakai ID sebagai unique suffix
    if (process.env.ZERNIO_API_KEY) {
      try {
        const zernio = new ZernioClient()
        const profile = await zernio.createProfile(
          `${business.name} - ${biz.id}`,
          business.description || `Profile for ${business.name}`,
          "#4CAF50"
        )
        await prisma.business.update({
          where: { id: biz.id },
          data: { zernioProfileId: profile.id },
        })
        console.log("[ONBOARDING] Zernio profile created:", profile.id)
      } catch (err) {
        console.error("[ONBOARDING] Gagal buat profile Zernio:", err)
      }
    }

    return NextResponse.json(
      { message: "Onboarding selesai", businessId: biz.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("[ONBOARDING]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
