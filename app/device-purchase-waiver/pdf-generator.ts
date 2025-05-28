import { format } from "date-fns"
import jsPDF from "jspdf"

// Define the type for form data
interface WaiverFormData {
  date: string
  location: string
  deviceModel: string
  fullName: string
  phoneNumber: string
  imei: string
  price: string
  idNumber: string
  salesRepresentative: string
  additionalNotes?: string
  signature: string
}

// Terms and conditions text
const termsAndConditionsText = `
Mobile Care Device Purchase Terms and Conditions

1. Authorization & Final Sale
You, the customer, authorize Mobile Care to purchase your personal device. Once the agreed-upon amount has been given for the device, the sale is final, and no returns or refunds will be permitted.

2. Verification & Legitimacy Checks

2.1 Device Verification
Before completing the purchase, Mobile Care will verify the device to ensure:
- The device is not flagged for non-payment, stolen, or lost status.
- The purchase date is valid and verifiable.

2.2 Proof of Purchase Requirement
Mobile Care reserves the right to request a receipt or other proof of purchase. If the device fails verification checks (e.g., reported stolen or lost), Mobile Care reserves the right to refuse purchase and, in certain cases, will contact Law Enforcement.

2.3 Stolen & Lost Devices
If a device sold to Mobile Care is later reported as stolen or lost, we will first attempt to contact the seller. Failure to respond or comply may result in Mobile Care reporting the incident to local Law Enforcement.

3. Customer Identification & Age Restriction

3.1 ID Validation
Mobile Care will validate your government-issued ID before purchasing any device.

3.2 Age Requirement
Mobile Care will not purchase any device from individuals under the age of 18. If you are under 18, a parent or legal guardian must be present for the transaction.

4. Legal Compliance & Ethics
Mobile Care abides by all local laws and city ordinances within its operating jurisdiction. We do not tolerate:
- Dishonesty in transactions.
- Stolen or fraudulent devices.
- Forgery or misrepresentation of customer information.

Acknowledgment & Agreement
By signing below, you acknowledge that you have read, understood, and agreed to the Terms & Conditions set forth by Mobile Care.
`

export const generateWaiverPDF = (formData: WaiverFormData): void => {
  // Make sure we're in the browser environment
  if (typeof window === "undefined") {
    console.error("PDF generation can only run in browser environment")
    return
  }

  try {
    // Create a new PDF document using the imported jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // ===== PAGE 1: TERMS AND CONDITIONS =====

    // Set font
    pdf.setFont("helvetica")

    // Add title
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("DEVICE PURCHASE WAIVER", 105, 20, { align: "center" })

    // Add date
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Date: ${formData.date}`, 195, 20, { align: "right" })

    // Add horizontal line
    pdf.setLineWidth(0.5)
    pdf.line(15, 35, 195, 35)

    // Terms and Conditions Section
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("TERMS AND CONDITIONS", 15, 45)

    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")

    // Split terms and conditions into lines and add to PDF
    const termsLines = pdf.splitTextToSize(termsAndConditionsText, 175)
    pdf.text(termsLines, 15, 55)

    // Add page number at the bottom
    pdf.setFontSize(8)
    pdf.text("Page 1 of 2", 105, 287, { align: "center" })

    // ===== PAGE 2: CUSTOMER INFORMATION =====

    // Add a new page for customer information
    pdf.addPage()

    // Reset position for the new page
    let yPos = 20

    // Add title for the second page
    pdf.setFontSize(18)
    pdf.setFont("helvetica", "bold")
    pdf.text("CUSTOMER DEVICE SALE INFORMATION", 105, yPos, { align: "center" })
    yPos += 15

    // Add date on the second page as well
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(`Date: ${formData.date}`, 195, 20, { align: "right" })

    // Add horizontal line
    pdf.setLineWidth(0.5)
    pdf.line(15, yPos, 195, yPos)
    yPos += 15

    // Customer Information Section
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("CUSTOMER INFORMATION", 15, yPos)
    yPos += 15

    // Define consistent spacing between fields
    const fieldSpacing = 12 // Increased spacing for better readability

    // Add customer details with improved formatting
    const addField = (label: string, value: string) => {
      // Set maximum width for the value to prevent overflow
      const maxValueWidth = 110

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.text(`${label}:`, 15, yPos)

      pdf.setFont("helvetica", "normal")

      // Handle potential long values by wrapping text
      if (value) {
        const valueLines = pdf.splitTextToSize(value, maxValueWidth)
        pdf.text(valueLines, 70, yPos)

        // If the value has multiple lines, add extra spacing
        if (valueLines.length > 1) {
          yPos += (valueLines.length - 1) * 5
        }
      } else {
        // If no value, just add a placeholder
        pdf.text("N/A", 70, yPos)
      }

      yPos += fieldSpacing
    }

    // Add all customer fields with consistent spacing
    addField("Full Name", formData.fullName)
    addField("Phone Number", formData.phoneNumber)
    addField("Location", formData.location)
    addField("Device Model", formData.deviceModel)
    addField("IMEI", formData.imei)
    addField("Price", formData.price)
    addField("ID Number", formData.idNumber)
    addField("Sales Representative", formData.salesRepresentative)

    // Add additional notes with proper formatting
    if (formData.additionalNotes && formData.additionalNotes.trim() !== "") {
      yPos += 5 // Add extra spacing before notes section

      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(11)
      pdf.text("Additional Notes:", 15, yPos)
      yPos += 8

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(10)

      // Wrap long notes text
      const notesLines = pdf.splitTextToSize(formData.additionalNotes, 175)
      pdf.text(notesLines, 15, yPos)
      yPos += notesLines.length * 5 + 10 // Add proper spacing after notes
    } else {
      yPos += 10 // Add spacing even if no notes
    }

    // Add horizontal line with proper spacing
    pdf.setLineWidth(0.5)
    pdf.line(15, yPos, 195, yPos)
    yPos += 15

    // Signature Section with improved spacing
    pdf.setFontSize(14)
    pdf.setFont("helvetica", "bold")
    pdf.text("CUSTOMER SIGNATURE", 15, yPos)
    yPos += 15

    // Add signature with proper positioning
    if (formData.signature && formData.signature !== "") {
      try {
        // Adjust signature size and position
        const signatureWidth = 80
        const signatureHeight = 40
        pdf.addImage(formData.signature, "PNG", 15, yPos, signatureWidth, signatureHeight)
        yPos += signatureHeight + 10 // Add space after signature
      } catch (error) {
        console.error("Error adding signature to PDF:", error)
        pdf.setFont("helvetica", "normal")
        pdf.text("Error loading signature", 15, yPos + 20)
        yPos += 30
      }
    } else {
      // If no signature, add placeholder text
      pdf.setFont("helvetica", "italic")
      pdf.setFontSize(10)
      pdf.text("No signature provided", 15, yPos + 10)
      yPos += 30
    }

    // Add timestamp at the bottom with fixed position
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "italic")
    const timestamp = `Generated on: ${format(new Date(), "PPpp")}`
    pdf.text(timestamp, 15, 280)

    // Add page number at the bottom
    pdf.setFontSize(8)
    pdf.text("Page 2 of 2", 105, 287, { align: "center" })

    // Save the PDF
    pdf.save(`Mobile_Care_Purchase_Waiver_${formData.fullName.replace(/\s+/g, "_")}.pdf`)
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("There was an error generating the PDF. Please try again.")
  }
}
