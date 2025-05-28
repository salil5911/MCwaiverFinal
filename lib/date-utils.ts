import { format, parseISO } from "date-fns"

/**
 * Groups data by month based on a date field
 * @param data Array of data objects
 * @param dateField The field name containing the date to group by
 * @returns Object with month-year keys and arrays of data
 */
export function groupDataByMonth<T extends Record<string, any>>(data: T[], dateField: keyof T): Record<string, T[]> {
  const grouped: Record<string, T[]> = {}

  data.forEach((item) => {
    try {
      // Get the date from the item using the specified field
      const dateValue = item[dateField]

      if (!dateValue) {
        // If no date value, put in "Unknown Date" group
        if (!grouped["Unknown Date"]) {
          grouped["Unknown Date"] = []
        }
        grouped["Unknown Date"].push(item)
        return
      }

      // Parse the date and format it as "MMMM yyyy"
      const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        // If invalid date, put in "Unknown Date" group
        if (!grouped["Unknown Date"]) {
          grouped["Unknown Date"] = []
        }
        grouped["Unknown Date"].push(item)
        return
      }

      const monthYear = format(date, "MMMM yyyy")

      // Initialize the array for this month if it doesn't exist
      if (!grouped[monthYear]) {
        grouped[monthYear] = []
      }

      // Add the item to the appropriate month group
      grouped[monthYear].push(item)
    } catch (error) {
      // If any error occurs during date processing, put in "Unknown Date" group
      console.error("Error processing date:", error)
      if (!grouped["Unknown Date"]) {
        grouped["Unknown Date"] = []
      }
      grouped["Unknown Date"].push(item)
    }
  })

  return grouped
}

/**
 * Sorts month-year strings in descending order (most recent first)
 * @param months Array of month-year strings (format: "MMMM yyyy")
 * @returns Sorted array of month-year strings
 */
export function sortMonthsDescending(months: string[]): string[] {
  // Always put "Unknown Date" at the end
  const unknownDateIndex = months.indexOf("Unknown Date")
  let unknownDatePresent = false

  if (unknownDateIndex !== -1) {
    unknownDatePresent = true
    months.splice(unknownDateIndex, 1)
  }

  // Sort the rest of the months
  const sortedMonths = months.sort((a, b) => {
    try {
      const dateA = new Date(a)
      const dateB = new Date(b)

      // Check if dates are valid
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0
      }

      return dateB.getTime() - dateA.getTime()
    } catch (error) {
      console.error("Error sorting months:", error)
      return 0
    }
  })

  // Add "Unknown Date" back at the end if it was present
  if (unknownDatePresent) {
    sortedMonths.push("Unknown Date")
  }

  return sortedMonths
}
