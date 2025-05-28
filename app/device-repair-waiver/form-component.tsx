"use client"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import FormField from "../components/form-field"
import CustomSelect from "../components/custom-select"
import SignaturePad from "./signature-pad"
import { getEmployeesForLocation } from "@/lib/employee-data"
// Import the formatCurrency and parseCurrency functions
import { formatCurrency } from "@/lib/format-utils"

interface FormComponentProps {
  formData: any
  setFormData: (data: any) => void
  errors?: Record<string, string>
}

export default function FormComponent({ formData, setFormData, errors = {} }: FormComponentProps) {
  // Handle input change
  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  // Handle location change
  const handleLocationChange = (location: string) => {
    setFormData({
      ...formData,
      location,
      technicianName: "", // Reset technician when location changes
    })
  }

  // Format currency input
  const formatCurrencyOld = (value: string): string => {
    // Remove any non-digit and non-decimal characters
    const numericValue = value.replace(/[^\d.]/g, "")

    // If empty, return empty string
    if (!numericValue) return ""

    // Format with $ prefix
    return `$${numericValue}`
  }

  // Get available technicians based on selected location
  const availableTechnicians = formData.location ? getEmployeesForLocation(formData.location) : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Field - Auto-filled */}
        <FormField id="date" label="Date" required className="mb-2">
          <Input id="date" value={formData.date} onChange={() => {}} disabled className="bg-gray-50" />
        </FormField>

        {/* Location Dropdown */}
        <FormField id="location" label="Location" required error={errors.location}>
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
            required
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Model */}
        <FormField id="deviceModel" label="Device Model" required error={errors.deviceModel}>
          <Input
            id="deviceModel"
            placeholder="e.g., iPhone 13 Pro, Galaxy S22"
            value={formData.deviceModel}
            onChange={(e) => handleChange("deviceModel", e.target.value)}
            className="focus:border-teal-500 focus:ring-teal-500"
            required
          />
        </FormField>

        {/* Part Being Repaired */}
        <FormField id="partBeingRepaired" label="Part Being Repaired" required error={errors.partBeingRepaired}>
          <Input
            id="partBeingRepaired"
            placeholder="e.g., screen, battery, back glass"
            value={formData.partBeingRepaired}
            onChange={(e) => handleChange("partBeingRepaired", e.target.value)}
            className="focus:border-teal-500 focus:ring-teal-500"
            required
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <FormField id="fullName" label="Full Name" required error={errors.fullName}>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            className="focus:border-teal-500 focus:ring-teal-500"
            required
          />
        </FormField>

        {/* Phone Number */}
        <FormField id="phoneNumber" label="Phone Number" required error={errors.phoneNumber}>
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
            required
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technician Name */}
        <FormField id="technicianName" label="Technician Name" required error={errors.technicianName}>
          <CustomSelect
            id="technicianName"
            value={formData.technicianName}
            onChange={(value) => handleChange("technicianName", value)}
            options={availableTechnicians.map((tech) => ({ value: tech, label: tech }))}
            placeholder={formData.location ? "Select a technician" : "Select a location first"}
            disabled={!formData.location}
            error={errors.technicianName}
            required
          />
        </FormField>

        {/* Repair Amount */}
        <FormField id="repairAmount" label="Repair Amount" required error={errors.repairAmount}>
          <Input
            id="repairAmount"
            placeholder="e.g., $89.99"
            value={formData.repairAmount}
            onChange={(e) => {
              // Format as currency
              let value = e.target.value.replace(/[^\d.]/g, "")
              if (value) {
                value = formatCurrency(value)
              }
              handleChange("repairAmount", value)
            }}
            className="focus:border-teal-500 focus:ring-teal-500"
            required
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

      {/* Important Warranty Notice */}
      <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 border-2">
        <AlertTitle className="flex items-center font-bold text-base">
          <span className="mr-2 text-xl">⚠️</span> Important Warranty Notice
        </AlertTitle>
        <AlertDescription className="font-semibold">
          Devices that are water-damaged or have frame damage are not covered under warranty.
        </AlertDescription>
      </Alert>

      {/* Signature Pad */}
      <FormField id="signature" label="Customer Signature" required error={errors.signature}>
        <SignaturePad
          value={formData.signature}
          onChange={(value) => handleChange("signature", value)}
          error={errors.signature}
        />
      </FormField>
    </div>
  )
}
