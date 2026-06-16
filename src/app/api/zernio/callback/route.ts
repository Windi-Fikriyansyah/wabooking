import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { decryptApiKey } from "@/lib/crypto"
import { ZernioClient } from "@/lib/zernio"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return NextResponse.redirect(`${baseUrl}/settings?zernio=error&reason=missing_params`)
    }

    const [businessId, profileId] = state.split(":")
    if (!businessId || !profileId) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return NextResponse.redirect(`${baseUrl}/settings?zernio=error&reason=invalid_state`)
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { zernioApiKey: true },
    })

    if (!business?.zernioApiKey) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      return NextResponse.redirect(`${baseUrl}/settings?zernio=error&reason=no_api_key`)
    }

    const apiKey = decryptApiKey(business.zernioApiKey)
    const zernio = new ZernioClient(apiKey)

    await zernio.exchangeOAuthCode("whatsapp", code, state, profileId)

    // Poll for connected WhatsApp account
    let waNumber: string | null = null
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const accounts = await zernio.getAccounts()
      const wa = accounts.find(
        (a) =>
          (a.platform === "whatsapp" || a.platform === "wa") &&
          a.status === "connected"
      )
      if (wa) {
        waNumber = wa.phone || wa.username || null
        break
      }
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioConnected: true,
        waNumber: waNumber,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectUrl = new URL("/settings", baseUrl)
    redirectUrl.searchParams.set("zernio", "connected")
    if (waNumber) {
      redirectUrl.searchParams.set("wa", waNumber)
    }

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error("[ZERNIO CALLBACK]", error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    return NextResponse.redirect(`${baseUrl}/settings?zernio=error`)
  }
}