"use client"

import { useState } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface Step4Props {
  defaultValues: { phone: string }
  onSave: (data: { phone: string }) => void
  onSkip: () => void
}

export function Step4Zernio({ defaultValues, onSave, onSkip }: Step4Props) {
  const [phone, setPhone] = useState(defaultValues.phone || "")

  const handleContinue = () => {
    onSave({ phone })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          Hubungkan WhatsApp
        </h3>
        <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
          Masukkan nomor WhatsApp bisnis Anda untuk menerima notifikasi booking
          dari pelanggan.
        </p>
      </div>

      <Input
        label="Nomor WhatsApp Bisnis"
        placeholder="628xxxxxxxxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip (atur nanti)
        </Button>
        <Button onClick={handleContinue}>Selesai</Button>
      </div>
    </div>
  )
}
