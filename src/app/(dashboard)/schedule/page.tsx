"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Toggle } from "@/components/ui/Toggle"

const DAY_LABELS: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const INTERVAL_OPTIONS = [
  { value: "15", label: "15 menit" },
  { value: "30", label: "30 menit" },
  { value: "45", label: "45 menit" },
  { value: "60", label: "60 menit" },
]

interface ScheduleDay {
  dayOfWeek: number
  isActive: boolean
  openTime: string
  closeTime: string
  slotIntervalMin: number
  maxConcurrent: number
}

interface BlockedDate {
  id: string
  date: string
  reason?: string
}

function defaultSchedule(dayOfWeek: number): ScheduleDay {
  return {
    dayOfWeek,
    isActive: false,
    openTime: "09:00",
    closeTime: "17:00",
    slotIntervalMin: 60,
    maxConcurrent: 1,
  }
}

export default function SchedulePage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [scheduleData, setScheduleData] = useState<Record<number, ScheduleDay>>({})
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [newDate, setNewDate] = useState("")
  const [newReason, setNewReason] = useState("")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const bizRes = await fetch("/api/business")
      if (!bizRes.ok) throw new Error("Gagal memuat data bisnis")
      const businesses = await bizRes.json()
      const bid: string | undefined = businesses?.[0]?.id
      if (!bid) throw new Error("Tidak ada bisnis ditemukan")
      setBusinessId(bid)

      const [schedRes, blockedRes] = await Promise.all([
        fetch(`/api/schedule?businessId=${bid}`),
        fetch("/api/schedule/blocked-dates"),
      ])

      if (!schedRes.ok) throw new Error("Gagal memuat jadwal")
      if (!blockedRes.ok) throw new Error("Gagal memuat tanggal blokir")

      const schedules: ScheduleDay[] = await schedRes.json()
      const blocked: BlockedDate[] = await blockedRes.json()

      const init: Record<number, ScheduleDay> = {}
      for (const day of DAY_ORDER) {
        const existing = schedules.find((s) => s.dayOfWeek === day)
        init[day] = existing ? { ...existing } : defaultSchedule(day)
      }
      setScheduleData(init)
      setBlockedDates(blocked)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  function updateDay(dayOfWeek: number, partial: Partial<ScheduleDay>) {
    setScheduleData((prev) => ({
      ...prev,
      [dayOfWeek]: { ...prev[dayOfWeek], ...partial },
    }))
  }

  async function handleSave() {
    if (!businessId) return
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const schedules = DAY_ORDER.map((d) => scheduleData[d])

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, schedules }),
      })

      if (!res.ok) throw new Error("Gagal menyimpan jadwal")

      setSuccessMessage("Jadwal berhasil disimpan")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddBlockedDate() {
    if (!newDate) return
    try {
      setError(null)
      setSuccessMessage(null)

      const res = await fetch("/api/schedule/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, reason: newReason || undefined }),
      })

      if (!res.ok) throw new Error("Gagal menambahkan tanggal")

      const created: BlockedDate = await res.json()
      setBlockedDates((prev) => [...prev, created])
      setNewDate("")
      setNewReason("")
      setSuccessMessage("Tanggal berhasil diblokir")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menambahkan tanggal")
    }
  }

  async function handleDeleteBlockedDate(id: string) {
    try {
      setError(null)
      setSuccessMessage(null)

      const res = await fetch("/api/schedule/blocked-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (!res.ok) throw new Error("Gagal menghapus tanggal")

      setBlockedDates((prev) => prev.filter((b) => b.id !== id))
      setSuccessMessage("Tanggal berhasil dihapus")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menghapus tanggal")
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
          <div className="h-10 w-24 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-48 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    )
  }

  if (error && Object.keys(scheduleData).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={fetchData}>
          Muat Ulang
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Jam Operasional</h1>
        <Button onClick={handleSave} loading={saving}>
          Simpan
        </Button>
      </div>
        {successMessage && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="py-3 pr-4 text-left font-medium text-zinc-500">Hari</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Jam Buka</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Jam Tutup</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Interval</th>
                  <th className="pl-4 py-3 text-left font-medium text-zinc-500">Max Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {DAY_ORDER.map((day) => {
                  const s = scheduleData[day]
                  if (!s) return null
                  return (
                    <tr key={day}>
                      <td className="py-3 pr-4 font-medium">{DAY_LABELS[day]}</td>
                      <td className="px-4 py-3">
                        <Toggle
                          checked={s.isActive}
                          onChange={(v) => updateDay(day, { isActive: v })}
                        />
                      </td>
                      {s.isActive ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={s.openTime}
                              onChange={(e) => updateDay(day, { openTime: e.target.value })}
                              className="h-10 w-32 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="time"
                              value={s.closeTime}
                              onChange={(e) => updateDay(day, { closeTime: e.target.value })}
                              className="h-10 w-32 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={String(s.slotIntervalMin)}
                              onChange={(e) => updateDay(day, { slotIntervalMin: Number(e.target.value) })}
                              className="h-10 w-32 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                            >
                              {INTERVAL_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="pl-4 py-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={s.maxConcurrent}
                              onChange={(e) => updateDay(day, { maxConcurrent: Math.min(10, Math.max(1, Number(e.target.value))) })}
                              className="h-10 w-20 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-zinc-400">-</td>
                          <td className="px-4 py-3 text-zinc-400">-</td>
                          <td className="px-4 py-3 text-zinc-400">-</td>
                          <td className="px-4 py-3 text-zinc-400">-</td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-base font-semibold">Tanggal Diblokir</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Tanggal-tanggal dimana bisnis tutup (hari libur, dll)
          </p>

          <div className="mb-6 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Tanggal</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Alasan (opsional)</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Alasan..."
                className="h-10 w-48 rounded-lg border border-zinc-300 bg-white px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <Button onClick={handleAddBlockedDate} disabled={!newDate}>
              Blokir
            </Button>
          </div>

          {blockedDates.length === 0 ? (
            <p className="text-sm text-zinc-400">Belum ada tanggal yang diblokir</p>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{formatDate(b.date)}</p>
                    {b.reason && <p className="text-xs text-zinc-400">{b.reason}</p>}
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteBlockedDate(b.id)}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
    </div>
  )
}
