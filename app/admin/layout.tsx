import type React from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { LocationProvider } from "@/contexts/location-context"
import AuthGuard from "@/components/admin/auth-guard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mobile Care Admin Panel",
  description: "Admin panel for Mobile Care internal portal",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <LocationProvider>
        <AuthGuard>
          {/* Hide the main navbar for admin pages */}
          <div className="admin-layout">{children}</div>
        </AuthGuard>
      </LocationProvider>
    </AuthProvider>
  )
}
