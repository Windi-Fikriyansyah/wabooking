import { NextResponse } from "next/server"
import { uploadFile, extractKey, deleteFile } from "@/lib/upload"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const oldUrl = formData.get("oldUrl") as string | null

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(buffer, file.name, file.type)

    const oldKey = extractKey(oldUrl)
    if (oldKey) {
      await deleteFile(oldKey)
    }

    return NextResponse.json({ url }, { status: 200 })
  } catch (error: any) {
    console.error("[UPLOAD]", error)
    return NextResponse.json(
      { error: error.message || "Gagal upload file" },
      { status: 500 }
    )
  }
}
