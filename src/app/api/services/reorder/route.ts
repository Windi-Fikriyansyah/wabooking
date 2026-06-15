import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { items } = await req.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
    }

    const ownerId = session.user!.id
    await Promise.all(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.service.updateMany({
          where: { id: item.id, business: { ownerId } },
          data: { sortOrder: item.sortOrder },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_REORDER]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
