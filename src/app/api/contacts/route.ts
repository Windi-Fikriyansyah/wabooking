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
  const search = url.searchParams.get("search") || ""

  const where: any = { business: { ownerId: session.user.id } }
  if (businessId) where.businessId = businessId
  if (search.trim()) {
    where.OR = [
      { displayName: { contains: search.trim(), mode: "insensitive" } },
      { waNumber: { contains: search.trim() } },
    ]
  }

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      contactChannels: true,
    },
    orderBy: { lastInteractionAt: "desc" },
  })

  return NextResponse.json(contacts)
}
