import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { ZernioClient } from "@/lib/zernio"
import { syncContactsFromZernio } from "@/lib/sync-contacts"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const urlAccountId = searchParams.get("accountId")
    const urlConnected = searchParams.get("connected")

    // Standard redirect dari Zernio langsung bawa accountId
    if (urlAccountId && urlConnected) {
      const profileId = searchParams.get("profileId") || ""
      const business = await prisma.business.findFirst({
        where: { zernioProfileId: profileId },
        select: { id: true },
      })
      if (business) {
        const waNumber = searchParams.get("username") || null
        await prisma.business.update({
          where: { id: business.id },
          data: {
            zernioProfileId: profileId,
            zernioAccountId: urlAccountId,
            zernioConnected: true,
            waNumber,
          },
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        // Register global webhook
        const zernio = new ZernioClient()
        const globalWebhookUrl = `${baseUrl.replace(/\/+$/, "")}/api/webhook`
        const existing = await zernio.listWebhooks()
        const already = existing.find((w) => w.url === globalWebhookUrl)
        if (!already) {
          await zernio.registerWebhook(globalWebhookUrl)
        }

        // Sync contacts
        syncContactsFromZernio(business.id).catch((err) =>
          console.error("[ZERNIO CALLBACK] Gagal sync kontak:", err)
        )

        const redirectUrl = new URL("/settings", baseUrl)
        redirectUrl.searchParams.set("zernio", "connected")
        if (waNumber) {
          redirectUrl.searchParams.set("wa", waNumber)
        }
        return NextResponse.redirect(redirectUrl.toString())
      }
    }

    // Fallback: OAuth code exchange flow
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

    // Simpan profileId jika belum ada
    await prisma.business.update({
      where: { id: businessId },
      data: { zernioProfileId: profileId },
    }).catch(() => {})

    const exchangeResult = await zernio.exchangeOAuthCode("whatsapp", code, state, profileId)

    // Coba ambil accountId dari response exchange
    // Response format: { account: { accountId, platform, username, displayName, isActive, selectedPhoneNumber } }
    const accountData = exchangeResult?.account ?? exchangeResult?.data ?? exchangeResult
    let accountId: string | null =
      accountData?.accountId ?? accountData?.id ?? accountData?._id ?? null
    let waNumber: string | null =
      accountData?.selectedPhoneNumber ??
      accountData?.phone ??
      accountData?.phoneNumber ??
      accountData?.username ??
      null
    let isConnected = accountData?.isActive === true || accountData?.status === "connected"

    // Fallback: polling jika accountId belum ditemukan
    if (!accountId) {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        const accounts = await zernio.getAccounts("whatsapp", profileId)
        const wa = accounts.find(
          (a) =>
            (a.platform === "whatsapp" || a.platform === "wa") &&
            a.status === "connected"
        )
        if (wa) {
          waNumber = wa.phone || wa.username || null
          accountId = wa.id
          isConnected = true
          break
        }
      }
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        zernioConnected: isConnected,
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
