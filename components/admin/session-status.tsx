"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SessionStatus() {
  const { user, session } = useAuth()
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [directSessionCheck, setDirectSessionCheck] = useState<any>(null)

  const checkDirectSession = async () => {
    const { data } = await supabase.auth.getSession()
    setDirectSessionCheck(data.session)
    setLastChecked(new Date())
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Session Status</CardTitle>
        <Button variant="outline" size="sm" onClick={checkDirectSession}>
          <RefreshCw className="h-4 w-4 mr-2" /> Check Session
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <strong>Auth Context:</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>User: {user ? user.email : "Not logged in"}</li>
              <li>Session: {session ? "Active" : "None"}</li>
            </ul>
          </div>

          {directSessionCheck && (
            <div className="mt-4">
              <strong>Direct Session Check:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>User: {directSessionCheck.user?.email}</li>
                <li>Expires: {new Date(directSessionCheck.expires_at * 1000).toLocaleString()}</li>
              </ul>
              <p className="text-xs text-gray-500 mt-1">Last checked: {lastChecked?.toLocaleString()}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
