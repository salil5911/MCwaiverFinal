"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function DevLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDevLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // This is a development-only login that creates a session
      // DO NOT USE THIS IN PRODUCTION
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "admin@example.com",
        password: "password123",
      })

      if (error) {
        console.error("Login error:", error)
        setError(`Auth error: ${error.message}`)
        return
      }

      if (data.session) {
        console.log("Session created successfully")
        router.push("/admin")
      } else {
        setError("No session returned from auth")
      }
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError(`Unexpected error: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: "admin@example.com",
        password: "password123",
      })

      if (error) {
        console.error("User creation error:", error)
        setError(`User creation error: ${error.message}`)
        return
      }

      console.log("User created:", data.user)
      setError("User created successfully. Now try logging in.")
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError(`Unexpected error: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Session check error:", error)
        setError(`Session check error: ${error.message}`)
        return
      }

      if (data.session) {
        setError(`Active session found for: ${data.session.user.email}`)
      } else {
        setError("No active session found")
      }
    } catch (err: any) {
      console.error("Unexpected error:", err)
      setError(`Unexpected error: ${err.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Development Login</CardTitle>
          <CardDescription>Use this page for development testing only</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant={error.includes("successfully") ? "default" : "destructive"} className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-500 mb-4">
            <p>This page helps diagnose authentication issues:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>First create a test user</li>
              <li>Then try logging in with that user</li>
              <li>Check if a session exists</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleCreateTestUser} className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Test User
          </Button>

          <Button onClick={handleDevLogin} className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Login as Test User
          </Button>

          <Button onClick={checkSession} variant="outline" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Check Current Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
