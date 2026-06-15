"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
import { SortableContext, useSortable, rectSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Dialog } from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { Slider } from "@/components/ui/Slider"
import { Toggle } from "@/components/ui/Toggle"
import { Textarea } from "@/components/ui/Textarea"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number | null
  isActive: boolean
  sortOrder: number
}

interface Business {
  id: string
  name: string
}

const serviceSchema = z.object({
  name: z.string().min(1, "Nama layanan wajib diisi"),
  description: z.string().optional().default(""),
  durationMinutes: z.coerce.number().int().min(15, "Minimal 15 menit"),
  price: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
})

interface ServiceFormData {
  name: string
  description: string
  durationMinutes: number
  price: string
  isActive: boolean
}

function formatPrice(price: number | null | undefined) {
  if (price == null) return "Gratis"
  return "Rp " + price.toLocaleString("id-ID")
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-400 cursor-grab active:cursor-grabbing" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
    </svg>
  )
}

function SortableCard({ service, onEdit, onDelete, onToggle }: {
  service: Service
  onEdit: (s: Service) => void
  onDelete: (s: Service) => void
  onToggle: (s: Service) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-10 opacity-50")}>
      <Card className={cn("relative", !service.isActive && "opacity-60")}>
        <div className="mb-1 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button {...attributes} {...listeners} className="touch-none" type="button">
                <GripIcon />
              </button>
              <h3 className="truncate text-sm font-semibold text-zinc-900">{service.name}</h3>
            </div>
            {service.description && (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{service.description}</p>
            )}
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1 text-sm text-zinc-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{service.durationMinutes} menit</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-zinc-700">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatPrice(service.price)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
          <Toggle checked={service.isActive} onChange={() => onToggle(service)} />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(service)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
              title="Edit"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => onDelete(service)}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Hapus"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-3 h-5 w-3/4 rounded bg-zinc-200" />
      <div className="mb-2 h-4 w-1/2 rounded bg-zinc-200" />
      <div className="mb-4 h-4 w-1/3 rounded bg-zinc-200" />
      <div className="flex items-center justify-between">
        <div className="h-5 w-10 rounded-full bg-zinc-200" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded bg-zinc-200" />
          <div className="h-8 w-8 rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  )
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: { name: "", description: "", durationMinutes: 60, price: "", isActive: true },
  })

  const loadBusiness = useCallback(async () => {
    const res = await fetch("/api/business")
    if (!res.ok) throw new Error("Gagal memuat data bisnis")
    const data: Business[] = await res.json()
    if (data.length === 0) throw new Error("Belum ada bisnis. Silakan selesaikan onboarding.")
    return data[0].id
  }, [])

  const loadServices = useCallback(async (bizId: string) => {
    const res = await fetch(`/api/services?businessId=${bizId}`)
    if (!res.ok) throw new Error("Gagal memuat layanan")
    return (await res.json()) as Service[]
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loadBusiness()
      .then(async (bizId) => {
        if (cancelled) return
        setBusinessId(bizId)
        const data = await loadServices(bizId)
        if (cancelled) return
        setServices(data)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loadBusiness, loadServices])

  const refreshServices = useCallback(async () => {
    if (!businessId) return
    try {
      const data = await loadServices(businessId)
      setServices(data)
    } catch (err: any) {
      setError(err.message)
    }
  }, [businessId, loadServices])

  const openAddDialog = () => {
    setEditingService(null)
    setDeleteError(null)
    form.reset({ name: "", description: "", durationMinutes: 60, price: "", isActive: true })
    setShowDialog(true)
  }

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setDeleteError(null)
    form.reset({
      name: service.name,
      description: service.description || "",
      durationMinutes: service.durationMinutes,
      price: service.price?.toString() || "",
      isActive: service.isActive,
    })
    setShowDialog(true)
  }

  const onSubmit = async (data: ServiceFormData) => {
    setSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        description: data.description || null,
        durationMinutes: data.durationMinutes,
        price: data.price ? Number(data.price) : null,
      }

      if (editingService) {
        payload.id = editingService.id
        payload.isActive = data.isActive
        const res = await fetch("/api/services", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const msg = await res.text().catch(() => "Gagal mengupdate layanan")
          throw new Error(msg)
        }
      } else {
        payload.businessId = businessId
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const msg = await res.text().catch(() => "Gagal menambah layanan")
          throw new Error(msg)
        }
      }

      setShowDialog(false)
      await refreshServices()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (service: Service) => {
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id, isActive: !service.isActive }),
      })
      if (!res.ok) throw new Error("Gagal mengubah status layanan")
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !s.isActive } : s))
      )
    } catch (err: any) {
      setError(err.message)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    setDeleteError(null)
    try {
      const res = await fetch("/api/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      })

      if (!res.ok) {
        const msg = await res.text().catch(() => "")
        if (msg.toLowerCase().includes("booking") || res.status === 409) {
          setDeleteError(
            "Layanan ini memiliki booking aktif. Hapus atau selesaikan booking terlebih dahulu."
          )
          return
        }
        throw new Error(msg || "Gagal menghapus layanan")
      }

      setDeleteTarget(null)
      await refreshServices()
    } catch (err: any) {
      setDeleteError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = services.findIndex((s) => s.id === active.id)
    const newIdx = services.findIndex((s) => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = [...services]
    const [moved] = reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, moved)
    const withSort = reordered.map((s, i) => ({ ...s, sortOrder: i }))
    setServices(withSort)

    try {
      const res = await fetch("/api/services/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: withSort.map((s) => ({ id: s.id, sortOrder: s.sortOrder })),
        }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan urutan")
    } catch {
      await refreshServices()
    }
  }, [services, refreshServices])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-10 w-40 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError(null)
            setLoading(true)
            loadBusiness()
              .then(async (bizId) => {
                setBusinessId(bizId)
                const data = await loadServices(bizId)
                setServices(data)
              })
              .catch((err) => setError(err.message))
              .finally(() => setLoading(false))
          }}
        >
          Coba Lagi
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Layanan</h1>
        <Button onClick={openAddDialog}>+ Tambah Layanan</Button>
      </div>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 text-center">
            <svg className="mb-4 h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.5-5.5a2 2 0 010-2.83l2.83-2.83a2 2 0 012.83 0l5.5 5.5a2 2 0 010 2.83l-2.83 2.83a2 2 0 01-2.83 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2v-4" />
            </svg>
            <p className="mb-1 text-sm font-medium text-zinc-600">
              Belum ada layanan.
            </p>
            <p className="mb-6 text-sm text-zinc-400">
              Tambahkan layanan pertama Anda.
            </p>
            <Button onClick={openAddDialog}>+ Tambah Layanan</Button>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={services.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <SortableCard
                    key={service.id}
                    service={service}
                    onEdit={openEditDialog}
                    onDelete={(s) => { setDeleteTarget(s); setDeleteError(null) }}
                    onToggle={toggleActive}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingService ? "Edit Layanan" : "Tambah Layanan"}
      >
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          <Input
            label="Nama Layanan"
            placeholder="Masukkan nama layanan"
            {...form.register("name")}
            error={form.formState.errors.name?.message}
          />

          <Textarea
            label="Deskripsi"
            placeholder="Deskripsi layanan (opsional)"
            {...form.register("description")}
            error={form.formState.errors.description?.message}
          />

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Slider
                label="Durasi (menit)"
                min={15}
                max={240}
                step={5}
                value={form.watch("durationMinutes")?.toString() || "60"}
                onChange={(e) => form.setValue("durationMinutes", Number(e.target.value))}
              />
            </div>
            <Input
              type="number"
              min={15}
              max={240}
              step={5}
              className="w-20 text-center"
              value={form.watch("durationMinutes") || 60}
              onChange={(e) => {
                const v = Math.min(240, Math.max(15, Number(e.target.value) || 15))
                form.setValue("durationMinutes", v)
              }}
            />
          </div>
          {form.formState.errors.durationMinutes && (
            <p className="text-xs text-red-500">{form.formState.errors.durationMinutes.message}</p>
          )}

          <Input
            label="Harga (opsional)"
            type="number"
            min={0}
            placeholder="Kosongkan jika gratis"
            {...form.register("price")}
            error={form.formState.errors.price?.message}
          />

          {editingService && (
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
              <span className="text-sm font-medium text-zinc-700">Aktif</span>
              <Toggle
                checked={form.watch("isActive")}
                onChange={(v) => form.setValue("isActive", v)}
              />
            </div>
          )}

          <div className="mt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              {editingService ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Layanan?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600">
            Yakin ingin menghapus <span className="font-medium text-zinc-900">{deleteTarget?.name}</span>?
          </p>

          {deleteError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="!bg-red-600 !text-white hover:!bg-red-700"
              onClick={confirmDelete}
              loading={submitting}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
