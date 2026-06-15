import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token dan password harus diisi" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      )
    }

    const rt = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!rt || rt.used) {
      return NextResponse.json(
        { error: "Token tidak valid atau sudah digunakan" },
        { status: 400 }
      )
    }

    if (rt.expires < new Date()) {
      return NextResponse.json(
        { error: "Token sudah kadaluarsa" },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { email: rt.email },
      data: { password: hashed },
    })

    await prisma.passwordResetToken.update({
      where: { id: rt.id },
      data: { used: true },
    })

    return NextResponse.json(
      { message: "Password berhasil direset" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[RESET-PASSWORD]", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
