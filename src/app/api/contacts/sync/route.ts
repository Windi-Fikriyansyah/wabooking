import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncContactsFromZernio } from "@/lib/sync-contacts"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { businessId } = await req.json()
    if (!businessId) {
      return NextResponse.json({ error: "Business ID wajib diisi" }, { status: 400 })
    }

    const result = await syncContactsFromZernio(businessId)

    return NextResponse.json({
      success: true,
      synced: result.synced,
      message: `${result.synced} kontak berhasil disinkronisasi`,
    })
  } catch (error) {
    console.error("[SYNC CONTACTS]", error)
    return NextResponse.json(
      { error: "Gagal sinkronisasi kontak" },
      { status: 500 }
    )
  }
}
