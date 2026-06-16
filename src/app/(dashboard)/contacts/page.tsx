"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

const PAGE_SIZE = 20

interface ContactChannel {
  id: string
  channelId: string
  channelType: string
}

interface Contact {
  id: string
  waNumber: string
  displayName: string | null
  avatarUrl: string | null
  lastInteractionAt: string
  createdAt: string
  contactChannels: ContactChannel[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Baru saja"
  if (minutes < 60) return `${minutes}m lalu`
  if (hours < 24) return `${hours}j lalu`
  if (days < 7) return `${days}h lalu`
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState("")
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const loadBusiness = useCallback(async () => {
    const res = await fetch("/api/business")
    if (!res.ok) throw new Error("Gagal memuat data bisnis")
    const data: { id: string }[] = await res.json()
    if (data.length === 0) throw new Error("Belum ada bisnis")
    return data[0].id
  }, [])

  const fetchContacts = useCallback(async (bizId: string, q: string, off: number) => {
    const params = new URLSearchParams({ businessId: bizId, limit: String(PAGE_SIZE), offset: String(off) })
    if (q.trim()) params.set("search", q.trim())
    const res = await fetch(`/api/contacts?${params}`)
    if (!res.ok) throw new Error("Gagal memuat kontak")
    return res.json() as Promise<{ contacts: Contact[]; pagination: { total: number; hasMore: boolean } }>
  }, [])

  const resetAndLoad = useCallback(async (bizId: string, q: string) => {
    setLoading(true)
    setOffset(0)
    try {
      const data = await fetchContacts(bizId, q, 0)
      setContacts(data.contacts)
      setTotal(data.pagination.total)
      setHasMore(data.pagination.hasMore)
    } catch { } finally {
      setLoading(false)
    }
  }, [fetchContacts])

  useEffect(() => {
    let cancelled = false
    loadBusiness().then(async (bizId) => {
      if (cancelled) return
      setBusinessId(bizId)
      await resetAndLoad(bizId, search)
    }).catch(() => {}).finally(() => { if (cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [loadBusiness, resetAndLoad])

  useEffect(() => {
    if (!businessId) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => resetAndLoad(businessId, search), 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, businessId, resetAndLoad])

  const loadMore = async () => {
    if (!businessId || loadingMore || !hasMore) return
    setLoadingMore(true)
    const newOffset = offset + PAGE_SIZE
    try {
      const data = await fetchContacts(businessId, search, newOffset)
      setContacts((prev) => [...prev, ...data.contacts])
      setOffset(newOffset)
      setHasMore(data.pagination.hasMore)
    } catch { } finally {
      setLoadingMore(false)
    }
  }

  const syncContacts = async () => {
    if (!businessId) return
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch("/api/contacts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal sync")
      setSyncMsg(data.message)
      await resetAndLoad(businessId, search)
    } catch (e: any) {
      setSyncMsg(e.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Kontak</h1>
        <div className="flex items-center gap-3">
          {syncMsg && <span className="text-sm text-zinc-500 dark:text-zinc-400">{syncMsg}</span>}
          <Button variant="outline" onClick={syncContacts} loading={syncing}>
            {syncing ? "Menyinkronkan..." : "Sync Kontak"}
          </Button>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{total} kontak</span>
        </div>
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

      {loading ? (
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
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <svg className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">Belum ada kontak</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Kontak akan muncul setelah ada pesan WhatsApp masuk, atau klik <strong>Sync Kontak</strong> untuk mengambil dari Zernio.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={contact.displayName || contact.waNumber} url={contact.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                      {contact.displayName || contact.waNumber}
                    </p>
                    <Badge variant="green">WA</Badge>
                  </div>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{contact.waNumber}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(contact.lastInteractionAt)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore} loading={loadingMore}>
            {loadingMore ? "Memuat..." : "Muat Lebih Banyak"}
          </Button>
        </div>
      )}
    </div>
  )
}
