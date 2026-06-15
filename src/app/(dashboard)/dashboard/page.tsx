"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { StatCard } from "@/components/dashboard/stat-card"

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

interface Service {
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
  service: Service
}

interface Stats {
  totalBookingsToday: number
  pendingBookings: number
  bookingsThisMonth: number
  estimatedRevenue: number
  todayBookings: Booking[]
  datesWithBookings: string[]
}

const statusLabel: Record<BookingStatus, string> = {
  PENDING: "Pending",
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

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`
}

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    dates.push(d)
  }
  return dates
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/stats?businessId=${id}`)
      if (!res.ok) throw new Error("Gagal memuat data dashboard")
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const res = await fetch("/api/business")
        const data = await res.json()
        const biz = Array.isArray(data) ? data[0] : data
        if (!biz?.id) {
          setBusinessId(null)
          setLoading(false)
          return
        }
        if (!cancelled) {
          setBusinessId(biz.id)
          await fetchStats(biz.id)
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat data bisnis")
          setLoading(false)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [fetchStats])

  const updateBookingStatus = useCallback(async (bookingId: string, status: BookingStatus) => {
    if (!businessId) return
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Gagal memperbarui status booking")
      await fetchStats(businessId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memperbarui status")
    }
  }, [businessId, fetchStats])

  if (!session?.user) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-zinc-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200" />
      </div>
    )
  }

  if (error && !businessId && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-500">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setLoading(true)
            setError(null)
            fetch("/api/business")
              .then((r) => r.json())
              .then((data) => {
                const biz = Array.isArray(data) ? data[0] : data
                if (biz?.id) {
                  setBusinessId(biz.id)
                  return fetchStats(biz.id)
                }
                setLoading(false)
              })
              .catch(() => {
                setError("Gagal memuat data bisnis")
                setLoading(false)
              })
          }}
        >
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-500">Anda belum memiliki bisnis. Silakan selesaikan onboarding.</p>
        <Button className="mt-4" onClick={() => window.location.href = "/onboarding"}>
          Ke Onboarding
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => { setLoading(true); setError(null); fetchStats(businessId) }}>
          Coba Lagi
        </Button>
      </div>
    )
  }

  if (!stats) return null

  const weekDates = getWeekDates()
  const today = new Date()
  const todayStr = toDateStr(today)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Booking Hari Ini"
          value={stats.totalBookingsToday}
          icon="📅"
        />
        <StatCard
          title="Menunggu Konfirmasi"
          value={stats.pendingBookings}
          icon="⏳"
          badge={stats.pendingBookings}
        />
        <StatCard
          title="Booking Bulan Ini"
          value={stats.bookingsThisMonth}
          icon="📊"
        />
        <StatCard
          title="Estimasi Pendapatan"
          value={formatRp(stats.estimatedRevenue)}
          icon="💰"
        />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-zinc-500 uppercase tracking-wide">Kalender Minggu Ini</h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((d) => {
            const ds = toDateStr(d)
            const isToday = ds === todayStr
            const hasBooking = stats.datesWithBookings.includes(ds)
            return (
              <div
                key={ds}
                className={`flex flex-col items-center rounded-lg py-3 transition-colors ${
                  isToday
                    ? "border-2 border-blue-600 bg-blue-50"
                    : "border border-transparent bg-zinc-50"
                }`}
              >
                <span className="text-xs font-medium text-zinc-500">{dayNames[d.getDay()]}</span>
                <span className={`mt-1 text-lg font-bold ${isToday ? "text-blue-600" : "text-zinc-900"}`}>
                  {d.getDate()}
                </span>
                {hasBooking && <div className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Booking Hari Ini</h2>
        {stats.todayBookings.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">Belum ada booking hari ini</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  <th className="pb-3 pr-4">Pelanggan</th>
                  <th className="pb-3 pr-4">Layanan</th>
                  <th className="pb-3 pr-4">Jam</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {stats.todayBookings.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-100 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-zinc-900">{b.customerName}</div>
                      <div className="text-xs text-zinc-400">{b.customerWa}</div>
                    </td>
                    <td className="py-3 pr-4 text-zinc-700">{b.service.name}</td>
                    <td className="py-3 pr-4 text-zinc-700">{formatTime(b.scheduledAt)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusVariant[b.status]}>{statusLabel[b.status]}</Badge>
                    </td>
                    <td className="py-3">
                      {b.status === "PENDING" && (
                        <Button
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs px-3 py-1.5"
                          onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                        >
                          Konfirmasi
                        </Button>
                      )}
                      {b.status === "CONFIRMED" && (
                        <Button
                          variant="primary"
                          className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5"
                          onClick={() => updateBookingStatus(b.id, "COMPLETED")}
                        >
                          Selesai
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
