"use client"

import { useState } from "react"
import { useLocation } from "@/contexts/location-context"
import type { Location } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const locations: Location[] = ["Augusta", "Perimeter", "Cumberland", "Southlake", "Lynnhaven", "Carolina Place"]

export function LocationSelectorModal() {
  const { selectedLocation, setSelectedLocation, isLocationSelected, isInitialized } = useLocation()
  const [tempLocation, setTempLocation] = useState<Location>(selectedLocation || "Augusta")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = () => {
    if (!tempLocation) {
      setError("Please select a location")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      setSelectedLocation(tempLocation)
      // No need to redirect, the parent component will handle rendering the appropriate content
    } catch (err) {
      console.error("Error setting location:", err)
      setError("Failed to set location. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // If we're still initializing or already have a location selected, don't show the modal
  if (!isInitialized || isLocationSelected) {
    return null
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select Location</DialogTitle>
          <DialogDescription>
            Please select the location you want to manage. You can change this later from the header.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-6">
          <RadioGroup
            value={tempLocation}
            onValueChange={(value) => setTempLocation(value as Location)}
            className="grid grid-cols-2 gap-4"
          >
            {locations.map((location) => (
              <div key={location} className="flex items-center space-x-2">
                <RadioGroupItem value={location} id={location} />
                <Label htmlFor={location} className="cursor-pointer">
                  {location}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleConfirm}
            className="bg-teal-600 hover:bg-teal-700"
            disabled={!tempLocation || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Location...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Confirm Location
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
