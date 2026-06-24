import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    include: {
      services: { where: { isActive: true } },
      _count: { select: { bookings: true, customers: true } },
    },
  })

  return NextResponse.json(businesses)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, name, type, address, description, logoUrl, timezone, waNumber, reminderTemplate, confirmTemplate, welcomeMessage } = body

    const business = await prisma.business.findFirst({
      where: { id, ownerId: session.user.id },
    })

    if (!business) {
      return NextResponse.json({ error: "Bisnis tidak ditemukan" }, { status: 404 })
    }

    const updated = await prisma.business.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(address !== undefined && { address }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(timezone && { timezone }),
        ...(waNumber !== undefined && { waNumber }),
        ...(reminderTemplate !== undefined && { reminderTemplate }),
        ...(confirmTemplate !== undefined && { confirmTemplate }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[BUSINESS_PATCH]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
