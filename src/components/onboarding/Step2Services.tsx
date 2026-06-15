"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"

export interface ServiceItem {
  id: string
  name: string
  duration: number
  price: string
}

interface Step2Props {
  defaultValues: ServiceItem[]
  onSave: (services: ServiceItem[]) => void
}

const durationOptions = [
  { value: "15", label: "15 menit" },
  { value: "30", label: "30 menit" },
  { value: "45", label: "45 menit" },
  { value: "60", label: "60 menit" },
  { value: "90", label: "90 menit" },
  { value: "120", label: "120 menit" },
]

let serviceIdCounter = 0
function newService(): ServiceItem {
  serviceIdCounter++
  return { id: `svc_${serviceIdCounter}`, name: "", duration: 60, price: "" }
}

export function Step2Services({ defaultValues, onSave }: Step2Props) {
  const [services, setServices] = useState<ServiceItem[]>(
    defaultValues.length > 0 ? defaultValues : [newService()]
  )

  const update = (id: string, field: keyof ServiceItem, value: any) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const remove = (id: string) => {
    if (services.length <= 1) return
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  const add = () => {
    setServices((prev) => [...prev, newService()])
  }

  const canContinue = services.some((s) => s.name.trim().length > 0)

  const handleContinue = () => {
    if (!canContinue) return
    onSave(services)
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Tambahkan layanan yang ditawarkan. Minimal 1 layanan.
      </p>

      <div className="flex flex-col gap-4">
        {services.map((svc, i) => (
          <div
            key={svc.id}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">
                Layanan #{i + 1}
              </span>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(svc.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Hapus
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder="Nama layanan"
                value={svc.name}
                onChange={(e) => update(svc.id, "name", e.target.value)}
              />
              <Select
                options={durationOptions}
                value={String(svc.duration)}
                onChange={(e) =>
                  update(svc.id, "duration", parseInt(e.target.value))
                }
              />
              <Input
                type="number"
                placeholder="Harga (opsional)"
                value={svc.price}
                onChange={(e) => update(svc.id, "price", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={add}>
        + Tambah Layanan
      </Button>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!canContinue}>
          Lanjut
        </Button>
      </div>
    </div>
  )
}
