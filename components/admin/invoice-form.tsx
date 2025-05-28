"use client"

import type React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
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
import { CalendarIcon, Loader2, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { DatePickerWithFallback } from "@/components/admin/date-picker-with-fallback"
import { vendorList } from "@/lib/vendor-data"

const formSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  vendor_name: z.string().min(1, "Vendor name is required"),
  invoice_date: z.date({
    required_error: "Invoice date is required",
  }),
  amount: z.string().min(1, "Amount is required"),
  additional_notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface InvoiceFormProps {
  location: string
  onSuccess?: () => void
  children?: React.ReactNode
}

export function InvoiceForm({ location, onSuccess, children }: InvoiceFormProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_number: "",
      vendor_name: "",
      invoice_date: new Date(),
      amount: "",
      additional_notes: "",
    },
  })

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      form.setValue("invoice_date", date)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("invoice_sheets").insert({
        location,
        invoice_number: values.invoice_number,
        vendor_name: values.vendor_name,
        invoice_date: format(values.invoice_date, "yyyy-MM-dd"),
        amount: values.amount,
        additional_notes: values.additional_notes || null,
        is_paid: false,
        payment_mode: null,
        is_rma: false,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Invoice added successfully",
        description: "The invoice has been added to the system.",
      })

      form.reset({
        invoice_number: "",
        vendor_name: "",
        invoice_date: new Date(),
        amount: "",
        additional_notes: "",
      })
      setSelectedDate(new Date())
      setOpen(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error adding invoice:", error)
      toast({
        title: "Error adding invoice",
        description: "There was an error adding the invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    // Reset form when dialog is closed
    if (!newOpen) {
      form.reset({
        invoice_number: "",
        vendor_name: "",
        invoice_date: new Date(),
        amount: "",
        additional_notes: "",
      })
      setSelectedDate(new Date())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add New Invoice</DialogTitle>
          <DialogDescription>Enter the invoice details for {location} location.</DialogDescription>
        </DialogHeader>
        <div
          className="overflow-y-auto flex-1 pr-1"
          style={{ maxHeight: "calc(90vh - 180px)", WebkitOverflowScrolling: "touch" }}
        >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="invoice_number" className="text-sm font-medium">
                Invoice Number
              </label>
              <Input
                id="invoice_number"
                placeholder="Enter invoice number"
                {...form.register("invoice_number")}
                className={form.formState.errors.invoice_number ? "border-red-500" : ""}
              />
              {form.formState.errors.invoice_number && (
                <p className="text-sm text-red-500">{form.formState.errors.invoice_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="vendor_name" className="text-sm font-medium">
                Vendor Name
              </label>
              <div className="relative">
                <select
                  id="vendor_name"
                  className={`w-full h-10 px-3 py-2 rounded-md border ${
                    form.formState.errors.vendor_name ? "border-red-500" : "border-input"
                  } bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
                  value={form.getValues("vendor_name")}
                  onChange={(e) => {
                    form.setValue("vendor_name", e.target.value)
                  }}
                >
                  <option value="">Select vendor...</option>
                  {vendorList.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <CalendarIcon className="h-4 w-4 opacity-50" />
                </div>
              </div>
              {form.formState.errors.vendor_name && (
                <p className="text-sm text-red-500">{form.formState.errors.vendor_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="invoice_date" className="text-sm font-medium">
                Invoice Date
              </label>
              <DatePickerWithFallback
                selected={selectedDate}
                onSelect={handleDateSelect}
                hasError={!!form.formState.errors.invoice_date}
              />
              {form.formState.errors.invoice_date && (
                <p className="text-sm text-red-500">{form.formState.errors.invoice_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount
              </label>
              <Input
                id="amount"
                placeholder="Enter amount"
                {...form.register("amount")}
                onChange={(e) => {
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^\d.]/g, "")
                  form.setValue("amount", value)
                }}
                className={form.formState.errors.amount ? "border-red-500" : ""}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
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
          </form>
        </div>
        <DialogFooter className="pt-4 mt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Invoice"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
