"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

export default function AuthStatus() {
  const { isAuthenticated } = useAuth()
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [localStorageValue, setLocalStorageValue] = useState<string | null>(null)

  const checkAuth = () => {
    try {
      const value = localStorage.getItem("mobile-care-auth")
      setLocalStorageValue(value)
      setLastChecked(new Date())
    } catch (error) {
      console.error("Error checking localStorage:", error)
      setLocalStorageValue("Error accessing localStorage")
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Authentication Status</CardTitle>
        <Button variant="outline" size="sm" onClick={checkAuth}>
          <RefreshCw className="h-4 w-4 mr-2" /> Check Auth
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <strong>Auth Context:</strong>
            <p className="mt-1">Status: {isAuthenticated ? "Authenticated" : "Not authenticated"}</p>
          </div>

          {lastChecked && (
            <div className="mt-4">
              <strong>Local Storage Check:</strong>
              <p className="mt-1">Value: {localStorageValue}</p>
              <p className="text-xs text-gray-500 mt-1">Last checked: {lastChecked.toLocaleString()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
