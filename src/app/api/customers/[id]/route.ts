import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const businessId = url.searchParams.get("businessId")

  if (!businessId) {
    return NextResponse.json({ error: "businessId diperlukan" }, { status: 400 })
  }

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, businessId, business: { ownerId: session.user.id } },
    include: {
      bookings: {
        include: { service: true },
        orderBy: { scheduledAt: "desc" },
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const bookingsThisMonth = customer.bookings.filter(
    (b) => new Date(b.scheduledAt) >= startOfMonth
  ).length

  let avgFrequency: number | null = null
  const sortedBookings = [...customer.bookings]
    .filter((b) => b.status !== "CANCELLED")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  if (sortedBookings.length >= 2) {
    let totalDays = 0
    for (let i = 1; i < sortedBookings.length; i++) {
      totalDays +=
        (new Date(sortedBookings[i].scheduledAt).getTime() -
          new Date(sortedBookings[i - 1].scheduledAt).getTime()) /
        (1000 * 60 * 60 * 24)
    }
    avgFrequency = Math.round(totalDays / (sortedBookings.length - 1))
  }

  return NextResponse.json({
    ...customer,
    stats: {
      totalBookings: customer.totalBookings,
      bookingsThisMonth,
      avgFrequency,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { notes, businessId } = body

  if (!businessId) {
    return NextResponse.json({ error: "businessId diperlukan" }, { status: 400 })
  }

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, businessId, business: { ownerId: session.user.id } },
  })

  if (!customer) {
    return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 })
  }

  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: { notes },
  })

  return NextResponse.json(updated)
}
