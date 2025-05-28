"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  disabled?: boolean
  error?: string
  required?: boolean
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  required = false,
}: CustomSelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          error && "border-destructive focus:ring-destructive",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 opacity-50 pointer-events-none" />
      {error && <p className="text-sm font-medium text-destructive mt-1">{error}</p>}
    </div>
  )
}
