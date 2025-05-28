"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useLocation } from "@/contexts/location-context"
import { supabase, refreshSchemaCache } from "@/lib/supabase"
import AdminLayout from "@/components/admin/admin-layout"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"

// Import only the repair waivers table for the dashboard
import RepairWaiversTable from "@/components/admin/repair-waivers-table"
import DashboardStats from "@/components/admin/dashboard-stats"

export default function AdminDashboard() {
  const { isLoading: isAuthLoading } = useAuth()
  const { selectedLocation, isInitialized } = useLocation()
  const [stats, setStats] = useState({
    repairWaivers: 0,
    sellingWaivers: 0,
    purchaseWaivers: 0,
    invoices: 0,
    inventory: 0,
    inventorySold: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
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

  // Fetch stats data
  useEffect(() => {
    if (!selectedLocation) return

    const fetchStats = async () => {
      setIsLoadingStats(true)
      try {
        // Fetch repair waivers count
        const { count: repairCount, error: repairError } = await supabase
          .from("repair_waivers")
          .select("*", { count: "exact", head: true })
          .eq("location", selectedLocation)

        // Fetch selling waivers count
        const { count: sellingCount, error: sellingError } = await supabase
          .from("selling_waivers")
          .select("*", { count: "exact", head: true })
          .eq("location", selectedLocation)

        // Fetch purchase waivers count
        const { count: purchaseCount, error: purchaseError } = await supabase
          .from("purchase_waivers")
          .select("*", { count: "exact", head: true })
          .eq("location", selectedLocation)

        // Fetch invoices count
        const { count: invoiceCount, error: invoiceError } = await supabase
          .from("invoice_sheets")
          .select("*", { count: "exact", head: true })
          .eq("location", selectedLocation)

        // Fetch inventory count
        const { count: inventoryCount, error: inventoryError } = await supabase
          .from("device_inventory")
          .select("*", { count: "exact", head: true })
          .eq("location", selectedLocation)

        // Fetch sold inventory count
        const { count: soldCount, error: soldError } = await supabase
          .from("device_inventory")
          .select("*", { count: "exact", head: true })
          .eq("location", selectedLocation)
          .eq("is_sold", true)

        setStats({
          repairWaivers: repairCount || 0,
          sellingWaivers: sellingCount || 0,
          purchaseWaivers: purchaseCount || 0,
          invoices: invoiceCount || 0,
          inventory: inventoryCount || 0,
          inventorySold: soldCount || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [selectedLocation])

  // Show loading state while initializing
  if (isAuthLoading || !isInitialized || isRefreshingSchema) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
          <p className="text-gray-500">
            Welcome to the Mobile Care admin panel. View and manage all your data from this dashboard.
          </p>
        </div>

        <Separator />

        {/* Dashboard Stats */}
        <DashboardStats stats={stats} isLoading={isLoadingStats} />

        <Separator />

        {/* Recent Repair Waivers */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Repair Waivers</CardTitle>
            </CardHeader>
            <CardContent>
              <RepairWaiversTable location={selectedLocation} limit={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
