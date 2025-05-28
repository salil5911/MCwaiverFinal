"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface DatePickerWithFallbackProps {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  hasError?: boolean
}

export function DatePickerWithFallback({ selected, onSelect, hasError = false }: DatePickerWithFallbackProps) {
  const [open, setOpen] = useState(false)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)
  const [dateInputValue, setDateInputValue] = useState("")
  const calendarRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Detect if the device is a mobile or tablet
  useEffect(() => {
    const checkIfMobileOrTablet = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent)
      const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(userAgent)
      setIsMobileOrTablet(isMobile || isTablet || "ontouchstart" in window)
    }

    checkIfMobileOrTablet()
  }, [])

  // Update date input value when selected date changes
  useEffect(() => {
    if (selected) {
      setDateInputValue(format(selected, "yyyy-MM-dd"))
    } else {
      setDateInputValue("")
    }
  }, [selected])

  // Handle native date input change
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    setDateInputValue(dateValue)

    if (dateValue) {
      // Create date at noon to avoid timezone issues
      const [year, month, day] = dateValue.split("-").map(Number)
      const newDate = new Date(year, month - 1, day, 12, 0, 0)

      if (!isNaN(newDate.getTime())) {
        onSelect(newDate)
      }
    } else {
      onSelect(undefined)
    }
  }

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // Create a new date at noon to avoid timezone issues
      const newDate = new Date(date)
      newDate.setHours(12, 0, 0, 0)
      onSelect(newDate)

      // Only close after selection is complete
      setTimeout(() => {
        setOpen(false)
      }, 100)
    } else {
      onSelect(undefined)
    }
  }

  // Always use native date input on mobile/tablet
  if (isMobileOrTablet) {
    return (
      <Input
        type="date"
        value={dateInputValue}
        onChange={handleNativeDateChange}
        className={`${hasError ? "border-red-500" : ""}`}
      />
    )
  }

  // Use Popover calendar on desktop with manual control
  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant={"outline"}
        className={`w-full pl-3 text-left font-normal ${hasError ? "border-red-500" : ""}`}
        onClick={() => setOpen(!open)}
      >
        {selected ? format(selected, "PPP") : <span>Pick a date</span>}
        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
      </Button>

      {open && (
        <div
          className="absolute z-50 mt-2 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none animate-in fade-in-80"
          ref={calendarRef}
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleCalendarSelect}
            initialFocus
            fromYear={2000}
            toYear={2040}
            className="rounded-md border"
          />
        </div>
      )}
    </div>
  )
}
