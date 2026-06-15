"use client"

import { InputHTMLAttributes, forwardRef } from "react"

interface SliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="range"
          className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 dark:bg-zinc-700 dark:accent-white ${className}`}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"
