import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const bookings = await prisma.booking.findMany({
    where: { business: { ownerId: session.user.id } },
    include: { service: true },
  })

  const totalBookings = bookings.length
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length
  const completed = bookings.filter((b) => b.status === "COMPLETED").length
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold">Analytics</h1>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Booking", value: totalBookings },
            { label: "Dikonfirmasi", value: confirmed },
            { label: "Selesai", value: completed },
            { label: "Dibatalkan", value: cancelled },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm text-zinc-500">{s.label}</p>
              <p className="mt-2 text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="font-semibold mb-4">Layanan Terpopuler</h3>
          {bookings.length === 0 ? (
            <p className="text-sm text-zinc-400">Belum ada data.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                bookings.reduce<Record<string, number>>((acc, b) => {
                  acc[b.service.name] = (acc[b.service.name] || 0) + 1
                  return acc
                }, {})
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <span className="font-medium">{count}x</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
