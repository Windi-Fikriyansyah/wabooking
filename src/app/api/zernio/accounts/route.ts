import { NextResponse } from "next/server"
import { ZernioClient } from "@/lib/zernio"

export async function GET(req: Request) {
  try {
    const zernio = new ZernioClient()

    // Try with platform filter first, then without
    let accounts = await zernio.getAccounts("whatsapp")
    if (accounts.length === 0) {
      accounts = await zernio.getAccounts()
    }

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
