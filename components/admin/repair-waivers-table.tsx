"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { format } from "date-fns"
import { supabase, type RepairWaiver, type Location, getClientComponentClient } from "@/lib/supabase"
import { DataTable } from "./data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Search, Edit, Save, X, Loader2, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { groupByMonth } from "@/lib/utils"
import { groupDataByMonth, sortMonthsDescending } from "@/lib/date-utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/format-utils"

interface RepairWaiversTableProps {
  location: Location
  limit?: number
}

export default function RepairWaiversTable({ location, limit }: RepairWaiversTableProps) {
  const [data, setData] = useState<RepairWaiver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [noteStates, setNoteStates] = useState<{ [id: string]: string }>({})
  const [savingStates, setSavingStates] = useState<{ [id: string]: boolean }>({})
  const [activeTextareaId, setActiveTextareaId] = useState<string | null>(null)
  const [expandedMonths, setExpandedMonths] = useState<{ [month: string]: boolean }>({})
  const textareaRefs = useRef<{ [id: string]: HTMLTextAreaElement | null }>({})
  const supabaseClient = getClientComponentClient()
  const [waivers, setWaivers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredData, setFilteredData] = useState<RepairWaiver[]>([])

  const fetchData = async () => {
    setIsLoading(true)

    try {
      console.log("Fetching repair waivers for location:", location)

      // Build the query
      let query = supabase
        .from("repair_waivers")
        .select("*")
        .eq("location", location)
        .order("created_at", { ascending: false })

      // Apply limit if provided
      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error fetching repair waivers:", error)
        throw error
      }

      console.log(`Repair waivers fetched for ${location}:`, data)
      setData(data || [])
      setFilteredData(data || [])

      // Initialize note states after fetching data
      const initialNoteStates: { [id: string]: string } = {}
      data?.forEach((waiver) => {
        initialNoteStates[waiver.id] = waiver.additional_notes ?? ""
      })
      setNoteStates(initialNoteStates)

      // Initialize saving states
      const initialSavingStates: { [id: string]: boolean } = {}
      data?.forEach((waiver) => {
        initialSavingStates[waiver.id] = false
      })
      setSavingStates(initialSavingStates)

      // Initialize expanded states for months - expand the most recent month by default
      if (data && data.length > 0) {
        const groupedData = groupByMonth(data, (item) => item.created_at)
        const initialExpandedMonths: { [month: string]: boolean } = {}

        // Expand only the first (most recent) month
        const months = Object.keys(groupedData)
        if (months.length > 0) {
          initialExpandedMonths[months[0]] = true
        }

        setExpandedMonths(initialExpandedMonths)
      }
    } catch (error) {
      console.error("Error fetching repair waivers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update the fetchWaivers function to filter by location
  async function fetchWaivers() {
    try {
      setLoading(true)
      const { data, error } = await supabaseClient
        .from("repair_waivers")
        .select("*")
        .eq("location", location) // Filter by selected location
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setWaivers(data || [])
    } catch (error: any) {
      setError(error.message)
      console.error("Error fetching repair waivers:", error)
    } finally {
      setLoading(false)
    }
  }

  // Update the useEffect dependency array to include location
  useEffect(() => {
    async function fetchWaivers() {
      try {
        setLoading(true)
        const { data, error } = await supabaseClient
          .from("repair_waivers")
          .select("*")
          .eq("location", location) // Filter by selected location
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setWaivers(data || [])
      } catch (error: any) {
        setError(error.message)
        console.error("Error fetching repair waivers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription with proper filter for location
    const subscription = supabase
      .channel("repair_waivers_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "repair_waivers",
          filter: `location=eq.${location}`,
        },
        (payload) => {
          console.log("Repair waivers change detected:", payload)
          // Refresh data when changes occur
          fetchData()
        },
      )
      .subscribe()

    console.log("Supabase real-time subscription created for location:", location)

    fetchWaivers()

    return () => {
      console.log("Cleaning up subscription for location:", location)
      subscription.unsubscribe()
    }
  }, [location, limit, supabaseClient]) // Add location to dependency array

  // Effect to maintain focus after state updates
  useEffect(() => {
    if (activeTextareaId && textareaRefs.current[activeTextareaId]) {
      const textarea = textareaRefs.current[activeTextareaId]
      if (textarea) {
        textarea.focus()
        // Preserve cursor position at the end of the text
        const length = textarea.value.length
        textarea.setSelectionRange(length, length)
      }
    }
  }, [noteStates, activeTextareaId])

  // Effect to filter data when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = data.filter((waiver) => {
      return (
        (waiver.full_name && waiver.full_name.toLowerCase().includes(query)) ||
        (waiver.phone_number && waiver.phone_number.toLowerCase().includes(query)) ||
        (waiver.device_model && waiver.device_model.toLowerCase().includes(query)) ||
        (waiver.part_being_repaired && waiver.part_being_repaired.toLowerCase().includes(query)) ||
        (waiver.technician_name && waiver.technician_name.toLowerCase().includes(query)) ||
        (waiver.repair_amount && waiver.repair_amount.toLowerCase().includes(query)) ||
        (waiver.additional_notes && waiver.additional_notes.toLowerCase().includes(query))
      )
    })

    setFilteredData(filtered)
  }, [searchQuery, data])

  const handleSave = useCallback(
    async (waiverId: string, note: string) => {
      if (savingStates[waiverId]) return

      setSavingStates((prev) => ({ ...prev, [waiverId]: true }))

      try {
        const { error } = await supabase.from("repair_waivers").update({ additional_notes: note }).eq("id", waiverId)

        if (error) throw error

        toast({
          title: "Notes saved",
          description: "Additional notes have been updated successfully.",
          variant: "success",
        })
      } catch (error) {
        console.error("Error saving notes:", error)
        toast({
          title: "Error saving notes",
          description: "There was a problem saving your notes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setSavingStates((prev) => ({ ...prev, [waiverId]: false }))
      }
    },
    [savingStates],
  )

  const toggleMonthExpansion = (month: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }))
  }

  const columns: ColumnDef<RepairWaiver>[] = [
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return format(date, "MMM dd, yyyy")
      },
    },
    {
      accessorKey: "full_name",
      header: "Customer Name",
    },
    {
      accessorKey: "phone_number",
      header: "Phone Number",
      cell: ({ row }) => {
        const phone = row.getValue("phone_number") as string
        // Format phone number as (XXX) XXX-XXXX if it's 10 digits
        if (phone && phone.length === 10) {
          return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`
        }
        return phone
      },
    },
    {
      accessorKey: "device_model",
      header: "Device Model",
    },
    {
      accessorKey: "part_being_repaired",
      header: "Repair Type",
    },
    {
      accessorKey: "technician_name",
      header: "Technician",
    },
    // Update the repair_amount column to format as currency
    {
      accessorKey: "repair_amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("repair_amount") as string
        return formatCurrency(amount)
      },
    },
    {
      accessorKey: "additional_notes",
      header: "Additional Notes",
      cell: ({ row }) => {
        const waiver = row.original
        // const [isEditing, setIsEditing] = useState(false)
        // const [note, setNote] = useState(waiver.additional_notes ?? "")
        // const [isSaving, setIsSaving] = useState(false)
        // const textareaRef = useRef<HTMLTextAreaElement>(null)

        // Focus textarea when editing starts
        // useEffect(() => {
        //   if (isEditing && textareaRef.current) {
        //     textareaRef.current.focus()
        //   }
        // }, [isEditing])

        // const handleSave = async () => {
        //   if (note === waiver.additional_notes) {
        //     setIsEditing(false)
        //     return
        //   }

        //   setIsSaving(true)
        //   try {
        //     const { error } = await supabase
        //       .from("repair_waivers")
        //       .update({ additional_notes: note })
        //       .eq("id", waiver.id)

        //     if (error) throw error

        //     toast({
        //       title: "Notes saved",
        //       description: "Additional notes have been updated successfully.",
        //       variant: "success",
        //     })
        //     setIsEditing(false)
        //   } catch (error) {
        //     console.error("Error saving notes:", error)
        //     toast({
        //       title: "Error saving notes",
        //       description: "There was a problem saving your notes. Please try again.",
        //       variant: "destructive",
        //     })
        //   } finally {
        //     setIsSaving(false)
        //   }
        // }

        // const handleCancel = () => {
        //   setNote(waiver.additional_notes ?? "")
        //   setIsEditing(false)
        // }

        return <NotesCell waiver={waiver} />
      },
    },
  ]

  // Group waivers by month
  const groupedWaivers = groupDataByMonth(filteredData, "created_at")
  const sortedMonths = sortMonthsDescending(Object.keys(groupedWaivers))

  if (loading) {
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

  if (error) {
    return <div>Error loading repair waivers: {error}</div>
  }

  if (waivers.length === 0) {
    return <div>No repair waivers found.</div>
  }

  const exportData = () => {
    // Export data as CSV
    const headers = [
      "Date",
      "Customer Name",
      "Phone Number",
      "Device Model",
      "Repair Type",
      "Technician",
      "Amount",
      "Notes",
    ]
    const csvData = filteredData.map((waiver) => [
      format(new Date(waiver.created_at), "yyyy-MM-dd"),
      waiver.full_name,
      waiver.phone_number,
      waiver.device_model,
      waiver.part_being_repaired,
      waiver.technician_name,
      waiver.repair_amount,
      waiver.additional_notes || "",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `repair_waivers_${location}_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Group data by month
  const groupedData = groupByMonth(filteredData, (item) => item.created_at)

  // If limit is provided, only show the data without grouping
  if (limit) {
    return (
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filteredData.slice(0, limit)}
          filterColumn="full_name"
          searchPlaceholder="Search by customer name..."
          showPagination={false}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Repair Waivers</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
            {location}
          </Badge>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-teal-700 border-teal-200 hover:bg-teal-50"
            onClick={exportData}
          >
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search repair waivers by name, phone, device, technician, etc."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 w-full max-w-sm"
        />
      </div>

      {Object.keys(groupedData).length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <p className="text-gray-500">No repair waivers found for this location.</p>
        </div>
      ) : (
        sortedMonths.map((month) => {
          const monthData = groupedWaivers[month] || []
          return (
            <div key={month} className="border rounded-md mb-6 overflow-hidden">
              <div
                className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleMonthExpansion(month)}
              >
                <h3 className="text-lg font-semibold text-gray-800">{month}</h3>
                <div className="flex items-center gap-2">
                  <Badge className="bg-teal-100 text-teal-800 border-none">
                    {monthData.length} {monthData.length === 1 ? "waiver" : "waivers"}
                  </Badge>
                  {expandedMonths[month] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>

              {expandedMonths[month] && (
                <div className="p-4">
                  <DataTable
                    columns={columns}
                    data={monthData}
                    filterColumn="full_name"
                    searchPlaceholder="Search by customer name..."
                    showPagination={monthData.length > 10}
                  />
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

interface NotesCellProps {
  waiver: RepairWaiver
}

const NotesCell: React.FC<NotesCellProps> = ({ waiver }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [note, setNote] = useState(waiver.additional_notes ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (note === waiver.additional_notes) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from("repair_waivers").update({ additional_notes: note }).eq("id", waiver.id)

      if (error) throw error

      toast({
        title: "Notes saved",
        description: "Additional notes have been updated successfully.",
        variant: "success",
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving notes:", error)
      toast({
        title: "Error saving notes",
        description: "There was a problem saving your notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setNote(waiver.additional_notes ?? "")
    setIsEditing(false)
  }

  return (
    <div className="min-w-[250px]">
      {!isEditing ? (
        <div className="flex justify-between items-start">
          <p className="whitespace-pre-wrap text-sm flex-grow mr-2">{note || "No additional notes"}</p>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <Textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px] w-full p-2 text-sm"
            placeholder="Enter notes..."
            disabled={isSaving}
          />
          <div className="flex space-x-2">
            <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
