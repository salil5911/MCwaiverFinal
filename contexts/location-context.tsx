"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Location } from "@/lib/supabase"

type LocationContextType = {
  selectedLocation: Location | null
  setSelectedLocation: (location: Location) => void
  isLocationSelected: boolean
  isInitialized: boolean
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize immediately - don't load from localStorage
  useEffect(() => {
    // Just mark as initialized without loading from localStorage
    setIsInitialized(true)
  }, [])

  // Save location to state but not to localStorage
  const handleSetLocation = (location: Location) => {
    console.log("Setting location to:", location)
    setSelectedLocation(location)
    // We no longer save to localStorage to force selection after each login
  }

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation: handleSetLocation,
        isLocationSelected: selectedLocation !== null,
        isInitialized,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}
