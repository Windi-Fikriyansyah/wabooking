"use client"

import { useCallback, useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { Tabs } from "@/components/ui/Tabs"
import { cn } from "@/lib/utils"

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

interface Service {
  id: string
  name: string
  price: number
}

interface Booking {
  id: string
  bookingCode: string
  customerName: string
  customerWa: string
  scheduledAt: string
  status: BookingStatus
  durationMinutes: number
  notes?: string
  service: Service
}

type ViewMode = "list" | "calendar"

const statusLabel: Record<BookingStatus, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  NO_SHOW: "Tidak Hadir",
}

const statusVariant: Record<BookingStatus, "yellow" | "green" | "blue" | "red" | "gray"> = {
  PENDING: "yellow",
  CONFIRMED: "green",
  COMPLETED: "blue",
  CANCELLED: "red",
  NO_SHOW: "gray",
}

const statusColor: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-500",
  CONFIRMED: "bg-green-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-zinc-400",
}

const tabs = [
  { id: "ALL", label: "Semua" },
  { id: "PENDING", label: "Menunggu" },
  { id: "CONFIRMED", label: "Dikonfirmasi" },
  { id: "COMPLETED", label: "Selesai" },
  { id: "CANCELLED", label: "Dibatalkan" },
]

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

function fDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function BookingsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("ALL")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [selectedDayBookings, setSelectedDayBookings] = useState<Booking[] | null>(null)
  const [total, setTotal] = useState(0)
  const [pg, setPg] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const doFetch = useCallback(async (opts: {
    bizId: string
    status?: string
    q?: string
    pageNum?: number
    append?: boolean
  }) => {
    const params = new URLSearchParams({ businessId: opts.bizId })
    if (opts.status && opts.status !== "ALL") params.set("status", opts.status)
    if (opts.q) params.set("search", opts.q)
    if (opts.pageNum) params.set("page", String(opts.pageNum))

    try {
      const res = await fetch(`/api/bookings?${params}`)
      if (!res.ok) throw new Error("Gagal memuat booking")
      const data = await res.json()
      const list = Array.isArray(data) ? data : data.bookings ?? []
      setTotal(data.total ?? list.length)
      if (opts.append) {
        setBookings((prev) => [...prev, ...list])
      } else {
        setBookings(list)
      }
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    let cancel = false
    async function init() {
      try {
        const res = await fetch("/api/business")
        const data = await res.json()
        const biz = Array.isArray(data) ? data[0] : data
        if (biz?.id && !cancel) {
          setBusinessId(biz.id)
        } else if (!cancel) {
          setLoading(false)
        }
      } catch {
        if (!cancel) {
          setError("Gagal memuat data bisnis")
          setLoading(false)
        }
      }
    }
    init()
    return () => { cancel = true }
  }, [])

  useEffect(() => {
    if (!businessId) return
    setLoading(true)
    setPg(1)
    doFetch({ bizId: businessId, status: activeTab, q: search })
  }, [businessId, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!businessId) return
    const timer = setTimeout(() => {
      setLoading(true)
      setPg(1)
      doFetch({ bizId: businessId, status: activeTab, q: search })
    }, 400)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = useCallback(async (id: string, status: BookingStatus) => {
    if (!businessId) return
    try {
      const res = await fetch(`/api/bookings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Gagal memperbarui status")
      setSelectedBooking(null)
      setSelectedDayBookings(null)
      await doFetch({ bizId: businessId, status: activeTab, q: search })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui status")
    }
  }, [businessId, activeTab, search, doFetch])

  const handleLoadMore = useCallback(async () => {
    if (!businessId) return
    setLoadingMore(true)
    const next = pg + 1
    setPg(next)
    await doFetch({ bizId: businessId, status: activeTab, q: search, pageNum: next, append: true })
  }, [businessId, activeTab, search, pg, doFetch])

  const byDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = dateStr(new Date(b.scheduledAt))
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  const dim = daysInMonth(calYear, calMonth)
  const firstDow = firstDayOfMonth(calYear, calMonth)
  const todayStr = dateStr(new Date())

  if (loading && !businessId && !error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-10 w-48 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="h-10 animate-pulse rounded bg-zinc-200" />
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-zinc-200" />
          ))}
        </div>
      </div>
    )
  }

  if (error && !businessId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => {
          setLoading(true)
          setError(null)
          fetch("/api/business").then(r => r.json()).then(data => {
            const biz = Array.isArray(data) ? data[0] : data
            if (biz?.id) {
              setBusinessId(biz.id)
            } else {
              setLoading(false)
            }
          }).catch(() => {
            setError("Gagal memuat data bisnis")
            setLoading(false)
          })
        }}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (!businessId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-500">Anda belum memiliki bisnis.</p>
        <Button className="mt-4" onClick={() => window.location.href = "/onboarding"}>
          Ke Onboarding
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Booking</h1>
        <Input
          placeholder="Cari nama atau kode booking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Menampilkan {bookings.length} dari {total} booking
        </p>
        <div className="flex gap-1 rounded-lg border border-zinc-200 p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "list" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "calendar" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            📅 Kalender
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" onClick={() => {
            setLoading(true)
            setError(null)
            doFetch({ bizId: businessId!, status: activeTab, q: search })
          }}>
            Coba Lagi
          </Button>
        </div>
      )}

      {viewMode === "list" && (
        <>
          <Card className="!p-0 overflow-hidden">
            {loading && bookings.length === 0 ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-zinc-100" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-400">Belum ada booking</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Kode</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Pelanggan</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Layanan</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-medium text-zinc-500">Tanggal &amp; Jam</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-zinc-500">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {bookings.map((b) => (
                      <tr
                        key={b.id}
                        className="cursor-pointer transition-colors hover:bg-zinc-50"
                        onClick={() => setSelectedBooking(b)}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-zinc-600">{b.bookingCode}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900">{b.customerName}</div>
                          <div className="text-xs text-zinc-400">{b.customerWa}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{b.service.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-zinc-700">{fDateTime(b.scheduledAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[b.status]}>{statusLabel[b.status]}</Badge>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {b.status === "PENDING" && (
                            <Button
                              variant="primary"
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs px-3 py-1.5"
                              onClick={() => updateStatus(b.id, "CONFIRMED")}
                            >
                              Konfirmasi
                            </Button>
                          )}
                          {b.status === "CONFIRMED" && (
                            <Button
                              variant="primary"
                              className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5"
                              onClick={() => updateStatus(b.id, "COMPLETED")}
                            >
                              Selesai
                            </Button>
                          )}
                          {b.status === "COMPLETED" && (
                            <Badge variant="blue" className="text-xs">Selesai</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {bookings.length > 0 && bookings.length < total && (
            <div className="flex justify-center">
              <Button variant="outline" loading={loadingMore} onClick={handleLoadMore}>
                Muat Lainnya
              </Button>
            </div>
          )}
        </>
      )}

      {viewMode === "calendar" && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => {
              if (calMonth === 0) {
                setCalMonth(11)
                setCalYear((y) => y - 1)
              } else {
                setCalMonth((m) => m - 1)
              }
            }}>
              &lt;
            </Button>
            <h2 className="text-lg font-semibold text-zinc-900">
              {monthNames[calMonth]} {calYear}
            </h2>
            <Button variant="ghost" onClick={() => {
              if (calMonth === 11) {
                setCalMonth(0)
                setCalYear((y) => y + 1)
              } else {
                setCalMonth((m) => m + 1)
              }
            }}>
              &gt;
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {dayNames.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">
                {d}
              </div>
            ))}

            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] bg-zinc-50/50" />
            ))}

            {Array.from({ length: dim }).map((_, i) => {
              const day = i + 1
              const d = new Date(calYear, calMonth, day)
              const ds = dateStr(d)
              const dayBookings = byDate[ds] ?? []
              const isToday = ds === todayStr
              const statusCounts = dayBookings.reduce<Record<string, number>>((acc, b) => {
                const s = b.status
                acc[s] = (acc[s] || 0) + 1
                return acc
              }, {})

              return (
                <div
                  key={ds}
                  onClick={() => setSelectedDayBookings(dayBookings.length > 0 ? dayBookings : null)}
                  className={cn(
                    "min-h-[80px] cursor-pointer border border-zinc-100 p-1.5 transition-colors hover:bg-blue-50",
                    isToday && "border-blue-400 bg-blue-50/50"
                  )}
                >
                  <span className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday && "bg-blue-600 text-white"
                  )}>
                    {day}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {Object.entries(statusCounts).map(([s, count]) => (
                      <div
                        key={s}
                        className={cn("h-1.5 rounded-full", statusColor[s as BookingStatus])}
                        style={{ width: `${Math.min(count * 6, 20)}px` }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Dialog
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Detail Booking"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-zinc-500">{selectedBooking.bookingCode}</span>
              <Badge variant={statusVariant[selectedBooking.status]}>
                {statusLabel[selectedBooking.status]}
              </Badge>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-zinc-400">Pelanggan</p>
                <p className="text-sm font-medium text-zinc-900">{selectedBooking.customerName}</p>
                <p className="text-xs text-zinc-500">{selectedBooking.customerWa}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400">Layanan</p>
                <p className="text-sm text-zinc-900">{selectedBooking.service.name}</p>
                {selectedBooking.durationMinutes && (
                  <p className="text-xs text-zinc-500">{selectedBooking.durationMinutes} menit</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400">Tanggal &amp; Jam</p>
                <p className="text-sm text-zinc-900">{fDateTime(selectedBooking.scheduledAt)}</p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <p className="text-xs font-medium text-zinc-400">Catatan</p>
                  <p className="text-sm text-zinc-700">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              {selectedBooking.status === "PENDING" && (
                <>
                  <Button
                    variant="primary"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => updateStatus(selectedBooking.id, "CONFIRMED")}
                  >
                    Konfirmasi
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => updateStatus(selectedBooking.id, "CANCELLED")}
                  >
                    Tolak
                  </Button>
                </>
              )}
              {selectedBooking.status === "CONFIRMED" && (
                <>
                  <Button
                    variant="primary"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateStatus(selectedBooking.id, "COMPLETED")}
                  >
                    Selesai
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => updateStatus(selectedBooking.id, "NO_SHOW")}
                  >
                    Tandai No-Show
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={!!selectedDayBookings}
        onClose={() => setSelectedDayBookings(null)}
        title="Booking Hari Ini"
      >
        {selectedDayBookings && (
          <div className="space-y-3">
            {selectedDayBookings.length === 0 ? (
              <p className="text-sm text-zinc-400">Tidak ada booking</p>
            ) : (
              selectedDayBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-100 p-3 transition-colors hover:bg-zinc-50"
                  onClick={() => {
                    setSelectedDayBookings(null)
                    setSelectedBooking(b)
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{b.customerName}</p>
                    <p className="text-xs text-zinc-400">{b.service.name} &middot; {fTime(b.scheduledAt)}</p>
                  </div>
                  <Badge variant={statusVariant[b.status]}>{statusLabel[b.status]}</Badge>
                </div>
              ))
            )}
          </div>
        )}
      </Dialog>
    </div>
  )
}
