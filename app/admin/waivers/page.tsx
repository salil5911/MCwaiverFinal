"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocation } from "@/contexts/location-context"
import { refreshSchemaCache } from "@/lib/supabase"
import AdminLayout from "@/components/admin/admin-layout"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

// Import the table components
import RepairWaiversTable from "@/components/admin/repair-waivers-table"
import SellingWaiversTable from "@/components/admin/selling-waivers-table"
import PurchaseWaiversTable from "@/components/admin/purchase-waivers-table"

export default function AdminWaivers() {
  const { isLoading: isAuthLoading } = useAuth()
  const { selectedLocation, isInitialized } = useLocation()
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(true)

  // Refresh schema cache on component mount
  useEffect(() => {
    const initializeSchema = async () => {
      setIsRefreshingSchema(true)
      try {
        await refreshSchemaCache()
      } catch (error) {
        console.error("Error refreshing schema cache:", error)
        toast({
          title: "Schema refresh error",
          description: "There was an error refreshing the database schema. Some features may not work correctly.",
          variant: "destructive",
        })
      } finally {
        setIsRefreshingSchema(false)
      }
    }

    initializeSchema()
  }, [])

  if (isAuthLoading || !isInitialized || isRefreshingSchema) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading waivers...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Waivers Management</h1>

        <div className="space-y-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Repair Waivers</h2>
              <RepairWaiversTable location={selectedLocation} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Selling Waivers</h2>
              <SellingWaiversTable location={selectedLocation} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Purchase Waivers</h2>
              <PurchaseWaiversTable location={selectedLocation} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
