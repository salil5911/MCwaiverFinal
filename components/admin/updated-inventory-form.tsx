"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase, type Location, refreshSchemaCache } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/format-utils"
import { DatePickerWithFallback } from "./date-picker-with-fallback"

const formSchema = z.object({
  purchase_date: z.date({
    required_error: "Purchase date is required",
  }),
  device_model: z.string().min(1, "Device model is required"),
  device_type: z.string().min(1, "Device type is required"),
  vendor_name: z.string().min(1, "Vendor name is required"),
  cost_price: z.string().min(1, "Cost price is required"),
  imei_number: z.string().min(1, "IMEI number is required"),
  storage: z.string().optional(),
  color: z.string().optional(),
  additional_notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface InventoryFormProps {
  location: Location
  onSuccess?: () => void
  children?: React.ReactNode
}

export function InventoryForm({ location, onSuccess, children }: InventoryFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchase_date: new Date(),
      device_model: "",
      device_type: "Phone",
      vendor_name: "",
      cost_price: "",
      imei_number: "",
      storage: "",
      color: "",
      additional_notes: "",
    },
  })

  // Refresh schema cache when dialog opens
  useEffect(() => {
    if (open) {
      const refreshSchema = async () => {
        setIsRefreshingSchema(true)
        try {
          await refreshSchemaCache()
        } catch (error) {
          console.error("Error refreshing schema cache:", error)
        } finally {
          setIsRefreshingSchema(false)
        }
      }
      refreshSchema()
    }
  }, [open])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      // Format the cost price with $ sign if not already formatted
      const formattedCostPrice = values.cost_price.startsWith("$")
        ? values.cost_price
        : formatCurrency(values.cost_price)

      // Combine IMEI number with additional notes
      const combinedNotes = `IMEI: ${values.imei_number}${values.additional_notes ? `\n\n${values.additional_notes}` : ""}`

      // First refresh the schema cache to ensure we have the latest schema
      await refreshSchemaCache()

      // COMPLETELY REWORKED DATE HANDLING:
      // 1. Get the date object
      const purchaseDate = new Date(values.purchase_date)
      // 2. Extract only the date part in ISO format (YYYY-MM-DD)
      const correctDate = purchaseDate.toISOString().split("T")[0]

      console.log("Selected date:", values.purchase_date)
      console.log("Formatted date to save:", correctDate)

      const { error } = await supabase.from("device_inventory").insert({
        location,
        purchase_date: correctDate, // Use the ISO date string without time component
        device_model: values.device_model,
        device_type: values.device_type,
        vendor_name: values.vendor_name,
        cost_price: formattedCostPrice,
        additional_notes: combinedNotes,
        is_sold: false,
        storage: values.storage || null,
        color: values.color || null,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Inventory item added successfully",
        description: "The device has been added to inventory.",
      })

      form.reset({
        purchase_date: new Date(),
        device_model: "",
        device_type: "Phone",
        vendor_name: "",
        cost_price: "",
        imei_number: "",
        storage: "",
        color: "",
        additional_notes: "",
      })
      setOpen(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error adding inventory item:", error)
      toast({
        title: "Error adding inventory item",
        description: "There was an error adding the device. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("purchase_date", date)
      // Close the calendar after selection
      setTimeout(() => setCalendarOpen(false), 100)
    }
  }

  // Updated storage options including watch sizes
  const storageOptions = [
    "-",
    "16GB",
    "32GB",
    "38mm",
    "40mm",
    "41mm",
    "42mm",
    "45mm",
    "46mm",
    "49mm",
    "64GB",
    "128GB",
    "256GB",
    "512GB",
    "1TB",
  ]

  // Device type options
  const deviceTypeOptions = ["Phone", "Watch", "iPad", "Tablet", "Other"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" /> Add Device
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Device to Inventory</DialogTitle>
          <DialogDescription>Enter the device details for {location} location.</DialogDescription>
        </DialogHeader>
        {isRefreshingSchema ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2">Preparing form...</span>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[70vh] pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="purchase_date" className="text-sm font-medium">
                  Purchase Date
                </label>
                <DatePickerWithFallback
                  selected={form.getValues("purchase_date")}
                  onSelect={handleDateSelect}
                  calendarOpen={calendarOpen}
                  setCalendarOpen={setCalendarOpen}
                  hasError={!!form.formState.errors.purchase_date}
                />
                {form.formState.errors.purchase_date && (
                  <p className="text-sm text-red-500">{form.formState.errors.purchase_date.message}</p>
                )}
              </div>

              {/* Device Type Selection */}
              <div className="space-y-2">
                <label htmlFor="device_type" className="text-sm font-medium">
                  Device Type
                </label>
                <Select
                  onValueChange={(value) => form.setValue("device_type", value)}
                  defaultValue={form.getValues("device_type")}
                >
                  <SelectTrigger id="device_type" className={form.formState.errors.device_type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.device_type && (
                  <p className="text-sm text-red-500">{form.formState.errors.device_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="device_model" className="text-sm font-medium">
                  Device Model
                </label>
                <Input
                  id="device_model"
                  placeholder="e.g., iPhone 13 Pro, Galaxy S22"
                  {...form.register("device_model")}
                  className={form.formState.errors.device_model ? "border-red-500" : ""}
                />
                {form.formState.errors.device_model && (
                  <p className="text-sm text-red-500">{form.formState.errors.device_model.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storage" className="text-sm font-medium">
                    Storage
                  </Label>
                  <Select
                    onValueChange={(value) => form.setValue("storage", value)}
                    defaultValue={form.getValues("storage")}
                  >
                    <SelectTrigger id="storage">
                      <SelectValue placeholder="Select storage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">-</SelectItem>
                      <SelectItem value="16GB">16GB</SelectItem>
                      <SelectItem value="32GB">32GB</SelectItem>
                      <SelectItem value="38mm">38mm</SelectItem>
                      <SelectItem value="40mm">40mm</SelectItem>
                      <SelectItem value="41mm">41mm</SelectItem>
                      <SelectItem value="42mm">42mm</SelectItem>
                      <SelectItem value="44mm">44mm</SelectItem>
                      <SelectItem value="45mm">45mm</SelectItem>
                      <SelectItem value="46mm">46mm</SelectItem>
                      <SelectItem value="49mm">49mm</SelectItem>
                      <SelectItem value="64GB">64GB</SelectItem>
                      <SelectItem value="128GB">128GB</SelectItem>
                      <SelectItem value="256GB">256GB</SelectItem>
                      <SelectItem value="512GB">512GB</SelectItem>
                      <SelectItem value="1TB">1TB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm font-medium">
                    Color
                  </Label>
                  <Input id="color" placeholder="e.g., Black, Silver, Gold" {...form.register("color")} />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="vendor_name" className="text-sm font-medium">
                  Vendor Name
                </label>
                <Input
                  id="vendor_name"
                  placeholder="Enter vendor name"
                  {...form.register("vendor_name")}
                  className={form.formState.errors.vendor_name ? "border-red-500" : ""}
                />
                {form.formState.errors.vendor_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.vendor_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="cost_price" className="text-sm font-medium">
                  Cost Price
                </label>
                <Input
                  id="cost_price"
                  placeholder="Enter cost price"
                  {...form.register("cost_price")}
                  className={form.formState.errors.cost_price ? "border-red-500" : ""}
                />
                {form.formState.errors.cost_price && (
                  <p className="text-sm text-red-500">{form.formState.errors.cost_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="imei_number" className="text-sm font-medium">
                  IMEI Number
                </label>
                <Input
                  id="imei_number"
                  placeholder="Enter device IMEI number"
                  {...form.register("imei_number")}
                  className={form.formState.errors.imei_number ? "border-red-500" : ""}
                />
                {form.formState.errors.imei_number && (
                  <p className="text-sm text-red-500">{form.formState.errors.imei_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="additional_notes" className="text-sm font-medium">
                  Additional Notes (Optional)
                </label>
                <Textarea
                  id="additional_notes"
                  placeholder="Enter any additional notes"
                  className="resize-none"
                  {...form.register("additional_notes")}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add to Inventory"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
