import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
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
      select: { zernioApiKey: true },
    })

    if (!business?.zernioApiKey) {
      return NextResponse.json({ error: "API Key belum tersimpan" }, { status: 400 })
    }

    const apiKey = decryptApiKey(business.zernioApiKey)
    const zernio = new ZernioClient(apiKey)

    // Try with platform filter first, then without
    let accounts = await zernio.getAccounts("whatsapp")
    if (accounts.length === 0) {
      accounts = await zernio.getAccounts()
    }

    // Log for debugging
    console.log("[ZERNIO ACCOUNTS] raw accounts:", JSON.stringify(accounts))

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("[ZERNIO ACCOUNTS] error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil daftar akun Zernio" },
      { status: 500 }
    )
  }
}