import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 400 }
      )
    }

    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!vt) {
      return NextResponse.json(
        { error: "Token tidak valid" },
        { status: 400 }
      )
    }

    if (vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json(
        { error: "Token sudah kadaluarsa" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { email: vt.identifier },
      data: { emailVerified: new Date() },
    })

    await prisma.verificationToken.delete({ where: { token } })

    return NextResponse.json(
      { message: "Email berhasil diverifikasi" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[VERIFY-EMAIL]", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
