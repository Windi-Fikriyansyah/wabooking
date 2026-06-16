import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

const PAGE_SIZE = 20

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const businessId = url.searchParams.get("businessId")
  const search = url.searchParams.get("search") || ""
  const limit = Math.min(Number(url.searchParams.get("limit")) || PAGE_SIZE, 100)
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0)

  const where: any = { business: { ownerId: session.user.id } }
  if (businessId) where.businessId = businessId
  if (search.trim()) {
    where.OR = [
      { displayName: { contains: search.trim(), mode: "insensitive" } },
      { waNumber: { contains: search.trim() } },
    ]
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: { contactChannels: true },
      orderBy: { lastInteractionAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.contact.count({ where }),
  ])

  return NextResponse.json({
    contacts,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  })
}
