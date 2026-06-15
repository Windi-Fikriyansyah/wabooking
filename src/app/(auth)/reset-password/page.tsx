"use client"

import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

const schema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
}).refine((d) => d.password === d.confirmPassword, { message: "Password tidak cocok", path: ["confirmPassword"] })

type FormData = z.infer<typeof schema>

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!token) { setError("Token tidak valid"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setSuccess(true)
    } catch { setError("Terjadi kesalahan") } finally { setLoading(false) }
  }

  if (!token) return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold">Token Tidak Valid</h1>
        <p className="mt-2 text-sm text-zinc-500">Link reset password tidak valid atau sudah kadaluarsa.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-medium underline">Minta link baru</Link>
      </div>
    </div>
  )

  if (success) return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Password Berhasil Direset</h1>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium underline">Masuk sekarang</Link>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="mt-2 text-sm text-zinc-500">Masukkan password baru</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {(["password", "confirmPassword"] as const).map((field) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{field === "password" ? "Password Baru" : "Konfirmasi Password"}</label>
              <input type="password" placeholder={field === "password" ? "Minimal 8 karakter" : "Ulangi password"}
                className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                {...register(field)} />
              {errors[field] && <p className="text-xs text-red-500">{errors[field].message}</p>}
            </div>
          ))}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Reset Password
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>
}
