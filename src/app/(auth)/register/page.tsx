"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"

const schema = z
  .object({
    name: z.string().min(1, "Nama lengkap harus diisi"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      router.push("/check-email")
    } catch {
      setError("Terjadi kesalahan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Daftar Akun</h1>
          <p className="mt-2 text-sm text-zinc-500">Mulai kelola booking bisnismu</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {(["name","email","password","confirmPassword"] as const).map((field) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                {field === "name" ? "Nama Lengkap" : field === "confirmPassword" ? "Konfirmasi Password" : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === "password" || field === "confirmPassword" ? "password" : field === "email" ? "email" : "text"}
                placeholder={field === "password" ? "Minimal 8 karakter" : field === "confirmPassword" ? "Ulangi password" : `Masukkan ${field === "name" ? "nama lengkap" : field}`}
                className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                {...register(field)}
              />
              {errors[field] && <p className="text-xs text-red-500">{errors[field].message}</p>}
            </div>
          ))}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Daftar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Sudah punya akun? <Link href="/login" className="font-medium text-zinc-900 underline">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
