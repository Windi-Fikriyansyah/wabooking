import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  })

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [todayBookings, pendingBookings, monthBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId: business.id, scheduledAt: { gte: todayStart, lte: todayEnd } },
      include: { service: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.booking.count({
      where: { businessId: business.id, status: "PENDING" },
    }),
    prisma.booking.findMany({
      where: { businessId: business.id, scheduledAt: { gte: monthStart, lte: monthEnd } },
      include: { service: true },
    }),
  ])

  const revenue = monthBookings
    .filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED")
    .reduce((sum, b) => sum + (Number(b.service.price) || 0), 0)

  const bookingDates = await prisma.booking.findMany({
    where: { businessId: business.id, scheduledAt: { gte: monthStart, lte: monthEnd } },
    select: { scheduledAt: true },
  })

  const datesWithBookings = [
    ...new Set(bookingDates.map((b) => new Date(b.scheduledAt).toISOString().split("T")[0])),
  ]

  return NextResponse.json({
    totalBookingsToday: todayBookings.length,
    pendingBookings,
    bookingsThisMonth: monthBookings.length,
    estimatedRevenue: revenue,
    todayBookings,
    datesWithBookings,
  })
}
