import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"
import { syncContactsFromZernio } from "@/lib/sync-contacts"

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

    const zernio = new ZernioClient()
    const profile = await zernio.getOrCreateProfile()

    await zernio.exchangeOAuthCode("whatsapp", code, state, profile.id)

    // Poll for connected WhatsApp account
    let waNumber: string | null = null
    let accountId: string | null = null
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
        accountId = wa.id
        break
      }
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioConnected: true,
        zernioAccountId: accountId,
        waNumber: waNumber,
      },
    })

    // Register global webhook if not exists
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const globalWebhookUrl = `${baseUrl.replace(/\/+$/, "")}/api/webhook`
    const existing = await zernio.listWebhooks()
    const already = existing.find((w) => w.url === globalWebhookUrl)
    if (!already) {
      await zernio.registerWebhook(globalWebhookUrl)
    }

    // Sync contacts from Zernio
    syncContactsFromZernio(businessId).catch((err) =>
      console.error("[ZERNIO CALLBACK] Gagal sync kontak:", err)
    )

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
