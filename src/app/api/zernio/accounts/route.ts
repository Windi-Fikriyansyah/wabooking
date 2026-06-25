import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    if (!businessId) {
      return NextResponse.json({ error: "Business ID wajib diisi" }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { zernioAccountId: true, zernioProfileId: true },
    })

    const zernio = new ZernioClient()
    let accounts = await zernio.getAccounts("whatsapp", business?.zernioProfileId || undefined)
    if (accounts.length === 0) {
      accounts = await zernio.getAccounts(undefined, business?.zernioProfileId || undefined)
    }

    // Filter hanya akun milik tenant ini
    if (business?.zernioAccountId) {
      accounts = accounts.filter((a) => a.id === business.zernioAccountId)
    } else {
      accounts = []
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("[ZERNIO ACCOUNTS] error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil daftar akun Zernio" },
      { status: 500 }
    )
  }
}
