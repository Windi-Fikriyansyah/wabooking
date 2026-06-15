import { S3Client, PutObjectCommand, DeleteObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3"
import { nanoid } from "nanoid"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const isR2Configured =
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_ENDPOINT &&
  process.env.R2_BUCKET_NAME &&
  !process.env.R2_ACCESS_KEY_ID.startsWith("your-") &&
  !process.env.R2_ENDPOINT.includes("<accountid>")

let s3: S3Client | null = null
if (isR2Configured) {
  s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  })
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const ext = fileName.split(".").pop()
  const name = `logos/${nanoid()}.${ext}`

  if (s3) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: name,
          Body: buffer,
          ContentType: mimeType,
        })
      )
      return `/api/images/${name}`
    } catch (err: any) {
      console.error("[UPLOAD] Gagal upload ke R2:", err.name, err.message)
      if (err.name === "AccessDenied") {
        try {
          const buckets = await s3.send(new ListBucketsCommand({}))
          const bucketNames = buckets.Buckets?.map((b) => b.Name) || []
          console.error("[UPLOAD] Bucket yang tersedia:", bucketNames)
          if (!bucketNames.includes(process.env.R2_BUCKET_NAME!)) {
            throw new Error(
              `Bucket "${process.env.R2_BUCKET_NAME}" tidak ditemukan. Buat bucket ini dulu di Cloudflare R2.`
            )
          }
          throw new Error(
            "Token R2 tidak punya izin Object Write untuk bucket ini. " +
            "Buat ulang token R2 dengan permission: Object Read & Write."
          )
        } catch (diagErr: any) {
          if (diagErr.message?.includes("tidak ditemukan") || diagErr.message?.includes("izin")) {
            throw diagErr
          }
          throw new Error(
            `R2 Access Denied. Cek: 1) Bucket "${process.env.R2_BUCKET_NAME}" sudah dibuat? 2) Token punya izin Object Write?`
          )
        }
      }
      throw err
    }
  }

  const publicDir = join(process.cwd(), "public", "uploads")
  await mkdir(publicDir, { recursive: true })
  const localPath = join(publicDir, name.replace("logos/", ""))
  await writeFile(localPath, buffer)

  const localUrl = `/uploads/${name.replace("logos/", "")}`
  console.log("[UPLOAD] Fallback ke local storage:", localUrl)
  return localUrl
}

export function extractKey(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith("/api/images/")) {
    return imageUrl.replace("/api/images/", "")
  }
  const match = imageUrl.match(/\.r2\.dev\/(.+)/)
  if (match) return match[1]
  return null
}

export async function deleteFile(key: string): Promise<void> {
  if (s3) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }))
      console.log("[UPLOAD] File dihapus dari R2:", key)
    } catch (err) {
      console.error("[UPLOAD] Gagal hapus file dari R2:", key, err)
    }
    return
  }

  try {
    const { unlink } = await import("fs/promises")
    const { join } = await import("path")
    const localPath = join(process.cwd(), "public", "uploads", key.replace("logos/", ""))
    await unlink(localPath)
    console.log("[UPLOAD] File lokal dihapus:", localPath)
  } catch (err) {
    console.error("[UPLOAD] Gagal hapus file lokal:", err)
  }
}
