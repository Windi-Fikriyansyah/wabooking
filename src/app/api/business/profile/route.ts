import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
  })

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  return NextResponse.json(business)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, type, address, description, logoUrl, timezone, waNumber, welcomeMessage, confirmTemplate, reminderTemplate } = body

    const business = await prisma.business.findFirst({
      where: { ownerId: session.user.id },
    })

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const updated = await prisma.business.update({
      where: { id: business.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(address !== undefined && { address }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(timezone && { timezone }),
        ...(waNumber !== undefined && { waNumber }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(confirmTemplate !== undefined && { confirmTemplate }),
        ...(reminderTemplate !== undefined && { reminderTemplate }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[BUSINESS PROFILE PATCH]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
