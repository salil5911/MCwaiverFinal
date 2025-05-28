"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Download } from "lucide-react"
import SuccessAnimation from "../device-repair-waiver/success-animation"

interface WaiverLayoutProps {
  title: string
  termsComponent: React.ReactNode
  formComponent: React.ReactNode
  formData: any
  formSchema: z.ZodObject<any>
  onSubmit: (data: any) => void
  generatePDF: (data: any) => void
}

export default function WaiverLayout({
  title,
  termsComponent,
  formComponent,
  formData,
  formSchema,
  onSubmit,
  generatePDF,
}: WaiverLayoutProps) {
  const router = useRouter()
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [formValues, setFormValues] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
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

    // Store form values for PDF generation
    setFormValues(formData)
    setIsSubmitted(true)

    // Call the onSubmit callback
    onSubmit(formData)

    // Generate PDF
    try {
      generatePDF(formData)
      setPdfGenerated(true)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating your PDF. Please try again.")
    }
  }

  // Handle regenerating the PDF
  const handleRegeneratePDF = () => {
    if (formValues) {
      generatePDF(formValues)
    }
  }

  // Reset the form
  const resetForm = () => {
    setIsSubmitted(false)
    setHasReadTerms(false)
    setPdfGenerated(false)
    setFormValues(null)
    setErrors({})
    // The actual form reset will be handled by the parent component
    window.location.reload()
  }

  if (showSuccessAnimation) {
    return <SuccessAnimation />
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="shadow-lg border-t-4 border-t-teal-500">
          <CardContent className="pt-6 pb-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800 text-lg font-semibold">Submission Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Thank you for submitting your waiver.{" "}
                {pdfGenerated ? "Your PDF has been generated and downloaded." : ""}
              </AlertDescription>
            </Alert>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleRegeneratePDF} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700">
                <Download className="h-4 w-4" />
                Download PDF Again
              </Button>

              <Button variant="outline" onClick={resetForm} className="border-teal-600 text-teal-600 hover:bg-teal-50">
                Submit Another Waiver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">{title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terms and Conditions Section */}
        <Card className="shadow-md border-t-4 border-t-teal-500 h-fit">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl text-gray-800">Terms and Conditions</CardTitle>
            <CardDescription>
              Please read the following terms and conditions carefully before proceeding.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {/* Pass the onComplete handler to the terms component */}
            {React.cloneElement(termsComponent as React.ReactElement, {
              onComplete: () => setHasReadTerms(true),
            })}
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card className="shadow-md border-t-4 border-t-teal-500">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-xl text-gray-800">Customer Information</CardTitle>
            <CardDescription>Please fill out all required fields to complete your waiver.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pass the errors to the form component */}
              {React.cloneElement(formComponent as React.ReactElement, {
                errors: errors,
              })}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 transition-colors py-6 text-base font-medium"
                disabled={!hasReadTerms}
              >
                Submit Waiver
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
    </div>
  )
}
