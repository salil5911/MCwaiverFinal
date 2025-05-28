"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function TestLogin() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("password123")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [sessionData, setSessionData] = useState<any>(null)
  const router = useRouter()

  const handleLogin = async () => {
    setStatus("loading")
    setMessage("")
    setSessionData(null)

    try {
      // Direct login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setStatus("error")
        setMessage(`Login error: ${error.message}`)
        return
      }

      setStatus("success")
      setMessage(`Logged in successfully as ${data.user?.email}!`)

      // Check if session was stored
      const { data: sessionCheck } = await supabase.auth.getSession()
      setSessionData(sessionCheck.session)

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin")
      }, 2000)
    } catch (error: any) {
      setStatus("error")
      setMessage(`Unexpected error: ${error.message || "Unknown error"}`)
    }
  }

  const checkSession = async () => {
    setStatus("loading")
    setMessage("")

    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setStatus("error")
        setMessage(`Session check error: ${error.message}`)
        return
      }

      if (data.session) {
        setStatus("success")
        setMessage(`Active session found for: ${data.session.user.email}`)
        setSessionData(data.session)
      } else {
        setStatus("error")
        setMessage("No active session found")
        setSessionData(null)
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(`Session check error: ${error.message || "Unknown error"}`)
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Minimal Login Test</CardTitle>
          <CardDescription>Direct login test without context or middleware</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {sessionData && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Session Data:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={handleLogin}
            className="w-full bg-teal-600 hover:bg-teal-700"
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>

          <Button onClick={checkSession} variant="outline" className="w-full">
            Check Current Session
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
