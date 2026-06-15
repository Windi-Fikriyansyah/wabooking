import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const businessId = url.searchParams.get("businessId")

  const where: any = { business: { ownerId: session.user.id } }
  if (businessId) where.businessId = businessId

  const schedules = await prisma.schedule.findMany({
    where,
    orderBy: { dayOfWeek: "asc" },
  })

  return NextResponse.json(schedules)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { businessId, schedules } = body

    if (!businessId || !schedules || !Array.isArray(schedules)) {
      return NextResponse.json({ error: "Data jadwal tidak valid" }, { status: 400 })
    }

    await prisma.schedule.deleteMany({ where: { businessId } })

    const created = await Promise.all(
      schedules.map((s: any) =>
        prisma.schedule.create({
          data: {
            businessId,
            dayOfWeek: s.dayOfWeek,
            openTime: s.openTime,
            closeTime: s.closeTime,
            slotIntervalMin: s.slotIntervalMin || 60,
            maxConcurrent: s.maxConcurrent || 1,
            isActive: s.isActive ?? true,
          },
        })
      )
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("[SCHEDULE_POST]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
