"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Dialog } from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Tabs } from "@/components/ui/Tabs"
import { Textarea } from "@/components/ui/Textarea"
import { Toggle } from "@/components/ui/Toggle"

const TABS = [
  { id: "profil", label: "Profil Bisnis" },
  { id: "integrasi", label: "Integrasi WhatsApp" },
  { id: "bot", label: "Kustomisasi Bot" },
  { id: "notifikasi", label: "Notifikasi" },
]

const BUSINESS_TYPES = [
  { value: "Salon", label: "Salon" },
  { value: "Klinik", label: "Klinik" },
  { value: "Barbershop", label: "Barbershop" },
  { value: "Laundry", label: "Laundry" },
  { value: "Bengkel", label: "Bengkel" },
  { value: "Lainnya", label: "Lainnya" },
]

const AVAILABLE_VARS = ["{nama_pelanggan}", "{layanan}", "{tanggal}", "{jam}", "{nama_bisnis}", "{kode_booking}"]

const DEFAULT_WELCOME = "Halo {nama_pelanggan}! Selamat datang di {nama_bisnis}. Ada yang bisa kami bantu?"
const DEFAULT_CONFIRM = "Halo {nama_pelanggan}! Booking {layanan} Anda pada {tanggal} pukul {jam} telah dikonfirmasi. Kode booking: {kode_booking}. Terima kasih!"
const DEFAULT_REMINDER = "Halo {nama_pelanggan}! Ini adalah pengingat untuk booking {layanan} Anda besok, {tanggal} pukul {jam} di {nama_bisnis}. Sampai jumpa!"

const PREVIEW_DATA: Record<string, string> = {
  "{nama_pelanggan}": "Budi Santoso",
  "{layanan}": "Potong Rambut",
  "{tanggal}": "15 Juni 2026",
  "{jam}": "10:00",
  "{kode_booking}": "BK-001",
}

type BusinessData = {
  id: string
  name: string
  type: string
  address: string
  description: string
  logoUrl: string
  waNumber: string
  waConnected: boolean
  zernioApiKey: string
  zernioConnected: boolean
  welcomeMessage: string
  confirmTemplate: string
  reminderTemplate: string
}

type ZernioStatus = {
  connected: boolean
  waNumber?: string
}

function statusDot(connected: boolean) {
  return (
    <span className="flex items-center gap-2 text-sm font-medium">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          connected ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {connected ? "Terhubung" : "Tidak Terhubung"}
    </span>
  )
}

function resolvePreview(text: string, businessName: string) {
  let preview = text
  for (const [key, value] of Object.entries(PREVIEW_DATA)) {
    preview = preview.replaceAll(key, value)
  }
  preview = preview.replaceAll("{nama_bisnis}", businessName)
  return preview
}

function TemplateField({
  label,
  description,
  value,
  onChange,
  textareaRef,
}: {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}) {
  const insertVar = (v: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newVal = value.slice(0, start) + v + value.slice(end)
    onChange(newVal)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + v.length, start + v.length)
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-700">{label}</label>
        <span className="text-xs text-zinc-400">{value.length} karakter</span>
      </div>
      <p className="text-xs text-zinc-400">{description}</p>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[120px]"
      />
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-zinc-400 leading-7">Variabel:</span>
        {AVAILABLE_VARS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => insertVar(v)}
            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profil")
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const res = await fetch("/api/business")
        if (!res.ok) throw new Error("Gagal memuat data bisnis")
        const data = await res.json()
        const biz = Array.isArray(data) ? data[0] : data
        if (!biz?.id) throw new Error("Belum ada bisnis")
        if (!cancelled) setBusiness(biz)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Terjadi kesalahan")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-500">{error || "Belum ada bisnis"}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Pengaturan</h1>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "profil" && <ProfilTab business={business} onUpdate={setBusiness} />}
      {activeTab === "integrasi" && <IntegrasiTab business={business} onUpdate={setBusiness} />}
      {activeTab === "bot" && <BotTab business={business} onUpdate={setBusiness} />}
      {activeTab === "notifikasi" && <NotifikasiTab />}
    </div>
  )
}

function proxyImageUrl(url: string) {
  if (!url) return url
  if (url.startsWith("https://") && url.includes(".r2.dev")) {
    const match = url.match(/\.r2\.dev\/(.+)/)
    if (match) return `/api/images/${match[1]}`
  }
  return url
}

function ProfilTab({ business, onUpdate }: { business: BusinessData; onUpdate: (b: BusinessData) => void }) {
  const [name, setName] = useState(business.name)
  const [type, setType] = useState(business.type)
  const [address, setAddress] = useState(business.address)
  const [description, setDescription] = useState(business.description)
  const [logoUrl, setLogoUrl] = useState(business.logoUrl)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      let finalLogoUrl = logoUrl
      if (logoFile) {
        const fd = new FormData()
        fd.append("file", logoFile)
        if (logoUrl && !logoUrl.startsWith("data:")) {
          fd.append("oldUrl", logoUrl)
        }
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
        if (!uploadRes.ok) throw new Error("Gagal mengunggah logo")
        const uploadData = await uploadRes.json()
        finalLogoUrl = uploadData.url
        setLogoPreview(null)
        setLogoFile(null)
      }

      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: business.id, name, type, address, description, logoUrl: finalLogoUrl }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      const updated = await res.json()
      onUpdate({ ...business, ...updated, logoUrl: finalLogoUrl })
      setLogoUrl(finalLogoUrl)
      setMessage({ type: "success", text: "Data bisnis berhasil disimpan" })
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Terjadi kesalahan" })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
              {(logoPreview || logoUrl) ? (
                <img
                  src={logoPreview || proxyImageUrl(logoUrl)}
                  alt="Logo"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl text-zinc-300">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
              Pilih Logo
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
            </label>
            <p className="mt-1 text-xs text-zinc-400">Format: JPG, PNG. Maks 2 MB</p>
          </div>
        </div>

        <Input label="Nama Bisnis" value={name} onChange={(e) => setName(e.target.value)} required />
        <Select label="Jenis Bisnis" options={BUSINESS_TYPES} value={type} onChange={(e) => setType(e.target.value)} />
        <Textarea label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-[80px]" />
        <Textarea label="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
            {message.text}
          </p>
        )}

        <Button onClick={save} loading={saving}>Simpan</Button>
      </div>
    </Card>
  )
}

function IntegrasiTab({ business, onUpdate }: { business: BusinessData; onUpdate: (b: BusinessData) => void }) {
  const [status, setStatus] = useState<ZernioStatus | null>(null)
  const [checking, setChecking] = useState(true)

  const [apiKey, setApiKey] = useState("")
  const [waNumber, setWaNumber] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  const checkStatus = useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch(`/api/zernio/status?businessId=${business.id}`)
      if (!res.ok) throw new Error("Gagal cek status")
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus({ connected: false })
    } finally {
      setChecking(false)
    }
  }, [business.id])

  useEffect(() => { checkStatus() }, [checkStatus])

  const connect = async () => {
    if (!apiKey.trim()) { setConnError("API Key wajib diisi"); return }
    setConnecting(true)
    setConnError(null)
    try {
      const res = await fetch("/api/zernio/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id, apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Koneksi gagal")

      onUpdate({ ...business, zernioApiKey: apiKey.trim(), zernioConnected: data.connected, waNumber: data.waNumber || business.waNumber })
      setStatus({ connected: data.connected, waNumber: data.waNumber })
      setApiKey("")
      setWaNumber("")
    } catch (e) {
      setConnError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setConnecting(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/zernio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      })
      const data = await res.json()
      setTestResult({ ok: res.ok, msg: data.success ? "Koneksi berhasil" : data.error || "Koneksi gagal" })
    } catch {
      setTestResult({ ok: false, msg: "Terjadi kesalahan" })
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 3000)
    }
  }

  const disconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch("/api/zernio/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      })
      if (!res.ok) throw new Error("Gagal memutuskan koneksi")
      onUpdate({ ...business, zernioConnected: false, zernioApiKey: "", waConnected: false })
      setStatus({ connected: false })
      setShowDisconnectConfirm(false)
    } catch {
      setConnError("Gagal memutuskan koneksi")
    } finally {
      setDisconnecting(false)
    }
  }

  const connected = status?.connected ?? business.zernioConnected

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Status Koneksi</h2>
          {checking ? (
            <div className="h-5 w-32 animate-pulse rounded bg-zinc-200" />
          ) : (
            <>
              {statusDot(connected)}
              {(connected && status?.waNumber) && (
                <div className="space-y-1 text-sm">
                  <p className="text-zinc-600">
                    Nomor WA:{" "}
                    <Badge variant="green">{status.waNumber}</Badge>
                  </p>
                  <p className="text-xs text-zinc-400">Terakhir terkoneksi: saat ini</p>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {!connected ? (
        <Card>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Hubungkan Zernio</h2>
            <div className="relative">
              <Input
                label="Zernio API Key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Key Zernio"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-[38px] text-zinc-400 hover:text-zinc-600"
              >
                {showKey ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <Input
              label="Nomor WA"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="628123456789"
            />
            {connError && <p className="text-sm text-red-500">{connError}</p>}
            <Button onClick={connect} loading={connecting}>
              Simpan &amp; Hubungkan
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="green">WhatsApp Terhubung</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={testConnection} loading={testing}>
                Test Koneksi
              </Button>
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowDisconnectConfirm(true)}>
                Putuskan Koneksi
              </Button>
            </div>
            {testResult && (
              <p className={`text-sm ${testResult.ok ? "text-emerald-600" : "text-red-500"}`}>
                {testResult.msg}
              </p>
            )}
          </div>
        </Card>
      )}

      <Card>
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex w-full items-center justify-between text-sm font-medium text-zinc-700"
        >
          Panduan Mendapatkan API Key Zernio
          <svg
            className={`h-4 w-4 transition-transform ${guideOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {guideOpen && (
          <ol className="mt-4 space-y-2 text-sm text-zinc-600 list-decimal pl-5">
            <li>Buka <a href="https://zernio.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">zernio.ai</a> dan daftar akun</li>
            <li>Masuk ke dashboard Zernio</li>
            <li>Pilih menu &quot;API Keys&quot;</li>
            <li>Klik &quot;Buat API Key Baru&quot;</li>
            <li>Salin API Key dan tempel di atas</li>
          </ol>
        )}
      </Card>

      <Dialog open={showDisconnectConfirm} onClose={() => setShowDisconnectConfirm(false)} title="Konfirmasi">
        <p className="text-sm text-zinc-600">Apakah Anda yakin ingin memutuskan koneksi WhatsApp?</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowDisconnectConfirm(false)}>Batal</Button>
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={disconnect} loading={disconnecting}>
            Putuskan
          </Button>
        </div>
      </Dialog>
    </div>
  )
}

function BotTab({ business, onUpdate }: { business: BusinessData; onUpdate: (b: BusinessData) => void }) {
  const [welcome, setWelcome] = useState(business.welcomeMessage || DEFAULT_WELCOME)
  const [confirm, setConfirm] = useState(business.confirmTemplate || DEFAULT_CONFIRM)
  const [reminder, setReminder] = useState(business.reminderTemplate || DEFAULT_REMINDER)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [previewLabel, setPreviewLabel] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)

  const welcomeRef = useRef<HTMLTextAreaElement | null>(null)
  const confirmRef = useRef<HTMLTextAreaElement | null>(null)
  const reminderRef = useRef<HTMLTextAreaElement | null>(null)

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: business.id,
          welcomeMessage: welcome,
          confirmTemplate: confirm,
          reminderTemplate: reminder,
        }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      onUpdate({ ...business, welcomeMessage: welcome, confirmTemplate: confirm, reminderTemplate: reminder })
      setMessage({ type: "success", text: "Template berhasil disimpan" })
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Terjadi kesalahan" })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const resetDefaults = () => {
    setWelcome(DEFAULT_WELCOME)
    setConfirm(DEFAULT_CONFIRM)
    setReminder(DEFAULT_REMINDER)
  }

  const openPreview = (label: string, text: string) => {
    setPreviewLabel(label)
    setPreviewText(resolvePreview(text, business.name))
    setPreviewOpen(true)
  }

  return (
    <Card>
      <div className="space-y-6">
        <TemplateField
          label="Pesan Sambutan"
          description="Pesan yang dikirim saat pelanggan memulai chat"
          value={welcome}
          onChange={setWelcome}
          textareaRef={welcomeRef}
        />
        <Button variant="ghost" onClick={() => openPreview("Pesan Sambutan", welcome)}>
          Preview Pesan
        </Button>

        <TemplateField
          label="Pesan Konfirmasi Booking"
          description="Pesan yang dikirim saat booking dikonfirmasi"
          value={confirm}
          onChange={setConfirm}
          textareaRef={confirmRef}
        />
        <Button variant="ghost" onClick={() => openPreview("Pesan Konfirmasi Booking", confirm)}>
          Preview Pesan
        </Button>

        <TemplateField
          label="Pesan Pengingat H-1"
          description="Pesan pengingat yang dikirim H-1 sebelum jadwal booking"
          value={reminder}
          onChange={setReminder}
          textareaRef={reminderRef}
        />
        <Button variant="ghost" onClick={() => openPreview("Pesan Pengingat H-1", reminder)}>
          Preview Pesan
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
          <Button variant="secondary" onClick={resetDefaults}>
            Reset ke Default
          </Button>
          <div className="flex items-center gap-2">
            {message && (
              <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                {message.text}
              </p>
            )}
            <Button onClick={save} loading={saving}>Simpan</Button>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title={`Preview: ${previewLabel}`}>
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="whitespace-pre-wrap text-sm text-zinc-800">
            {previewText}
          </p>
        </div>
      </Dialog>
    </Card>
  )
}

function NotifikasiTab() {
  const [sendToWa, setSendToWa] = useState(false)
  const [waNumber, setWaNumber] = useState("")
  const [dailySummary, setDailySummary] = useState(false)
  const [summaryTime, setSummaryTime] = useState("07:00")
  const [saved, setSaved] = useState(false)

  const save = () => {
    const data = { sendToWa, waNumber, dailySummary, summaryTime }
    localStorage.setItem("notification-settings", JSON.stringify(data))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Card>
      <div className="space-y-5">
        <p className="text-sm text-zinc-500">
          Notifikasi akan dikirim ke nomor WhatsApp pribadi Anda.
        </p>

        <Toggle
          checked={sendToWa}
          onChange={setSendToWa}
          label="Terima notifikasi WA untuk booking baru"
        />
        {sendToWa && (
          <Input
            label="Nomor WA Pribadi"
            value={waNumber}
            onChange={(e) => setWaNumber(e.target.value)}
            placeholder="628123456789"
          />
        )}

        <Toggle
          checked={dailySummary}
          onChange={setDailySummary}
          label="Terima ringkasan booking harian via WA"
        />
        {dailySummary && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Jam Pengiriman Ringkasan
            </label>
            <input
              type="time"
              value={summaryTime}
              onChange={(e) => setSummaryTime(e.target.value)}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={save}>Simpan</Button>
          {saved && <p className="text-sm text-emerald-600">Pengaturan tersimpan</p>}
        </div>
      </div>
    </Card>
  )
}
