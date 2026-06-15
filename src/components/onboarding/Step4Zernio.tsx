"use client"

import { useState } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

interface Step4Props {
  defaultValues: { apiKey: string; phone: string }
  onSave: (data: { apiKey: string; phone: string }) => void
  onSkip: () => void
}

export function Step4Zernio({ defaultValues, onSave, onSkip }: Step4Props) {
  const [apiKey, setApiKey] = useState(defaultValues.apiKey || "")
  const [phone, setPhone] = useState(defaultValues.phone || "")
  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [testMessage, setTestMessage] = useState("")

  const handleTest = async () => {
    if (!apiKey) return
    setTestStatus("loading")
    setTestMessage("")

    try {
      const res = await fetch("/api/zernio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, phone }),
      })
      const json = await res.json()
      if (json.success) {
        setTestStatus("success")
        setTestMessage(json.message)
      } else {
        setTestStatus("error")
        setTestMessage(json.message)
      }
    } catch {
      setTestStatus("error")
      setTestMessage("Gagal menghubungi server")
    }
  }

  const handleContinue = () => {
    onSave({ apiKey, phone })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
          Hubungkan Zernio
        </h3>
        <p className="mt-1 text-sm text-blue-600 dark:text-blue-300">
          Zernio adalah gateway WhatsApp yang akan kamu gunakan untuk menerima
          booking dari pelanggan.
        </p>
        <a
          href="https://zernio.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-blue-700 underline dark:text-blue-300"
        >
          Daftar Zernio →
        </a>
      </div>

      <Input
        label="Zernio API Key"
        type="password"
        placeholder="Masukkan API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      <Input
        label="Nomor WhatsApp Bisnis"
        placeholder="628xxxxxxxxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <Button
        type="button"
        variant="outline"
        onClick={handleTest}
        loading={testStatus === "loading"}
        disabled={!apiKey}
      >
        Test Koneksi
      </Button>

      {testStatus === "success" && (
        <p className="text-sm text-green-600">{testMessage}</p>
      )}
      {testStatus === "error" && (
        <p className="text-sm text-red-500">{testMessage}</p>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip (atur nanti)
        </Button>
        <Button onClick={handleContinue}>Selesai</Button>
      </div>
    </div>
  )
}
