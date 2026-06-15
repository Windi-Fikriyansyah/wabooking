"use client"

import { cn } from "@/lib/utils"

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800",
        className
      )}
    >
      {children}
    </div>
  )
}
