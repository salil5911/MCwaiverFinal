"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function SessionDebugger() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [cookieData, setCookieData] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check Supabase session
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setError(`Session error: ${error.message}`)
        setSessionData(null)
      } else {
        setSessionData(data.session)
        setError(null)
      }

      // Check localStorage
      try {
        const authDebug = localStorage.getItem("authDebug")
        const supabaseAuthToken = localStorage.getItem("supabase-auth-token")

        setLocalStorageData({
          authDebug: authDebug ? JSON.parse(authDebug) : null,
          hasSupabaseAuthToken: !!supabaseAuthToken,
        })
      } catch (e) {
        console.error("Could not access localStorage:", e)
        setLocalStorageData({ error: "Could not access localStorage" })
      }

      // Check cookies
      setCookieData(document.cookie)
    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`)
      setSessionData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAuth = async () => {
    try {
      setIsLoading(true)

      // Sign out from Supabase
      await supabase.auth.signOut()

      // Clear localStorage
      try {
        localStorage.removeItem("authDebug")
        localStorage.removeItem("supabase-auth-token")
      } catch (e) {
        console.error("Could not clear localStorage:", e)
      }

      // Refresh session data
      checkSession()
    } catch (error: any) {
      setError(`Error clearing auth: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <Card className="mb-6 border-amber-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Session Debugger</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={checkSession} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button variant="destructive" size="sm" onClick={clearAuth} disabled={isLoading}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Session Status</h3>
            <p>{isLoading ? "Checking..." : sessionData ? "Active" : "No active session"}</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sessionData && (
            <div>
              <h3 className="font-semibold mb-1">Session Details</h3>
              <p>
                <strong>User:</strong> {sessionData.user?.email}
              </p>
              <p>
                <strong>Expires At:</strong> {new Date(sessionData.expires_at * 1000).toLocaleString()}
              </p>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40 mt-2">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-1">Local Storage</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Cookies</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {cookieData || "No cookies found"}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
