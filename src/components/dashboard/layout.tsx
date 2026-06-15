"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [business, setBusiness] = useState<{ name: string; waConnected: boolean } | null>(null)

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBusiness({ name: data[0].name, waConnected: data[0].waConnected })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="flex">
        <Sidebar
          businessName={business?.name || "WaBooking"}
          userName={session?.user?.name || "User"}
          waConnected={business?.waConnected || false}
          onLogout={() => signOut({ callbackUrl: "/login" })}
        />
        <main className="flex-1 md:ml-0 pb-16 md:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
