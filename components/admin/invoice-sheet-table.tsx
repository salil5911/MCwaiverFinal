"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase, getSupabaseClient } from "@/lib/supabase"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Search, Plus, Loader2, Edit, Save, X, Calendar, Check, FileText } from "lucide-react"
import { InvoiceForm } from "./invoice-form"
import { RmaForm } from "./rma-form"
import type { ColumnDef } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { groupDataByMonth, sortMonthsDescending } from "@/lib/date-utils"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/format-utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { vendorList } from "@/lib/vendor-data"

interface InvoiceSheetTableProps {
  location: string
  limit?: number
}

export default function InvoiceSheetTable({ location, limit }: InvoiceSheetTableProps) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const supabaseClient = getSupabaseClient() // Use our wrapper instead

  // Add states for notes editing
  const [noteStates, setNoteStates] = useState<{ [id: string]: string }>({})
  const [savingStates, setSavingStates] = useState<{ [id: string]: boolean }>({})
  const [activeTextareaId, setActiveTextareaId] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{ [key: string]: any }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [vendorOpen, setVendorOpen] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [vendorFilter, setVendorFilter] = useState<string | null>(null)
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"invoices" | "rma">("invoices")
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<string[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>("all")

  // Add these refs to maintain focus
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({})
  const activeFieldId = useRef<string | null>(null)
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})

  // Function to refresh data after adding a new invoice
  const handleInvoiceAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true)
        const { data, error } = await supabaseClient
          .from("invoice_sheets")
          .select("*")
          .eq("location", location)
          .order("invoice_date", { ascending: false })

        if (error) {
          throw error
        }

        setInvoices(data || [])
        setFilteredInvoices(data || [])

        // Initialize note states
        const initialNoteStates: { [id: string]: string } = {}
        data?.forEach((invoice) => {
          initialNoteStates[invoice.id] = invoice.additional_notes ?? ""
        })
        setNoteStates(initialNoteStates)

        // Initialize saving states
        const initialSavingStates: { [id: string]: boolean } = {}
        data?.forEach((invoice) => {
          initialSavingStates[invoice.id] = false
        })
        setSavingStates(initialSavingStates)
      } catch (error: any) {
        setError(error.message)
        console.error("Error fetching invoices:", error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchData() {
      setLoading(true)

      try {
        // Ensure we're using the exact location string in the query
        const locationStr = String(location).trim()

        let query = supabase
          .from("invoice_sheets")
          .select("*")
          .eq("location", locationStr)
          .order("invoice_date", { ascending: false })

        // Apply limit if provided
        if (limit) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
          throw error
        }

        // Ensure all date fields are valid before setting data
        const validatedData =
          data?.map((item) => ({
            ...item,
            // Ensure invoice_date is valid
            invoice_date: item.invoice_date || format(new Date(), "yyyy-MM-dd"),
          })) || []

        setInvoices(validatedData)
        setFilteredInvoices(validatedData)

        // Extract unique vendor names for the filter
        const uniqueVendors = Array.from(new Set(validatedData.map((item) => item.vendor_name)))
          .filter(Boolean)
          .sort() as string[]

        setVendors(uniqueVendors)
      } catch (error) {
        console.error("Error fetching invoice sheet:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription
    const subscription = supabase
      .channel("invoice_sheets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoice_sheets",
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
  }, [supabaseClient, location, refreshTrigger])

  // Apply vendor filter when it changes
  useEffect(() => {
    // First filter by vendor if a filter is applied
    let filtered = vendorFilter ? invoices.filter((invoice) => invoice.vendor_name === vendorFilter) : [...invoices]

    // Then filter by tab type (invoice vs RMA)
    filtered = filtered.filter((invoice) => (activeTab === "invoices" ? !invoice.is_rma : invoice.is_rma))

    setFilteredInvoices(filtered)
  }, [vendorFilter, invoices, activeTab])

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

  // Add an effect to restore focus after re-render:
  useEffect(() => {
    // If we have an active field and we're still editing, restore focus
    if (activeFieldId.current && editingRow) {
      const input = inputRefs.current[activeFieldId.current]
      if (input) {
        input.focus()

        // For text inputs, place cursor at the end
        if ("selectionStart" in input) {
          const length = input.value.length
          input.selectionStart = length
          input.selectionEnd = length
        }
      }
    }
  }, [editFormData, editingRow])

  // Handle saving notes
  const handleSave = useCallback(
    async (invoiceId: string, note: string) => {
      if (savingStates[invoiceId]) return

      setSavingStates((prev) => ({ ...prev, [invoiceId]: true }))

      try {
        const { error } = await supabase.from("invoice_sheets").update({ additional_notes: note }).eq("id", invoiceId)

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
        setSavingStates((prev) => ({ ...prev, [invoiceId]: false }))
      }
    },
    [savingStates],
  )

  // Handle starting to edit a row
  const handleEditRow = useCallback((invoice: any) => {
    setEditingRow(invoice.id)
    setEditFormData({
      invoice_number: invoice.invoice_number,
      vendor_name: invoice.vendor_name,
      amount: invoice.amount,
      invoice_date: invoice.invoice_date,
      additional_notes: invoice.additional_notes || "",
      is_paid: invoice.is_paid || false,
      payment_mode: invoice.payment_mode || "none", // Changed from empty string to "none"
      is_rma: invoice.is_rma || false,
      rma_status: invoice.rma_status || "RMA Sent – Waiting for Approval", // Updated default
    })
  }, [])

  // Add a function to handle input changes while preserving focus:
  const handleInputChange = useCallback((field: string, value: any, id?: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))

    // Remember which field is being edited
    if (id) {
      activeFieldId.current = id
    }
  }, [])

  // Handle saving an edited row
  const handleSaveRow = useCallback(
    async (invoiceId: string) => {
      setIsSubmitting(true)
      try {
        // Format amount if needed
        let formattedAmount = editFormData.amount
        if (formattedAmount && !formattedAmount.startsWith("$")) {
          formattedAmount = formatCurrency(formattedAmount)
        }

        const { error } = await supabase
          .from("invoice_sheets")
          .update({
            invoice_number: editFormData.invoice_number,
            vendor_name: editFormData.vendor_name,
            amount: formattedAmount,
            invoice_date: editFormData.invoice_date,
            additional_notes: editFormData.additional_notes,
            is_paid: editFormData.is_paid,
            payment_mode: editFormData.payment_mode === "none" ? null : editFormData.payment_mode, // Handle "none" value
            rma_status: editFormData.is_rma ? editFormData.rma_status : null,
          })
          .eq("id", invoiceId)

        if (error) throw error

        toast({
          title: "Invoice updated",
          description: "The invoice has been updated successfully.",
          variant: "success",
        })

        // Reset editing state
        setEditingRow(null)
        setEditFormData({})

        // Refresh data
        setRefreshTrigger((prev) => prev + 1)
      } catch (error) {
        console.error("Error updating invoice:", error)
        toast({
          title: "Error updating invoice",
          description: "There was a problem updating the invoice. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [editFormData, supabase],
  )

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingRow(null)
    setEditFormData({})
  }

  // Handle row selection
  const handleRowSelection = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedRows((prev) => [...prev, id])
    } else {
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id))
    }
  }

  // Handle select all rows
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = filteredInvoices.map((invoice) => invoice.id)
      setSelectedRows(allIds)
    } else {
      setSelectedRows([])
    }
  }

  // Add a separate effect for filtering that runs when search query or tab changes
  useEffect(() => {
    if (invoices.length > 0) {
      applyFilters(invoices, searchQuery, activeTab, selectedVendor)
    }
  }, [invoices, searchQuery, activeTab, selectedVendor])

  // Apply filters based on search query and tab
  const applyFilters = (items: any[], query: string, tab: string, vendor: string) => {
    let filtered = [...items]

    // Apply tab filter
    if (tab === "invoices") {
      filtered = filtered.filter((item) => !item.is_rma)
    } else if (tab === "rma") {
      filtered = filtered.filter((item) => item.is_rma)
    }

    // Apply vendor filter
    if (vendor !== "all") {
      filtered = filtered.filter((item) => item.vendor_name === vendor)
    }

    // Apply search filter if query exists
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim()
      filtered = filtered.filter((item) => {
        // Search in vendor name
        if (item.vendor_name?.toLowerCase().includes(lowerQuery)) return true

        // Search in invoice number
        if (item.invoice_number?.toLowerCase().includes(lowerQuery)) return true

        // Search in notes
        if (item.additional_notes?.toLowerCase().includes(lowerQuery)) return true

        // Search in invoice amount
        if (item.amount?.toLowerCase().includes(lowerQuery)) return true

        return false
      })
    }

    setFilteredInvoices(filtered)
  }

  // Handle search query changes
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(invoices, query, activeTab, selectedVendor)
  }

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as "invoices" | "rma")
    applyFilters(invoices, searchQuery, value, selectedVendor)
  }

  // Handle vendor filter changes
  const handleVendorChange = (value: string) => {
    setSelectedVendor(value)
    applyFilters(invoices, searchQuery, activeTab, value)
  }

  // Define the column structure for the invoice sheet table
  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="px-1">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            checked={filteredInvoices.length > 0 && selectedRows.length === filteredInvoices.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
        </div>
      ),
      cell: ({ row }) => {
        const invoice = row.original
        return (
          <div className="px-1">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              checked={selectedRows.includes(invoice.id)}
              onChange={(e) => handleRowSelection(invoice.id, e.target.checked)}
            />
          </div>
        )
      },
    },
    {
      header: "Invoice Number",
      accessorKey: "invoice_number",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id
        const fieldId = `invoice_number_${invoice.id}`

        if (isEditing) {
          return (
            <Input
              ref={(el) => (inputRefs.current[fieldId] = el)}
              value={editFormData.invoice_number}
              onChange={(e) => handleInputChange("invoice_number", e.target.value, fieldId)}
              className="w-full"
            />
          )
        }

        return invoice.invoice_number
      },
    },
    {
      header: "Vendor Name",
      accessorKey: "vendor_name",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id
        const fieldId = `vendor_name_${invoice.id}`

        if (isEditing) {
          return (
            <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={vendorOpen} className="w-full justify-between">
                  {editFormData.vendor_name || "Select vendor..."}
                  <Calendar className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search vendor..." className="h-9" />
                  <CommandList className="max-h-[200px] overflow-y-auto">
                    <CommandEmpty>No vendor found.</CommandEmpty>
                    <CommandGroup>
                      {vendorList.map((vendor) => (
                        <CommandItem
                          key={vendor}
                          value={vendor}
                          onSelect={() => {
                            handleInputChange("vendor_name", vendor, fieldId)
                            setVendorOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          {vendor}
                          {editFormData.vendor_name === vendor && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )
        }

        return invoice.vendor_name
      },
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id
        const fieldId = `amount_${invoice.id}`

        if (isEditing) {
          return (
            <Input
              ref={(el) => (inputRefs.current[fieldId] = el)}
              value={editFormData.amount}
              onChange={(e) => {
                // Only allow numbers and decimal point
                const value = e.target.value.replace(/[^\d.]/g, "")
                handleInputChange("amount", value, fieldId)
              }}
              className="w-full"
            />
          )
        }

        return formatCurrency(invoice.amount)
      },
    },
    {
      header: "Invoice Date",
      accessorKey: "invoice_date",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id

        if (isEditing) {
          return (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {editFormData.invoice_date ? format(new Date(editFormData.invoice_date), "PPP") : "Pick a date"}
                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={editFormData.invoice_date ? new Date(editFormData.invoice_date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleInputChange("invoice_date", format(date, "yyyy-MM-dd"))
                      setCalendarOpen(false)
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )
        }

        const date = parseISO(invoice.invoice_date)
        return format(date, "MMM dd, yyyy")
      },
    },
    {
      header: "Paid Status",
      accessorKey: "is_paid",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id

        // Don't show paid status for RMAs
        if (invoice.is_rma) {
          return null
        }

        if (isEditing) {
          return (
            <div className="flex items-center space-x-2">
              <Switch
                checked={editFormData.is_paid}
                onCheckedChange={(checked) => handleInputChange("is_paid", checked)}
              />
              <Label>{editFormData.is_paid ? "Paid" : "Unpaid"}</Label>
            </div>
          )
        }

        return (
          <div className={`font-medium ${invoice.is_paid ? "text-green-600" : "text-amber-600"}`}>
            {invoice.is_paid ? "Paid" : "Unpaid"}
          </div>
        )
      },
    },
    {
      header: "Payment Mode",
      accessorKey: "payment_mode",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id

        // Don't show payment mode for RMAs
        if (invoice.is_rma) {
          return null
        }

        if (isEditing) {
          return (
            <Select
              value={editFormData.payment_mode || "none"}
              onValueChange={(value) => handleInputChange("payment_mode", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Debit Card">Debit Card</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          )
        }

        return invoice.payment_mode || "-"
      },
    },
    {
      header: "RMA Status",
      accessorKey: "rma_status",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id

        // Only show RMA status for RMAs
        if (!invoice.is_rma) {
          return null
        }

        if (isEditing) {
          return (
            <Select
              value={editFormData.rma_status || "RMA Sent – Waiting for Approval"}
              onValueChange={(value) => handleInputChange("rma_status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select RMA status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RMA Sent – Waiting for Approval">RMA Sent – Waiting for Approval ⏳</SelectItem>
                <SelectItem value="RMA Accepted">RMA Accepted ✅</SelectItem>
                <SelectItem value="RMA Declined">RMA Declined ❌</SelectItem>
              </SelectContent>
            </Select>
          )
        }

        // Return appropriate styling based on status
        if (invoice.rma_status === "RMA Accepted") {
          return <div className="font-medium text-green-600">RMA Accepted ✅</div>
        } else if (invoice.rma_status === "RMA Declined") {
          return <div className="font-medium text-red-600">RMA Declined ❌</div>
        } else {
          return <div className="font-medium text-blue-500">RMA Sent – Waiting for Approval ⏳</div>
        }
      },
    },
    {
      header: "Additional Notes",
      accessorKey: "additional_notes",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id
        const fieldId = `additional_notes_${invoice.id}`

        if (isEditing) {
          return (
            <Textarea
              ref={(el) => (inputRefs.current[fieldId] = el)}
              value={editFormData.additional_notes}
              onChange={(e) => handleInputChange("additional_notes", e.target.value, fieldId)}
              className="min-h-[120px] w-full resize-vertical"
              placeholder="Enter notes..."
            />
          )
        }

        const note = noteStates[invoice.id] ?? ""
        const isSaving = savingStates[invoice.id] ?? false

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          setNoteStates((prev) => ({ ...prev, [invoice.id]: e.target.value }))
          setActiveTextareaId(invoice.id)
        }

        const handleBlur = () => {
          if (note !== invoice.additional_notes) {
            handleSave(invoice.id, note)
          }
          setActiveTextareaId(null)
        }

        const handleFocus = () => {
          setActiveTextareaId(invoice.id)
        }

        return (
          <div dir="ltr" className="ltr text-left">
            <div className="flex flex-col">
              <textarea
                ref={(el) => (textareaRefs.current[invoice.id] = el)}
                value={note}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className="min-h-[80px] min-w-[200px] w-full p-2 border rounded text-left resize-vertical"
                dir="ltr"
                style={{
                  unicodeBidi: "normal",
                  direction: "ltr",
                  textAlign: "left",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
                placeholder="Enter notes..."
                disabled={isSaving || isEditing}
              />
              {isSaving && (
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original
        const isEditing = editingRow === invoice.id

        if (isEditing) {
          return (
            <div className="flex space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSaveRow(invoice.id)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSubmitting}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )
        }

        return (
          <Button variant="outline" size="sm" onClick={() => handleEditRow(invoice)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )
      },
    },
  ]

  // Group invoices by month
  const groupedInvoices = groupDataByMonth(filteredInvoices, "invoice_date")
  const sortedMonths = sortMonthsDescending(Object.keys(groupedInvoices))

  const shouldShowLimitedData = limit && filteredInvoices.length > 0

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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold">Purchase & Invoice Sheet</h2>
        <div className="flex gap-2">
          {activeTab === "rma" ? (
            <RmaForm location={location} onSuccess={handleInvoiceAdded} />
          ) : (
            <InvoiceForm location={location} onSuccess={handleInvoiceAdded}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" /> Add New Invoice
              </Button>
            </InvoiceForm>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="rma">RMAs</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by vendor, invoice number, etc."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        {/* Vendor filter */}
        <div className="w-full md:w-64">
          <Select value={selectedVendor} onValueChange={handleVendorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div>Error loading data: {error}</div>
      ) : shouldShowLimitedData ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent {activeTab === "invoices" ? "Invoices" : "RMAs"}</h2>
          </div>
          <DataTable
            data={filteredInvoices.slice(0, limit)}
            columns={columns}
            showPagination={false}
            rowClassName={(row) => {
              if (selectedRows.includes(row.id)) return "bg-red-100"
              if (row.is_rma) {
                if (row.rma_status === "RMA Accepted") return "bg-green-100"
                else if (row.rma_status === "RMA Declined") return "bg-red-100"
                else return "bg-blue-50" // Neutral styling for waiting status
              }
              return ""
            }}
          />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {vendorFilter
              ? `No ${activeTab === "invoices" ? "invoices" : "RMAs"} found for vendor "${vendorFilter}". Try selecting a different vendor or clear the filter.`
              : `No ${activeTab === "invoices" ? "invoices" : "RMAs"} found. Add your first ${activeTab === "invoices" ? "invoice" : "RMA"} using the button above.`}
          </p>
        </div>
      ) : (
        sortedMonths.map((month) => (
          <div key={month} className="mb-8">
            <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-700 border-b pb-2">{month}</h3>
            <DataTable
              data={groupedInvoices[month]}
              columns={columns}
              rowClassName={(row) => {
                if (selectedRows.includes(row.id)) return "bg-red-100"
                if (row.is_rma) {
                  if (row.rma_status === "RMA Accepted") return "bg-green-100"
                  else if (row.rma_status === "RMA Declined") return "bg-red-100"
                  else return "bg-blue-50" // Neutral styling for waiting status
                }
                return ""
              }}
            />
          </div>
        ))
      )}
    </div>
  )
}
