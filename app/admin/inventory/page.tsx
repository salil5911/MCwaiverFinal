"use client"

import { useAuth } from "@/contexts/auth-context"
import { useLocation } from "@/contexts/location-context"
import AdminLayout from "@/components/admin/admin-layout"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Import only the inventory table component
import InventoryTable from "@/components/admin/inventory-table"

export default function AdminInventory() {
  const { isLoading: isAuthLoading } = useAuth()
  const { selectedLocation, isInitialized } = useLocation()

  if (isAuthLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Device Inventory</h1>

        <Card>
          <CardContent className="p-6">
            <InventoryTable key={`inventory-${selectedLocation}`} location={selectedLocation} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
