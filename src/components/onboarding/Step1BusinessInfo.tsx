"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"

const schema = z.object({
  name: z.string().min(1, "Nama bisnis harus diisi"),
  type: z.string().min(1, "Pilih jenis bisnis"),
  address: z.string().optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
})

export type BusinessFormData = z.infer<typeof schema>

const businessTypes = [
  { value: "", label: "Pilih jenis bisnis" },
  { value: "salon", label: "Salon/Barbershop" },
  { value: "klinik", label: "Klinik & Dokter" },
  { value: "restoran", label: "Restoran & Kafe" },
  { value: "bengkel", label: "Bengkel" },
  { value: "spa", label: "Spa & Wellness" },
  { value: "lainnya", label: "Lainnya" },
]

interface Step1Props {
  defaultValues: BusinessFormData
  onSave: (data: BusinessFormData) => void
}

export function Step1BusinessInfo({ defaultValues, onSave }: Step1Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    defaultValues.logoUrl || null
  )
  const [logoUrl, setLogoUrl] = useState<string>(defaultValues.logoUrl || "")
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    setLogoPreview(preview)

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (json.url) {
        setLogoUrl(json.url)
      }
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = (data: BusinessFormData) => {
    onSave({ ...data, logoUrl: logoUrl || data.logoUrl })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Logo Bisnis
        </label>
        <div className="mt-2 flex items-center gap-4">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt="Preview"
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
              {uploading ? "Uploading..." : "Upload Logo"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <Input
        label="Nama Bisnis"
        placeholder="Contoh: Barbershop Mantap"
        {...register("name")}
        error={errors.name?.message}
      />

      <Select
        label="Jenis Bisnis"
        options={businessTypes}
        {...register("type")}
        error={errors.type?.message}
      />

      <Input
        label="Alamat"
        placeholder="Alamat lengkap bisnis"
        {...register("address")}
        error={errors.address?.message}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Deskripsi Singkat
        </label>
        <textarea
          className="h-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          placeholder="Deskripsikan bisnismu..."
          {...register("description")}
        />
        {errors.description?.message && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit">Lanjut</Button>
      </div>
    </form>
  )
}
