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
  const status = url.searchParams.get("status")
  const date = url.searchParams.get("date")

  const where: any = { business: { ownerId: session.user.id } }
  if (businessId) where.businessId = businessId
  if (status) where.status = status
  if (date) {
    const dayStart = new Date(date)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    where.scheduledAt = { gte: dayStart, lt: dayEnd }
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { service: true, customer: true },
    orderBy: { scheduledAt: "desc" },
  })

  return NextResponse.json(bookings)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { businessId, serviceId, customerName, customerWa, scheduledAt, notes } = body

    if (!businessId || !serviceId || !customerName || !customerWa || !scheduledAt) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 })
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 })
    }

    const bookingCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    let customer = await prisma.customer.findUnique({
      where: { businessId_waNumber: { businessId, waNumber: customerWa } },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: { businessId, name: customerName, waNumber: customerWa },
      })
    }

    const booking = await prisma.booking.create({
      data: {
        businessId,
        serviceId,
        customerId: customer.id,
        customerName,
        customerWa,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: service.durationMinutes,
        bookingCode,
        notes,
      },
      include: { service: true },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("[BOOKINGS_POST]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: "ID booking harus diisi" }, { status: 400 })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { ...(status && { status }), ...(notes !== undefined && { notes }) },
      include: { service: true },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error("[BOOKINGS_PATCH]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
