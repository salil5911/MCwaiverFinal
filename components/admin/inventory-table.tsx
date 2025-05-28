"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { supabase, type DeviceInventory, type Location } from "@/lib/supabase"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Smartphone,
  Watch,
  Tablet,
  HelpCircle,
  Check,
  X,
  DollarSign,
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { InventoryForm } from "./updated-inventory-form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/format-utils"
import { getEmployeesForLocation } from "@/lib/employee-data"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { DatePickerWithFallback } from "@/components/date-picker-with-fallback"

interface InventoryTableProps {
  location: Location
  limit?: number
}

export default function InventoryTable({ location, limit }: InventoryTableProps) {
  const [data, setData] = useState<DeviceInventory[]>([])
  const [filteredData, setFilteredData] = useState<DeviceInventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deviceType, setDeviceType] = useState<string>("all")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Add state for row selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Mark as Sold dialog state
  const [markAsSoldDialogOpen, setMarkAsSoldDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<DeviceInventory | null>(null)
  const [sellingPrice, setSellingPrice] = useState("")
  const [soldBy, setSoldBy] = useState("")
  const [soldDate, setSoldDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Section expansion states
  const [unsoldExpanded, setUnsoldExpanded] = useState(true)
  const [soldExpanded, setSoldExpanded] = useState(true)

  // Add state for transfer status editing
  const [editingTransferStatus, setEditingTransferStatus] = useState<{ [id: string]: boolean }>({})
  const [transferStatusValues, setTransferStatusValues] = useState<{ [id: string]: string }>({})
  const [savingTransferStatus, setSavingTransferStatus] = useState<{ [id: string]: boolean }>({})

  // Helper function to extract IMEI from additional notes
  function extractIMEI(notes: string | null | undefined): string {
    if (!notes) return "-"

    const imeiMatch = notes.match(/IMEI:\s*([^\n]+)/)
    return imeiMatch ? imeiMatch[1].trim() : "-"
  }

  // Add a function to determine row styling based on transfer status
  const getRowClassName = (row: any) => {
    if (!row) return ""

    // Check if the row has an id and it's in the selectedIds array
    if (row.id && selectedIds.includes(row.id)) {
      return "bg-red-100"
    }

    // Safely check for transfer_status
    if (row.transfer_status) {
      return "bg-amber-50" // Highlight transferred devices with amber color
    }

    return ""
  }

  // Function to refresh data after adding a new device
  const handleDeviceAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Add more detailed logging
        console.log(`Fetching inventory for location: "${location}" (${typeof location})`)

        // Ensure we're using the exact location string in the query
        const locationStr = String(location).trim()
        console.log(`Using normalized location string: "${locationStr}"`)

        let query = supabase
          .from("device_inventory")
          .select("*")
          .eq("location", locationStr)
          .order("purchase_date", { ascending: false })

        // Apply limit if provided
        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        // Log the results
        console.log(`Received ${data?.length || 0} inventory items for location: ${locationStr}`)

        // Ensure all date fields are valid before setting data
        const validatedData =
          data?.map((item) => ({
            ...item,
            // Ensure purchase_date is valid
            purchase_date: item.purchase_date || format(new Date(), "yyyy-MM-dd"),
            // Ensure sold_date is valid or null
            sold_date: item.sold_date || null,
            // Set default device_type if not present
            device_type: item.device_type || "Phone",
          })) || []

        setData(validatedData)

        // Initialize transfer status values
        const initialTransferStatusValues: { [id: string]: string } = {}
        data?.forEach((item) => {
          initialTransferStatusValues[item.id] = item.transfer_status || ""
        })
        setTransferStatusValues(initialTransferStatusValues)
      } catch (error) {
        console.error("Error fetching inventory:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription
    const subscription = supabase
      .channel("device_inventory_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "device_inventory",
          filter: `location=eq.${location}`,
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [location, limit, refreshTrigger])

  // Add a separate effect for filtering that runs when search query or device type changes
  useEffect(() => {
    if (data.length > 0) {
      applyFilters(data, searchQuery, deviceType)
    }
  }, [data, searchQuery, deviceType])

  // Apply filters based on search query and device type
  const applyFilters = (items: DeviceInventory[], query: string, type: string) => {
    let filtered = [...items]

    // Apply device type filter if not "all"
    if (type !== "all") {
      filtered = filtered.filter((item) => {
        // Ensure exact match for device type
        return (item.device_type || "Other") === type
      })
    }

    // Apply search filter if query exists
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim()
      filtered = filtered.filter((item) => {
        // Search in device model
        if (item.device_model?.toLowerCase().includes(lowerQuery)) return true

        // Search in vendor name
        if (item.vendor_name?.toLowerCase().includes(lowerQuery)) return true

        // Search in IMEI (from additional notes)
        const imei = extractIMEI(item.additional_notes)
        if (imei.toLowerCase().includes(lowerQuery)) return true

        // Search in notes
        if (item.additional_notes?.toLowerCase().includes(lowerQuery)) return true

        // Search in storage
        if (item.storage?.toLowerCase().includes(lowerQuery)) return true

        // Search in color
        if (item.color?.toLowerCase().includes(lowerQuery)) return true

        return false
      })
    }

    setFilteredData(filtered)
  }

  // Handle search query changes
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(data, query, deviceType)
  }

  // Handle device type changes
  const handleDeviceTypeChange = (type: string) => {
    setDeviceType(type)
    applyFilters(data, searchQuery, type)
  }

  // Handle marking a device as sold
  const handleMarkAsSold = (device: DeviceInventory) => {
    setSelectedDevice(device)
    setSellingPrice("")
    setSoldBy("")
    setSoldDate(new Date())
    setMarkAsSoldDialogOpen(true)
  }

  // Handle marking a device as in stock (unsold)
  const handleMarkAsInStock = async (device: DeviceInventory) => {
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("device_inventory")
        .update({
          is_sold: false,
          selling_price: null,
          sold_by: null,
          sold_date: null,
          transfer_status: null, // Also clear transfer status when marking as in stock
        })
        .eq("id", device.id)

      if (error) throw error

      toast({
        title: "Device marked as in stock",
        description: "The device has been marked as in stock.",
        variant: "success",
      })

      // Refresh data
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error marking device as in stock:", error)
      toast({
        title: "Error",
        description: "There was an error marking the device as in stock.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Save sold device details
  const saveSoldDeviceDetails = async () => {
    if (!selectedDevice) return

    setIsSaving(true)

    try {
      // Format selling price with $ if not already formatted
      const formattedSellingPrice = sellingPrice.startsWith("$") ? sellingPrice : formatCurrency(sellingPrice)

      // COMPLETELY REWORKED DATE HANDLING:
      // Use toLocaleDateString to get YYYY-MM-DD format without timezone issues
      const soldDateStr = soldDate.toLocaleDateString("en-CA")

      console.log("Selected sold date:", soldDate)
      console.log("Formatted sold date to save:", soldDateStr)

      const { error } = await supabase
        .from("device_inventory")
        .update({
          is_sold: true,
          selling_price: formattedSellingPrice,
          sold_by: soldBy,
          sold_date: soldDateStr, // Use the local date string
        })
        .eq("id", selectedDevice.id)

      if (error) throw error

      toast({
        title: "Device marked as sold",
        description: "The device has been marked as sold successfully.",
        variant: "success",
      })

      // Close dialog and refresh data
      setMarkAsSoldDialogOpen(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error marking device as sold:", error)
      toast({
        title: "Error",
        description: "There was an error marking the device as sold.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Get icon for device type
  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "phone":
        return <Smartphone className="h-4 w-4" />
      case "watch":
        return <Watch className="h-4 w-4" />
      case "ipad":
      case "tablet":
        return <Tablet className="h-4 w-4" />
      default:
        return <HelpCircle className="h-4 w-4" />
    }
  }

  // Add this function to handle saving transfer status
  const handleSaveTransferStatus = async (id: string, status: string) => {
    setSavingTransferStatus((prev) => ({ ...prev, [id]: true }))

    try {
      // If status is "none", set to null and don't mark as sold
      // Otherwise, set the transfer status and mark as sold
      const isSold = status !== "none"

      // Get today's date in YYYY-MM-DD format for the sold_date
      const today = new Date().toLocaleDateString("en-CA")

      const updateData: any = {
        transfer_status: status === "none" ? null : status,
        is_sold: isSold,
      }

      // Only add sold_date if the item is being marked as sold
      if (isSold) {
        updateData.sold_date = today
      }

      const { error } = await supabase.from("device_inventory").update(updateData).eq("id", id)

      if (error) throw error

      toast({
        title: "Transfer status updated",
        description: "The transfer status has been updated successfully.",
        variant: "success",
      })

      // Update local state
      setEditingTransferStatus((prev) => ({ ...prev, [id]: false }))

      // Refresh data to ensure we have the latest state
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error("Error updating transfer status:", error)
      toast({
        title: "Error updating transfer status",
        description: "There was a problem updating the transfer status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingTransferStatus((prev) => ({ ...prev, [id]: false }))
    }
  }

  // Add this function to handle canceling transfer status edit
  const handleCancelTransferStatus = (id: string) => {
    // Reset to the original value
    const item = data.find((item) => item.id === id)
    if (item) {
      setTransferStatusValues((prev) => ({ ...prev, [id]: item.transfer_status || "" }))
    }
    setEditingTransferStatus((prev) => ({ ...prev, [id]: false }))
  }

  // Define the column structure for the inventory table
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="px-1">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            checked={
              table.getFilteredRowModel().rows.length > 0 &&
              table.getFilteredRowModel().rows.every((row) => selectedIds.includes(row.original.id))
            }
            onChange={(e) => {
              const allRows = table.getFilteredRowModel().rows
              if (e.target.checked) {
                // Select all rows
                const allIds = allRows.map((row) => row.original.id)
                setSelectedIds((prev) => [...new Set([...prev, ...allIds])])
              } else {
                // Deselect all rows
                const allIds = allRows.map((row) => row.original.id)
                setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)))
              }
            }}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            checked={selectedIds.includes(row.original.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds((prev) => [...prev, row.original.id])
              } else {
                setSelectedIds((prev) => prev.filter((id) => id !== row.original.id))
              }
            }}
          />
        </div>
      ),
    },
    {
      header: "Device",
      accessorKey: "device_model",
      cell: ({ row }: { row: any }) => {
        const item = row.original
        return <div>{item.device_model}</div>
      },
    },
    {
      header: "Type",
      accessorKey: "device_type",
      cell: ({ row }: { row: any }) => {
        const item = row.original
        return <div>{item.device_type || "Other"}</div>
      },
    },
    {
      header: "Storage",
      accessorKey: "storage",
      cell: ({ row }: { row: any }) => {
        return <div>{row.original.storage || "-"}</div>
      },
    },
    {
      header: "Color",
      accessorKey: "color",
      cell: ({ row }: { row: any }) => {
        return <div>{row.original.color || "-"}</div>
      },
    },
    {
      header: "IMEI Number",
      accessorKey: "imei_number",
      cell: ({ row }: { row: any }) => {
        // Extract IMEI from additional_notes
        return extractIMEI(row.original.additional_notes)
      },
    },
    {
      header: "Purchase Date",
      accessorKey: "purchase_date",
      cell: ({ row }: { row: any }) => {
        try {
          const dateValue = row.original.purchase_date
          if (!dateValue) return "N/A"

          // FIXED: Don't create a new Date object, format the string directly
          // Instead, use a helper function to format the date string
          const formatDateString = (dateStr: string) => {
            // Split the date string by "-" to get year, month, day
            const [year, month, day] = dateStr.split("-").map((num) => Number.parseInt(num, 10))

            // Create month names array
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

            // Return formatted date string (e.g., "Apr 30, 2024")
            return `${monthNames[month - 1]} ${day}, ${year}`
          }

          return formatDateString(dateValue)
        } catch (error) {
          console.error("Error formatting date:", error)
          return "Error"
        }
      },
    },
    {
      header: "Vendor",
      accessorKey: "vendor_name",
    },
    {
      header: "Cost Price",
      accessorKey: "cost_price",
      cell: ({ row }: { row: any }) => {
        return formatCurrency(row.original.cost_price)
      },
    },
    {
      header: "Selling Price",
      accessorKey: "selling_price",
      cell: ({ row }: { row: any }) => {
        const item = row.original
        if (!item.is_sold || !item.selling_price) return "-"
        return formatCurrency(item.selling_price)
      },
    },
    {
      header: "Sold Date",
      accessorKey: "sold_date",
      cell: ({ row }: { row: any }) => {
        const item = row.original
        if (!item.is_sold || !item.sold_date) return "-"

        try {
          // FIXED: Don't create a new Date object, format the string directly
          // Use the same helper function as for purchase date
          const formatDateString = (dateStr: string) => {
            // Split the date string by "-" to get year, month, day
            const [year, month, day] = dateStr.split("-").map((num) => Number.parseInt(num, 10))

            // Create month names array
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

            // Return formatted date string (e.g., "Apr 30, 2024")
            return `${monthNames[month - 1]} ${day}, ${year}`
          }

          return formatDateString(item.sold_date)
        } catch (error) {
          return "-"
        }
      },
    },
    {
      header: "Sold By",
      accessorKey: "sold_by",
      cell: ({ row }: { row: any }) => {
        const item = row.original
        return item.is_sold && item.sold_by ? item.sold_by : "-"
      },
    },
    {
      header: "Transfer Status",
      accessorKey: "transfer_status",
      cell: ({ row }) => {
        const item = row.original
        const isEditing = editingTransferStatus[item.id] || false
        const currentValue = transferStatusValues[item.id] || ""
        const isSaving = savingTransferStatus[item.id] || false

        const locations = [
          "Sent for RMA",
          "Sent to Perimeter",
          "Sent to Augusta",
          "Sent to Cumberland",
          "Sent to Southlake",
          "Sent to Lynnhaven",
          "Sent to Carolina Place",
        ]

        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <Select
                value={currentValue}
                onValueChange={(value) => setTransferStatusValues((prev) => ({ ...prev, [item.id]: value }))}
                disabled={isSaving}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSaveTransferStatus(item.id, currentValue)}
                  disabled={isSaving}
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCancelTransferStatus(item.id)}
                  disabled={isSaving}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        }

        return (
          <div className="flex items-center justify-between group">
            <span className={item.transfer_status ? "" : "text-gray-400"}>
              {item.transfer_status || "Not transferred"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingTransferStatus((prev) => ({ ...prev, [item.id]: true }))}
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: { row: any }) => {
        const item = row.original

        return (
          <div className="flex items-center gap-2">
            {item.is_sold ? (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => handleMarkAsInStock(item)}
                disabled={isSaving}
              >
                <X className="h-3 w-3" />
                Mark as In Stock
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => handleMarkAsSold(item)}
                disabled={isSaving}
              >
                <Check className="h-3 w-3" />
                Mark as Sold
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="border rounded-md">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If limit is provided, only show limited data
  if (limit && filteredData.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Inventory</h2>
          <InventoryForm location={location} onSuccess={handleDeviceAdded} />
        </div>
        <DataTable
          data={filteredData.slice(0, limit)}
          columns={columns}
          showPagination={false}
          rowClassName={getRowClassName}
        />
      </div>
    )
  }

  // Update the filtering logic to consider devices with transfer status as "sold" for display purposes
  // First separate devices into sold and unsold
  const unsoldDevicesUnsorted = filteredData.filter((device) => !device.is_sold && !device.transfer_status)
  const soldDevicesUnsorted = filteredData.filter((device) => device.is_sold || device.transfer_status)

  // Sort sold devices by most recently sold first
  const soldDevices = soldDevicesUnsorted.sort((a, b) => {
    // Handle cases where sold_date might be null/undefined
    if (!a.sold_date) return 1
    if (!b.sold_date) return -1

    // FIXED: Compare date strings directly without creating Date objects
    // This avoids timezone issues when comparing dates
    return a.sold_date > b.sold_date ? -1 : a.sold_date < b.sold_date ? 1 : 0
  })

  // Sort unsold devices by most recently purchased first
  const unsoldDevices = unsoldDevicesUnsorted.sort((a, b) => {
    // Handle cases where purchase_date might be null/undefined
    if (!a.purchase_date) return 1
    if (!b.purchase_date) return -1

    // FIXED: Compare date strings directly without creating Date objects
    // This avoids timezone issues when comparing dates
    return a.purchase_date > b.purchase_date ? -1 : a.purchase_date < b.purchase_date ? 1 : 0
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Device Inventory</h2>
        <InventoryForm location={location} onSuccess={handleDeviceAdded}>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" /> Add New Device
          </Button>
        </InventoryForm>
      </div>

      {/* Device Type Switcher */}
      <div className="mb-6">
        <Tabs value={deviceType} onValueChange={handleDeviceTypeChange} className="w-full">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="all"
              className="text-lg font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
            >
              All Devices
            </TabsTrigger>
            <TabsTrigger
              value="Phone"
              className="text-lg font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
            >
              Phone
            </TabsTrigger>
            <TabsTrigger
              value="Watch"
              className="text-lg font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
            >
              Watch
            </TabsTrigger>
            <TabsTrigger
              value="iPad"
              className="text-lg font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
            >
              iPad
            </TabsTrigger>
            <TabsTrigger
              value="Tablet"
              className="text-lg font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
            >
              Tablet
            </TabsTrigger>
            <TabsTrigger
              value="Other"
              className="text-lg font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm"
            >
              Other
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search inventory by device model, storage, color, IMEI, etc."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full max-w-sm"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No inventory items found. Add your first device using the button above.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Unsold Devices Section */}
          <div className="border rounded-md overflow-hidden">
            <div
              className="bg-blue-50 p-4 flex justify-between items-center cursor-pointer"
              onClick={() => setUnsoldExpanded(!unsoldExpanded)}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-blue-800">Unsold Devices</h3>
                <Badge className="bg-blue-100 text-blue-800 border-none">
                  {unsoldDevices.length} {unsoldDevices.length === 1 ? "device" : "devices"}
                </Badge>
              </div>
              {unsoldExpanded ? (
                <ChevronUp className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              )}
            </div>

            {unsoldExpanded && (
              <div className="p-4">
                {unsoldDevices.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No unsold devices found.</p>
                  </div>
                ) : (
                  <DataTable
                    data={unsoldDevices}
                    columns={columns}
                    showPagination={unsoldDevices.length > 10}
                    rowClassName={getRowClassName}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sold Devices Section */}
          <div className="border rounded-md overflow-hidden">
            <div
              className="bg-green-50 p-4 flex justify-between items-center cursor-pointer"
              onClick={() => setSoldExpanded(!soldExpanded)}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-green-800">Sold Devices</h3>
                <Badge className="bg-green-100 text-green-800 border-none">
                  {soldDevices.length} {soldDevices.length === 1 ? "device" : "devices"}
                </Badge>
              </div>
              {soldExpanded ? (
                <ChevronUp className="h-5 w-5 text-green-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-green-600" />
              )}
            </div>

            {soldExpanded && (
              <div className="p-4">
                {soldDevices.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No sold devices found.</p>
                  </div>
                ) : (
                  <DataTable
                    data={soldDevices}
                    columns={columns}
                    showPagination={soldDevices.length > 10}
                    rowClassName={getRowClassName}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mark as Sold Dialog */}
      <Dialog open={markAsSoldDialogOpen} onOpenChange={setMarkAsSoldDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Mark Device as Sold</DialogTitle>
            <DialogDescription>Enter the selling details for this device.</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh]" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="selling-price" className="text-right text-sm font-medium">
                  Selling Price
                </label>
                <div className="col-span-3 relative">
                  <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="selling-price"
                    placeholder="Enter selling price"
                    className="pl-8"
                    value={sellingPrice}
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      const value = e.target.value.replace(/[^\d.]/g, "")
                      setSellingPrice(value)
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="sold-by" className="text-right text-sm font-medium">
                  Sold By
                </label>
                <div className="col-span-3">
                  <Select value={soldBy} onValueChange={setSoldBy}>
                    <SelectTrigger id="sold-by">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {getEmployeesForLocation(location).map((employee) => (
                        <SelectItem key={employee} value={employee}>
                          {employee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="sold-date" className="text-right text-sm font-medium">
                  Sold Date
                </label>
                <div className="col-span-3">
                  <DatePickerWithFallback
                    selected={soldDate}
                    onSelect={(date) => {
                      if (date) {
                        setSoldDate(date)
                        setCalendarOpen(false)
                      }
                    }}
                    calendarOpen={calendarOpen}
                    setCalendarOpen={setCalendarOpen}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkAsSoldDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={saveSoldDeviceDetails}
              className="bg-green-600 hover:bg-green-700"
              disabled={!sellingPrice || !soldBy || isSaving}
            >
              {isSaving ? "Saving..." : "Mark as Sold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
