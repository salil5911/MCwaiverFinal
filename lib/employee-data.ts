import type { Location } from "./supabase"

// Define the employees by location
const employeesByLocation: Record<Location, string[]> = {
  Augusta: ["Shan", "Kenny", "Tre", "Sam"],
  Perimeter: ["Aly", "Meviz", "Ankush", "Zee", "Rahim", "Insha", "Rehan", "Corey", "Omar"],
  Cumberland: ["Aly", "Meviz", "Ankush", "Zee", "Rahim", "Insha", "Rehan", "Corey", "Omar"],
  Southlake: ["Aly", "Meviz", "Ankush", "Zee", "Rahim", "Insha", "Rehan", "Corey", "Omar"],
  Lynnhaven: ["Lee", "Mark", "Gianna", "Ameen", "Roopa", "Sujitha", "Roopa", "Harshita", "Abdul"],
  "Carolina Place": ["Channi"],
}

/**
 * Get the list of employees for a specific location
 * @param location The location to get employees for
 * @returns Array of employee names
 */
export function getEmployeesForLocation(location: Location): string[] {
  return employeesByLocation[location] || []
}

/**
 * Check if an employee exists at a specific location
 * @param location The location to check
 * @param employeeName The employee name to check
 * @returns True if the employee exists at the location, false otherwise
 */
export function isEmployeeAtLocation(location: Location, employeeName: string): boolean {
  const employees = getEmployeesForLocation(location)
  return employees.includes(employeeName)
}
