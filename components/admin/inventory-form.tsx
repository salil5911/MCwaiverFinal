"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase, type Location } from "@/lib/supabase"
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
// Add this import at the top of the file with the other imports
import { DatePickerWithFallback } from "./date-picker-with-fallback"

// Update the formSchema to include deviceType
const formSchema = z.object({
  purchase_date: z.date({
    required_error: "Purchase date is required",
  }),
  device_model: z.string().min(1, "Device model is required"),
  device_type: z.string().min(1, "Device type is required"),
  storage: z.string().min(1, "Storage is required"),
  color: z.string().optional(),
  vendor_name: z.string().min(1, "Vendor name is required"),
  cost_price: z.string().min(1, "Cost price is required"),
  imei_number: z.string().min(1, "IMEI number is required"),
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

  // Update the defaultValues in the form.useForm call to include deviceType
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchase_date: new Date(),
      device_model: "",
      device_type: "Phone", // Default to Phone
      storage: "",
      color: "",
      vendor_name: "",
      cost_price: "",
      imei_number: "",
      additional_notes: "",
    },
  })

  // Update the onSubmit function to include deviceType
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      // Combine IMEI number with additional notes since the column doesn't exist yet
      const combinedNotes = `IMEI: ${values.imei_number}${values.additional_notes ? `\n\n${values.additional_notes}` : ""}`

      // Replace the date handling section in onSubmit with this:
      // FIXED DATE HANDLING:
      const purchaseDate = new Date(values.purchase_date)
      const correctDate = purchaseDate.toLocaleDateString("en-CA") // Gives YYYY-MM-DD format

      console.log("Selected date:", values.purchase_date)
      console.log("Formatted date to save:", correctDate)

      const { error } = await supabase.from("device_inventory").insert({
        location,
        purchase_date: correctDate, // Use the local date string without timezone conversion
        device_model: values.device_model,
        device_type: values.device_type,
        storage: values.storage,
        color: values.color || null,
        vendor_name: values.vendor_name,
        cost_price: values.cost_price,
        additional_notes: combinedNotes,
        is_sold: false,
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
        storage: "",
        color: "",
        vendor_name: "",
        cost_price: "",
        imei_number: "",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" /> Add Device
          </Button>
        )}
      </DialogTrigger>
      {/* Find the Dialog content section and update it to be scrollable on iPads
      // Replace the DialogContent section with this: */}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Device to Inventory</DialogTitle>
          <DialogDescription>Enter the device details for {location} location.</DialogDescription>
        </DialogHeader>
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

            {/* Add the device type field in the form */}
            {/* Add this after the device_model field in the form */}
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
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Watch">Watch</SelectItem>
                  <SelectItem value="iPad">iPad</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.device_type && (
                <p className="text-sm text-red-500">{form.formState.errors.device_type.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="storage" className="text-sm font-medium">
                  Storage
                </label>
                {/* Update the storage dropdown options */}
                <Select
                  onValueChange={(value) => form.setValue("storage", value)}
                  defaultValue={form.getValues("storage")}
                >
                  <SelectTrigger id="storage" className={form.formState.errors.storage ? "border-red-500" : ""}>
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
                {form.formState.errors.storage && (
                  <p className="text-sm text-red-500">{form.formState.errors.storage.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="color" className="text-sm font-medium">
                  Color
                </label>
                <Input id="color" placeholder="e.g., Black, White, Gold" {...form.register("color")} />
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
                // Remove the onChange handler that was causing the cursor jump
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
      </DialogContent>
    </Dialog>
  )
}
