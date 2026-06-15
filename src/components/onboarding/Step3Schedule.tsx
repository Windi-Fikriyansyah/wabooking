"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"

export interface ScheduleDay {
  dayOfWeek: number
  label: string
  isActive: boolean
  openTime: string
  closeTime: string
}

interface Step3Props {
  defaultValues: ScheduleDay[]
  onSave: (schedules: ScheduleDay[], slotInterval: number) => void
}

const DAYS = [
  { value: 0, label: "Senin" },
  { value: 1, label: "Selasa" },
  { value: 2, label: "Rabu" },
  { value: 3, label: "Kamis" },
  { value: 4, label: "Jumat" },
  { value: 5, label: "Sabtu" },
  { value: 6, label: "Minggu" },
]

const intervalOptions = [
  { value: "15", label: "15 menit" },
  { value: "30", label: "30 menit" },
  { value: "45", label: "45 menit" },
  { value: "60", label: "60 menit" },
]

function defaultDays(): ScheduleDay[] {
  return DAYS.map((d) => ({
    dayOfWeek: d.value,
    label: d.label,
    isActive: d.value < 5,
    openTime: d.value < 5 ? "09:00" : "",
    closeTime: d.value < 5 ? "17:00" : "",
  }))
}

export function Step3Schedule({ defaultValues, onSave }: Step3Props) {
  const [days, setDays] = useState<ScheduleDay[]>(
    defaultValues.length > 0 ? defaultValues : defaultDays()
  )
  const [slotInterval, setSlotInterval] = useState(60)

  const toggleDay = (dayOfWeek: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, isActive: !d.isActive }
          : d
      )
    )
  }

  const updateDay = (
    dayOfWeek: number,
    field: "openTime" | "closeTime",
    value: string
  ) => {
    setDays((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d
      )
    )
  }

  const applyTemplate = (template: "weekday" | "full") => {
    setDays((prev) =>
      prev.map((d) => {
        const isWeekday = d.dayOfWeek >= 0 && d.dayOfWeek <= 4
        const isSaturday = d.dayOfWeek === 5
        if (template === "weekday") {
          return {
            ...d,
            isActive: isWeekday,
            openTime: isWeekday ? "09:00" : "",
            closeTime: isWeekday ? "17:00" : "",
          }
        }
        return {
          ...d,
          isActive: isWeekday || isSaturday,
          openTime: isWeekday || isSaturday ? "08:00" : "",
          closeTime: isWeekday || isSaturday ? "20:00" : "",
        }
      })
    )
  }

  const handleContinue = () => {
    onSave(days, slotInterval)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Atur jadwal operasional bisnis
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => applyTemplate("weekday")}
          >
            Sen-Jum 09:00-17:00
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => applyTemplate("full")}
          >
            Sen-Sab 08:00-20:00
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">Interval Slot:</span>
        <Select
          options={intervalOptions}
          value={String(slotInterval)}
          onChange={(e) => setSlotInterval(parseInt(e.target.value))}
          className="w-32"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800">
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Hari
              </th>
              <th className="px-4 py-3 text-center font-medium text-zinc-500">
                Aktif
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Jam Buka
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">
                Jam Tutup
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {days.map((day) => (
              <tr key={day.dayOfWeek}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                  {day.label}
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={day.isActive}
                    onChange={() => toggleDay(day.dayOfWeek)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={day.openTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, "openTime", e.target.value)
                    }
                    disabled={!day.isActive}
                    className="h-8 rounded border border-zinc-300 bg-white px-2 text-sm disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="time"
                    value={day.closeTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, "closeTime", e.target.value)
                    }
                    disabled={!day.isActive}
                    className="h-8 rounded border border-zinc-300 bg-white px-2 text-sm disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue}>Lanjut</Button>
      </div>
    </div>
  )
}
