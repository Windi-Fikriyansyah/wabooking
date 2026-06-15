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

  const where: any = { business: { ownerId: session.user.id } }
  if (businessId) where.businessId = businessId

  const services = await prisma.service.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(services)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { businessId, name, description, durationMinutes, price } = body

    if (!businessId || !name || !durationMinutes) {
      return NextResponse.json({ error: "Nama dan durasi harus diisi" }, { status: 400 })
    }

    const maxSort = await prisma.service.findFirst({
      where: { businessId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    })

    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description,
        durationMinutes,
        price: price ? parseFloat(price) : null,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_POST]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, name, description, durationMinutes, price, isActive, sortOrder } = body

    if (!id) {
      return NextResponse.json({ error: "ID layanan harus diisi" }, { status: 400 })
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(durationMinutes && { durationMinutes }),
        ...(price !== undefined && { price: price ? parseFloat(price) : null }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error("[SERVICES_PATCH]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "ID layanan harus diisi" }, { status: 400 })
    }

    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ message: "Layanan berhasil dihapus" })
  } catch (error) {
    console.error("[SERVICES_DELETE]", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
