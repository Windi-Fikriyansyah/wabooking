const RESEND_API_KEY = process.env.RESEND_API_KEY
const APP_NAME = process.env.APP_NAME || "WaBooking"

function isPlaceholder(key: string | undefined): boolean {
  if (!key) return true
  const placeholders = ["re_xxxxx", "your-api-key", "sk_test_"]
  return placeholders.some((p) => key.startsWith(p)) || key.length < 10
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}) {
  console.log(`[EMAIL] To: ${options.to}`)
  console.log(`[EMAIL] Subject: ${options.subject}`)

  if (isPlaceholder(RESEND_API_KEY)) {
    console.log("[EMAIL] RESEND_API_KEY tidak dikonfigurasi. Email hanya dicatat di log.")
    console.log(`[EMAIL] HTML (terpotong): ${options.html.slice(0, 200)}...`)
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${APP_NAME} <noreply@${process.env.RESEND_DOMAIN || "yourdomain.com"}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[EMAIL] Gagal mengirim:", err)
  } else {
    console.log("[EMAIL] Berhasil dikirim")
  }
}

export function verificationEmailHtml(token: string): string {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000"
  const url = `${baseUrl}/verify-email?token=${token}`
  return `
    <h1>Verifikasi Email</h1>
    <p>Klik link di bawah untuk memverifikasi email kamu:</p>
    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Verifikasi Email</a>
    <p>Link ini kadaluarsa dalam 24 jam.</p>
    <hr>
    <p style="color:#888;font-size:12px;">Atau buka link ini di browser: <a href="${url}">${url}</a></p>
  `
}

export function resetPasswordEmailHtml(token: string): string {
  const baseUrl = process.env.AUTH_URL || "http://localhost:3000"
  const url = `${baseUrl}/reset-password?token=${token}`
  return `
    <h1>Reset Password</h1>
    <p>Klik link di bawah untuk mereset password kamu:</p>
    <a href="${url}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a>
    <p>Link ini kadaluarsa dalam 1 jam.</p>
    <hr>
    <p style="color:#888;font-size:12px;">Atau buka link ini di browser: <a href="${url}">${url}</a></p>
  `
}
