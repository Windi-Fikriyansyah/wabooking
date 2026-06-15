import { NextResponse } from "next/server"
import { nanoid } from "nanoid"
import { prisma } from "@/lib/prisma"
import { sendEmail, resetPasswordEmailHtml } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email harus diisi" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { message: "Jika email terdaftar, link reset akan dikirim" },
        { status: 200 }
      )
    }

    const token = nanoid(32)
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    await sendEmail({
      to: email,
      subject: "Reset Password - WaBooking",
      html: resetPasswordEmailHtml(token),
    })

    return NextResponse.json(
      { message: "Jika email terdaftar, link reset akan dikirim" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[FORGOT-PASSWORD]", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
