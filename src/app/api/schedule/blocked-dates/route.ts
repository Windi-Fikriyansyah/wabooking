import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

async function getBusinessId(session: { user?: { id?: string } }) {
  if (!session?.user?.id) return undefined
  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  })
  return business?.id
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const businessId = await getBusinessId(session)
  if (!businessId) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  const blockedDates = await prisma.blockedDate.findMany({
    where: { businessId },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(blockedDates)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const businessId = await getBusinessId(session)
  if (!businessId) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  try {
    const { date, reason } = await req.json()

    if (!date) {
      return NextResponse.json({ error: "Tanggal harus diisi" }, { status: 400 })
    }

    const existing = await prisma.blockedDate.findFirst({
      where: { businessId, date: new Date(date) },
    })

    if (existing) {
      return NextResponse.json({ error: "Tanggal sudah diblokir" }, { status: 409 })
    }

    const blocked = await prisma.blockedDate.create({
      data: { businessId, date: new Date(date), reason },
    })

    return NextResponse.json(blocked, { status: 201 })
  } catch (error) {
    console.error("[BLOCKED_DATES_POST]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const businessId = await getBusinessId(session)
  if (!businessId) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "ID harus diisi" }, { status: 400 })
    }

    const blocked = await prisma.blockedDate.findFirst({
      where: { id, businessId },
    })

    if (!blocked) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })
    }

    await prisma.blockedDate.delete({ where: { id } })

    return NextResponse.json({ message: "Tanggal berhasil dihapus" })
  } catch (error) {
    console.error("[BLOCKED_DATES_DELETE]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
