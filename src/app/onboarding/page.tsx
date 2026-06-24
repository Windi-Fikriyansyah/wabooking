"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { Button } from "@/components/ui/Button"
import {
  Step1BusinessInfo,
  type BusinessFormData,
} from "@/components/onboarding/Step1BusinessInfo"
import { Step2Services, type ServiceItem } from "@/components/onboarding/Step2Services"
import { Step3Schedule, type ScheduleDay } from "@/components/onboarding/Step3Schedule"
import { Step4Zernio } from "@/components/onboarding/Step4Zernio"

const STEPS = ["Info Bisnis", "Tambah Layanan", "Atur Jadwal", "Hubungkan Zernio"]
const STORAGE_KEY = "wabooking_onboarding_draft"
const DRAFT_VERSION = 2

interface Draft {
  version: number
  step: number
  business: Partial<BusinessFormData>
  services: ServiceItem[]
  schedules: ScheduleDay[]
  slotInterval: number
  waPhone: string
}

function defaultDraft(): Draft {
  return {
    version: DRAFT_VERSION,
    step: 0,
    business: { name: "", type: "", address: "", description: "", logoUrl: "" },
    services: [],
    schedules: [],
    slotInterval: 60,
    waPhone: "",
  }
}

function loadDraft(): Draft {
  if (typeof window === "undefined") return defaultDraft()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Draft
      if (parsed && typeof parsed.step === "number" && parsed.version === DRAFT_VERSION) return parsed
    }
  } catch {}
  return defaultDraft()
}

function saveDraft(draft: Draft) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {}
}

export default function OnboardingPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(defaultDraft())
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setDraft(loadDraft())
    setLoaded(true)
  }, [])

  const updateDraft = useCallback((update: Partial<Draft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...update }
      saveDraft(next)
      return next
    })
  }, [])

  if (!loaded) return null

  const handleStep1 = (data: BusinessFormData) => updateDraft({ business: data, step: 1 })
  const handleStep2 = (services: ServiceItem[]) => updateDraft({ services, step: 2 })
  const handleStep3 = (schedules: ScheduleDay[], slotInterval: number) => updateDraft({ schedules, slotInterval, step: 3 })

  const handleStep4Save = (data: { phone: string }) => {
    const final = { ...draft, waPhone: data.phone, step: 4, version: DRAFT_VERSION }
    setDraft(final)
    saveDraft(final)
    submitFinal(final)
  }

  const handleStep4Skip = () => {
    const final = { ...draft, waPhone: "", step: 4, version: DRAFT_VERSION }
    setDraft(final)
    saveDraft(final)
    submitFinal(final)
  }

  const submitFinal = async (finalDraft: Draft) => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: finalDraft.business,
          services: finalDraft.services,
          schedules: finalDraft.schedules.map((s) => ({ ...s, slotInterval: finalDraft.slotInterval })),
          waNumber: finalDraft.waPhone,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        alert(json.error || "Gagal menyimpan")
        return
      }

      localStorage.removeItem(STORAGE_KEY)
      router.push("/dashboard")
    } catch {
      alert("Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Setup Bisnis</h1>
          <p className="mt-1 text-sm text-zinc-500">Lengkapi data bisnis untuk mulai menerima booking</p>
        </div>
        <div className="mb-10">
          <ProgressBar steps={STEPS} currentStep={draft.step} />
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          {draft.step === 0 && (
            <Step1BusinessInfo defaultValues={draft.business as BusinessFormData} onSave={handleStep1} />
          )}
          {draft.step === 1 && (
            <Step2Services defaultValues={draft.services} onSave={handleStep2} />
          )}
          {draft.step === 2 && (
            <Step3Schedule defaultValues={draft.schedules} onSave={handleStep3} />
          )}
          {draft.step === 3 && (
            <Step4Zernio defaultValues={{ phone: draft.waPhone }} onSave={handleStep4Save} onSkip={handleStep4Skip} />
          )}
          {draft.step > 0 && draft.step < 3 && (
            <div className="mt-4">
              <Button variant="ghost" onClick={() => updateDraft({ step: draft.step - 1 })}>Kembali</Button>
            </div>
          )}
        </div>
        {submitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl bg-white p-8 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
              <p className="text-sm text-zinc-600">Menyimpan data bisnis...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
