import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { endpoint } = await req.json()

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUSH_UNSUBSCRIBE]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
