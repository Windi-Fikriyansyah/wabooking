import { NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const R2_ENDPOINT = process.env.R2_ENDPOINT || ""
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ""
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ""
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ""

const isConfigured = R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME

let s3: S3Client | null = null
if (isConfigured) {
  s3 = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    forcePathStyle: true,
  })
}

export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await params
    const path = key.join("/")

    if (!s3) {
      const localPath = `${process.cwd()}/public/uploads/${path.replace("logos/", "")}`
      const { readFile } = await import("fs/promises")
      try {
        const buffer = await readFile(localPath)
        const ext = path.split(".").pop()?.toLowerCase()
        const mime: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml" }
        const contentType = mime[ext || ""] || "image/png"
        return new NextResponse(buffer, {
          headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" },
        })
      } catch {
        return NextResponse.json({ error: "Image not found" }, { status: 404 })
      }
    }

    const { Body, ContentType } = await s3.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: path })
    )

    if (!Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    const buffer = Buffer.from(await Body.transformToByteArray())
    const contentType = ContentType || "image/png"

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("[IMAGE PROXY]", error)
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 })
  }
}
