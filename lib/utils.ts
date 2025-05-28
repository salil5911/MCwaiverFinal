import { type ClassValue, clsx } from "clsx"
import { format, parseISO } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Group data by month function
export function groupByMonth<T>(
  data: T[],
  dateAccessor: (item: T) => string | Date,
  sortDescending = true,
): { [key: string]: T[] } {
  // Group data by month
  const grouped = data.reduce((acc: { [key: string]: T[] }, item) => {
    try {
      const dateValue = dateAccessor(item)
      if (!dateValue) {
        // If no date value, put in "Unknown Date" group
        if (!acc["Unknown Date"]) {
          acc["Unknown Date"] = []
        }
        acc["Unknown Date"].push(item)
        return acc
      }

      let date: Date
      if (typeof dateValue === "string") {
        date = parseISO(dateValue)
      } else {
        date = dateValue
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        // If invalid date, put in "Unknown Date" group
        if (!acc["Unknown Date"]) {
          acc["Unknown Date"] = []
        }
        acc["Unknown Date"].push(item)
        return acc
      }

      const monthYear = format(date, "MMMM yyyy")

      if (!acc[monthYear]) {
        acc[monthYear] = []
      }

      acc[monthYear].push(item)
      return acc
    } catch (error) {
      console.error("Error processing date in groupByMonth:", error)
      // If any error occurs during date processing, put in "Unknown Date" group
      if (!acc["Unknown Date"]) {
        acc["Unknown Date"] = []
      }
      acc["Unknown Date"].push(item)
      return acc
    }
  }, {})

  // Sort months in descending order (latest first)
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    // Always put "Unknown Date" at the end
    if (a === "Unknown Date") return 1
    if (b === "Unknown Date") return -1

    try {
      const dateA = parseISO(`01 ${a}`)
      const dateB = parseISO(`01 ${b}`)

      // Check if dates are valid
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0
      }

      return sortDescending ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
    } catch (error) {
      console.error("Error sorting months in groupByMonth:", error)
      return 0
    }
  })

  // Create a new object with sorted keys
  const sortedGrouped: { [key: string]: T[] } = {}
  sortedKeys.forEach((key) => {
    sortedGrouped[key] = grouped[key]
  })

  return sortedGrouped
}

// Sort month-year strings in descending order (most recent first)
export function sortMonthsDescending(months: string[]): string[] {
  return months.sort((a, b) => {
    const dateA = new Date(`01 ${a}`)
    const dateB = new Date(`01 ${b}`)
    return dateB.getTime() - dateA.getTime()
  })
}
