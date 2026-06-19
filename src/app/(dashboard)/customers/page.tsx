"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Dialog } from "@/components/ui/Dialog"
import { Textarea } from "@/components/ui/Textarea"

interface Customer {
  id: string
  name: string
  waNumber: string
  totalBookings: number
  notes: string | null
  lastBookingAt: string | null
  createdAt: string
}

interface ServiceInfo {
  id: string
  name: string
}

interface BookingRecord {
  id: string
  bookingCode: string
  service: ServiceInfo
  scheduledAt: string
  status: string
  durationMinutes: number
  createdAt: string
}

interface CustomerStats {
  totalBookings: number
  bookingsThisMonth: number
  avgFrequency: number | null
}

interface CustomerDetail extends Customer {
  bookings: BookingRecord[]
  stats: CustomerStats
}

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  NO_SHOW: "Tidak Hadir",
  PENDING_PAYMENT: "Menunggu Pembayaran",
}

const statusVariant: Record<string, "yellow" | "green" | "blue" | "red" | "gray" | "purple"> = {
  PENDING: "yellow",
  CONFIRMED: "green",
  COMPLETED: "blue",
  CANCELLED: "red",
  NO_SHOW: "gray",
  PENDING_PAYMENT: "purple",
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)

  if (days < 1) return "Hari ini"
  if (days < 7) return `${days} hari lalu`
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

function fDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

export default function CustomersPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [notes, setNotes] = useState("")
  const [notesDirty, setNotesDirty] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const loadBusiness = useCallback(async () => {
    const res = await fetch("/api/business")
    if (!res.ok) throw new Error("Gagal memuat data bisnis")
    const data: { id: string }[] = await res.json()
    if (data.length === 0) throw new Error("Belum ada bisnis")
    return data[0].id
  }, [])

  const fetchCustomers = useCallback(async (bizId: string, q: string, pg: number) => {
    const params = new URLSearchParams({ businessId: bizId, page: String(pg), pageSize: String(pageSize) })
    if (q.trim()) params.set("search", q.trim())
    const res = await fetch(`/api/customers?${params}`)
    if (!res.ok) throw new Error("Gagal memuat pelanggan")
    return res.json() as Promise<{ customers: Customer[]; total: number }>
  }, [])

  const loadData = useCallback(async (bizId: string, q: string, pg: number) => {
    setLoading(true)
    try {
      const data = await fetchCustomers(bizId, q, pg)
      setCustomers(data.customers)
      setTotal(data.total)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [fetchCustomers])

  useEffect(() => {
    let cancelled = false
    loadBusiness().then((bizId) => {
      if (cancelled) return
      setBusinessId(bizId)
      loadData(bizId, search, 1)
    })
    return () => { cancelled = true }
  }, [loadBusiness, loadData]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!businessId) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      loadData(businessId, search, 1)
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, businessId, loadData])

  const openDetail = useCallback(async (customerId: string) => {
    if (!businessId) return
    setSelectedId(customerId)
    setDetailLoading(true)
    setCustomerDetail(null)
    setNotes("")
    setNotesDirty(false)
    setNotesSaving(false)
    setNotesSaved(false)
    try {
      const res = await fetch(`/api/customers/${customerId}?businessId=${businessId}`)
      if (!res.ok) throw new Error("Gagal memuat detail")
      const data: CustomerDetail = await res.json()
      setCustomerDetail(data)
      setNotes(data.notes || "")
    } catch {
      setSelectedId(null)
    } finally {
      setDetailLoading(false)
    }
  }, [businessId])

  const closeDetail = useCallback(() => {
    setSelectedId(null)
    setCustomerDetail(null)
    if (notesTimer.current) clearTimeout(notesTimer.current)
  }, [])

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
    setNotesDirty(true)
  }, [])

  useEffect(() => {
    if (!customerDetail?.id || !notesDirty) return
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      setNotesSaving(true)
      try {
        const res = await fetch(`/api/customers/${customerDetail.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, notes }),
        })
        if (res.ok) {
          setNotesDirty(false)
          setNotesSaved(true)
          setTimeout(() => setNotesSaved(false), 2000)
        }
      } catch {
      } finally {
        setNotesSaving(false)
      }
    }, 1000)
    return () => { if (notesTimer.current) clearTimeout(notesTimer.current) }
  }, [notes, customerDetail?.id, notesDirty, businessId])

  const hasMore = customers.length < total

  const loadMore = useCallback(async () => {
    if (!businessId || loading || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    setLoading(true)
    try {
      const data = await fetchCustomers(businessId, search, nextPage)
      setCustomers((prev) => [...prev, ...data.customers])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [businessId, loading, hasMore, page, fetchCustomers, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Pelanggan</h1>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{total} pelanggan</span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon />
        </div>
        <Input
          placeholder="Cari nama atau nomor WA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && customers.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                  <div className="h-3 w-1/4 rounded bg-zinc-200 dark:bg-zinc-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <svg className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">Belum ada pelanggan</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Pelanggan akan muncul setelah ada booking yang dibuat.
          </p>
        </div>
      ) : (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">No. WA</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Total Booking</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Booking Terakhir</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() => openDetail(c.id)}
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.waNumber}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        <Badge variant="blue">{c.totalBookings}</Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {c.lastBookingAt ? formatDate(c.lastBookingAt) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={(e) => { e.stopPropagation(); openDetail(c.id) }}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} loading={loading}>
                {loading ? "Memuat..." : "Muat Lebih Banyak"}
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!selectedId}
        onClose={closeDetail}
        title={customerDetail ? customerDetail.name : "Detail Pelanggan"}
        className="!max-w-2xl"
      >
        {detailLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
            <div className="h-32 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ) : customerDetail ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {customerDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{customerDetail.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{customerDetail.waNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{customerDetail.stats.totalBookings}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Booking</p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{customerDetail.stats.bookingsThisMonth}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Bulan Ini</p>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center dark:border-zinc-700 dark:bg-zinc-800">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {customerDetail.stats.avgFrequency ? `${customerDetail.stats.avgFrequency} hr` : "-"}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Rata-rata Frekuensi</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Histori Booking</h4>
              {customerDetail.bookings.length === 0 ? (
                <p className="text-sm text-zinc-400">Belum ada booking</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Kode</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Layanan</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Tanggal</th>
                        <th className="px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                      {customerDetail.bookings.map((b) => (
                        <tr key={b.id}>
                          <td className="px-3 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">{b.bookingCode}</td>
                          <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{b.service.name}</td>
                          <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{fDateTime(b.scheduledAt)}</td>
                          <td className="px-3 py-2">
                            <Badge variant={statusVariant[b.status] || "gray"}>
                              {statusLabel[b.status] || b.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Catatan Internal</h4>
                {notesSaving && <span className="text-xs text-zinc-400">Menyimpan...</span>}
                {notesSaved && !notesDirty && <span className="text-xs text-emerald-600">Tersimpan</span>}
              </div>
              <Textarea
                placeholder="Tulis catatan tentang pelanggan ini..."
                value={notes}
                onChange={handleNotesChange}
              />
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
