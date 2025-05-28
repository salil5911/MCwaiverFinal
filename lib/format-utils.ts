/**
 * Format a number or string as USD currency
 * @param value The value to format
 * @returns Formatted currency string (e.g., $123.45)
 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return ""
  }

  // If it's a string that already starts with $, return as is
  if (typeof value === "string" && value.startsWith("$")) {
    return value
  }

  // Convert to number
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return typeof value === "string" ? value : ""
  }

  // Format as currency
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue)
}

/**
 * Parse a currency string to a number
 * @param value The currency string to parse
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, commas, and other non-numeric characters except decimal point
  const cleanValue = value.replace(/[^0-9.]/g, "")
  return Number.parseFloat(cleanValue) || 0
}
