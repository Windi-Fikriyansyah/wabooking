"use client"

import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}: {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn("flex border-b border-zinc-200 dark:border-zinc-700", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
