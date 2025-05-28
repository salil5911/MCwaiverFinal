"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { z } from "zod"
import SignaturePad from "../device-repair-waiver/signature-pad"
import TermsAndConditions from "./terms-and-conditions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Download, Loader2 } from "lucide-react"
import { generateWaiverPDF } from "./pdf-generator"
import { cn } from "@/lib/utils"
import SuccessAnimation from "../device-repair-waiver/success-animation"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/format-utils"
import { ChevronDown } from "lucide-react"

// Define the form schema with validation
const formSchema = z.object({
  date: z.string(),
  location: z.string({
    required_error: "Please select a location",
  }),
  deviceModel: z.string().min(2, {
    message: "Device model must be at least 2 characters.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  phoneNumber: z.string().regex(/^\d{10}$/, {
    message: "Phone number must be 10 digits.",
  }),
  imei: z.string().min(15, {
    message: "IMEI must be at least 15 characters.",
  }),
  price: z.string().min(1, {
    message: "Please enter the price.",
  }),
  idNumber: z.string().min(2, {
    message: "Please enter a valid ID number.",
  }),
  additionalNotes: z.string().optional(),
  signature: z.string().min(1, {
    message: "Please provide your signature.",
  }),
})

// Custom Select Component
function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  disabled?: boolean
  error?: string
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus:ring-destructive",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
      {error && <p className="text-sm font-medium text-destructive mt-1">{error}</p>}
    </div>
  )
}

// Form field wrapper component
function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}

export default function DeviceSellingWaiver() {
  const router = useRouter()
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [formValues, setFormValues] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    location: "",
    deviceModel: "",
    fullName: "",
    phoneNumber: "",
    imei: "",
    price: "",
    idNumber: "",
    additionalNotes: "",
    signature: "",
  })

  // Effect to handle redirection after successful submission
  useEffect(() => {
    if (isSubmitted && pdfGenerated) {
      // Scroll to top
      window.scrollTo(0, 0)

      // Show success animation
      setShowSuccessAnimation(true)

      // Redirect to home after animation (3 seconds)
      const redirectTimer = setTimeout(() => {
        router.push("/")
      }, 3000)

      // Clean up timer if component unmounts
      return () => clearTimeout(redirectTimer)
    }
  }, [isSubmitted, pdfGenerated, router])

  // Handle input change
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error for this field when it changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Handle location change
  const handleLocationChange = (location: string) => {
    setFormData((prev) => ({
      ...prev,
      location,
    }))

    // Clear location error
    if (errors.location) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.location
        return newErrors
      })
    }
  }

  // Save data to Supabase
  const saveToSupabase = async () => {
    try {
      console.log("Saving selling waiver to Supabase with data:", {
        location: formData.location,
        device_model: formData.deviceModel,
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        imei: formData.imei,
        price: formData.price,
        id_number: formData.idNumber,
        additional_notes: formData.additionalNotes || null,
        signature_url: formData.signature,
      })

      const { data, error } = await supabase
        .from("selling_waivers")
        .insert({
          location: formData.location,
          device_model: formData.deviceModel,
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          imei: formData.imei,
          price: formData.price,
          id_number: formData.idNumber,
          additional_notes: formData.additionalNotes || null,
          signature_url: formData.signature,
          // pdf_url will be added later if needed
        })
        .select()

      if (error) {
        throw error
      }

      console.log("Selling waiver saved successfully:", data)
      return true
    } catch (error) {
      console.error("Error saving to Supabase:", error)
      toast({
        title: "Error saving data",
        description: "There was an error saving your waiver data. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasReadTerms) {
      alert("Please read the Terms and Conditions completely before submitting.")
      return
    }

    // Validate form using zod
    const result = formSchema.safeParse(formData)

    if (!result.success) {
      // Extract and format validation errors
      const formattedErrors: Record<string, string> = {}
      result.error.errors.forEach((error) => {
        const path = error.path[0].toString()
        formattedErrors[path] = error.message
      })
      setErrors(formattedErrors)
      return
    }

    // Clear any previous errors
    setErrors({})
    setIsSubmitting(true)

    try {
      // Format the price for display and storage
      const dataWithFormattedPrice = {
        ...formData,
        price: formData.price.startsWith("$") ? formData.price : formatCurrency(formData.price),
      }

      // Save to Supabase
      const saved = await saveToSupabase()

      if (!saved) {
        setIsSubmitting(false)
        return
      }

      // Store form values for PDF generation
      setFormValues(dataWithFormattedPrice)
      setIsSubmitted(true)

      // Generate PDF with formatted price
      generateWaiverPDF(dataWithFormattedPrice)
      setPdfGenerated(true)
    } catch (error) {
      console.error("Error during submission:", error)
      toast({
        title: "Error",
        description: "There was an error processing your submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle regenerating the PDF
  const handleRegeneratePDF = () => {
    if (formValues) {
      generateWaiverPDF(formValues)
    }
  }

  // Reset the form
  const resetForm = () => {
    setIsSubmitted(false)
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      location: "",
      deviceModel: "",
      fullName: "",
      phoneNumber: "",
      imei: "",
      price: "",
      idNumber: "",
      additionalNotes: "",
      signature: "",
    })
    setHasReadTerms(false)
    setPdfGenerated(false)
    setFormValues(null)
    setErrors({})
  }

  if (showSuccessAnimation) {
    return <SuccessAnimation />
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800 text-lg font-semibold">Submission Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Thank you for submitting your selling waiver.{" "}
            {pdfGenerated ? "Your PDF has been generated and downloaded." : ""}
          </AlertDescription>
        </Alert>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleRegeneratePDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF Again
          </Button>

          <Button variant="outline" onClick={resetForm}>
            Submit Another Waiver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-8">Device Selling Waiver</h1>

      {/* Terms and Conditions Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Terms and Conditions</CardTitle>
          <CardDescription>Please read the following terms and conditions carefully before proceeding.</CardDescription>
        </CardHeader>
        <CardContent>
          <TermsAndConditions onComplete={() => setHasReadTerms(true)} />
        </CardContent>
      </Card>

      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>
            Please fill out all required fields below to complete your device selling waiver.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Field - Auto-filled */}
              <FormField id="date" label="Date" error={errors.date}>
                <Input id="date" value={formData.date} onChange={() => {}} disabled className="bg-gray-50" />
              </FormField>

              {/* Location Dropdown */}
              <FormField id="location" label="Location" error={errors.location}>
                <CustomSelect
                  id="location"
                  value={formData.location}
                  onChange={handleLocationChange}
                  options={[
                    { value: "Augusta", label: "Augusta" },
                    { value: "Perimeter", label: "Perimeter" },
                    { value: "Cumberland", label: "Cumberland" },
                    { value: "Southlake", label: "Southlake" },
                    { value: "Lynnhaven", label: "Lynnhaven" },
                    { value: "Carolina Place", label: "Carolina Place" },
                  ]}
                  placeholder="Select a location"
                  error={errors.location}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device Model */}
              <FormField id="deviceModel" label="Device Model" error={errors.deviceModel}>
                <Input
                  id="deviceModel"
                  placeholder="e.g., iPhone 13 Pro, Galaxy S22"
                  value={formData.deviceModel}
                  onChange={(e) => handleChange("deviceModel", e.target.value)}
                  className="focus:border-teal-500 focus:ring-teal-500"
                />
              </FormField>

              {/* IMEI */}
              <FormField id="imei" label="IMEI Number" error={errors.imei}>
                <Input
                  id="imei"
                  placeholder="Enter device IMEI number"
                  value={formData.imei}
                  onChange={(e) => handleChange("imei", e.target.value)}
                  className="focus:border-teal-500 focus:ring-teal-500"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <FormField id="fullName" label="Full Name" error={errors.fullName}>
                <Input
                  id="fullName"
                  placeholder="Enter customer's full name"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="focus:border-teal-500 focus:ring-teal-500"
                />
              </FormField>

              {/* Phone Number */}
              <FormField id="phoneNumber" label="Phone Number" error={errors.phoneNumber}>
                <Input
                  id="phoneNumber"
                  placeholder="(XXX) XXX-XXXX"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, "")
                    handleChange("phoneNumber", value)
                  }}
                  maxLength={10}
                  className="focus:border-teal-500 focus:ring-teal-500"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <FormField id="price" label="Price" error={errors.price}>
                <Input
                  id="price"
                  placeholder="e.g., 499.99"
                  value={formData.price}
                  onChange={(e) => {
                    // Only allow numbers and decimal point without formatting
                    const value = e.target.value.replace(/[^\d.]/g, "")
                    handleChange("price", value)
                  }}
                  className="focus:border-teal-500 focus:ring-teal-500"
                />
              </FormField>

              {/* ID Number */}
              <FormField id="idNumber" label="ID Number" error={errors.idNumber}>
                <Input
                  id="idNumber"
                  placeholder="Enter customer's ID number"
                  value={formData.idNumber}
                  onChange={(e) => handleChange("idNumber", e.target.value)}
                  className="focus:border-teal-500 focus:ring-teal-500"
                />
              </FormField>
            </div>

            {/* Additional Notes */}
            <FormField id="additionalNotes" label="Additional Notes (Optional)" error={errors.additionalNotes}>
              <Textarea
                id="additionalNotes"
                placeholder="Enter any specific notes or concerns"
                className="min-h-[100px] focus:border-teal-500 focus:ring-teal-500"
                value={formData.additionalNotes}
                onChange={(e) => handleChange("additionalNotes", e.target.value)}
              />
            </FormField>

            {/* Signature Pad */}
            <FormField id="signature" label="Customer Signature" error={errors.signature}>
              <SignaturePad
                value={formData.signature}
                onChange={(value) => handleChange("signature", value)}
                error={errors.signature}
              />
            </FormField>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={!hasReadTerms || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Waiver"
              )}
            </Button>

            {!hasReadTerms && (
              <p className="text-sm text-amber-600 text-center">
                Please read the Terms and Conditions completely before submitting
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
