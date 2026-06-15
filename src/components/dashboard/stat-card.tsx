"use client"

import { cn } from "@/lib/utils"

export function StatCard({
  title,
  value,
  icon,
  trend,
  badge,
  onClick,
}: {
  title: string
  value: string | number
  icon: string
  trend?: { value: string; positive: boolean }
  badge?: number
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800",
        onClick && "cursor-pointer hover:shadow-md transition-shadow"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs",
                trend.positive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className="relative">
          <span className="text-2xl">{icon}</span>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
