import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"
import { prisma } from "@/lib/prisma"
import { sendEmail, verificationEmailHtml } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    })

    const token = nanoid(32)
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const verifyUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/verify-email?token=${token}`
    console.log("[REGISTER] Link verifikasi:", verifyUrl)

    await sendEmail({
      to: email,
      subject: "Verifikasi Email - WaBooking",
      html: verificationEmailHtml(token),
    })

    return NextResponse.json(
      {
        message: "Registrasi berhasil. Cek email untuk verifikasi.",
        ...(process.env.NODE_ENV !== "production" && { verifyUrl }),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[REGISTER]", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
