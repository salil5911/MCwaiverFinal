import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    repairWaivers: number
    sellingWaivers: number
    purchaseWaivers: number
    invoices: number
    inventory: number
    inventorySold: number
  }
  isLoading: boolean
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Repair Waivers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          ) : (
            <div className="text-2xl font-bold">{stats.repairWaivers}</div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Selling Waivers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          ) : (
            <div className="text-2xl font-bold">{stats.sellingWaivers}</div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Purchase Waivers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          ) : (
            <div className="text-2xl font-bold">{stats.purchaseWaivers}</div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          ) : (
            <div className="text-2xl font-bold">{stats.invoices}</div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          ) : (
            <div className="text-2xl font-bold">{stats.inventory}</div>
          )}
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Items Sold</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          ) : (
            <div className="text-2xl font-bold">
              {stats.inventorySold} / {stats.inventory}
              <span className="text-sm text-gray-500 ml-2">
                ({stats.inventory > 0 ? Math.round((stats.inventorySold / stats.inventory) * 100) : 0}%)
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
