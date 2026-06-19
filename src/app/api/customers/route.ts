import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const businessId = url.searchParams.get("businessId")
  const search = url.searchParams.get("search") || ""
  const page = parseInt(url.searchParams.get("page") || "1")
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20")

  if (!businessId) {
    return NextResponse.json({ error: "businessId diperlukan" }, { status: 400 })
  }

  const where: Prisma.CustomerWhereInput = {
    businessId,
    business: { ownerId: session.user.id },
  }

  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { waNumber: { contains: search.trim() } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({ customers, total, page, pageSize })
}
