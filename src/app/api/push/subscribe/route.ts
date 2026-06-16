import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { businessId, endpoint, p256dh, auth: authKey } = await req.json()

    if (!businessId || !endpoint || !p256dh || !authKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, ownerId: session.user.id },
    })

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (existing) {
      return NextResponse.json({ message: "Already subscribed" })
    }

    await prisma.pushSubscription.create({
      data: {
        businessId,
        endpoint,
        p256dh,
        auth: authKey,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[PUSH_SUBSCRIBE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
