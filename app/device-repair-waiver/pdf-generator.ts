import { format } from "date-fns"
import jsPDF from "jspdf"

// Define the type for form data
interface WaiverFormData {
  date: string
  location: string
  deviceModel: string
  fullName: string
  phoneNumber: string
  partBeingRepaired: string
  technicianName: string
  repairAmount: string
  additionalNotes?: string
  signature: string
}

// Terms and conditions text
const termsAndConditionsText = `
Mobile Care Device Repair Terms and Conditions

1. Service Agreement
By submitting this waiver, you (the "Customer") agree to the following terms and conditions for device repair services provided by Mobile Care (the "Company"):
- The Company will attempt to repair the device to the best of its ability but cannot guarantee that all repairs will be successful.
- The Customer acknowledges that the device may already have pre-existing damage not related to the specific repair being requested.
- The Company is not responsible for any data loss that may occur during the repair process. It is the Customer's responsibility to back up all data before submitting the device for repair.

2. Warranty Information
All repairs come with a limited warranty subject to the following conditions:
- Screen repairs and replacements are warranted for 30 days from the date of repair.
- Battery replacements are warranted for 90 days from the date of repair.
- Other internal component repairs are warranted for 60 days from the date of repair.
- The warranty covers only the specific part that was repaired or replaced.
- The warranty is void if the device shows signs of water damage, physical damage, or unauthorized repair attempts after our service.

3. Payment and Fees
The Customer agrees to the following payment terms:
- Full payment is due upon completion of the repair before the device is returned.
- If a repair cannot be completed, a diagnostic fee may still apply.
- If additional issues are discovered during repair, the Customer will be notified before any additional work is performed or charges are incurred.
- Devices left unclaimed for more than 30 days after repair completion may be subject to storage fees or may be considered abandoned.

4. Liability Limitations
The Customer acknowledges the following limitations of liability:
- The Company's maximum liability is limited to the cost of the repair or the current market value of the device, whichever is less.
- The Company is not liable for any indirect, consequential, or incidental damages, including but not limited to loss of business, loss of profits, or loss of data.
- For devices with water damage, there is no guarantee that all issues can be resolved, and additional problems may arise after repair.

5. Parts and Service
Regarding parts used in repairs:
- The Company may use new, used, or refurbished parts of similar quality and functionality for repairs.
- Original manufacturer parts will be used when specified and available, which may affect the final repair cost.
- Third-party parts may be used when original parts are unavailable or when requested by the Customer to reduce costs.
- The Customer acknowledges that the use of third-party parts may affect the device's functionality with certain features.

6. Customer Responsibilities
The Customer agrees to the following responsibilities:
- To remove any SIM cards, memory cards, cases, screen protectors, or other accessories before submitting the device for repair.
- To disable any activation locks, passwords, or security features that may prevent the Company from accessing the device for repair.
- To provide accurate information about the device and the issues requiring repair.
- To back up all data before submitting the device for repair.

7. Repair Timeframes
Regarding repair timeframes:
- The Company will provide an estimated timeframe for completion of repairs, but this is not guaranteed.
- Complex repairs may take longer than initially estimated if additional issues are discovered.
- The Company will make reasonable efforts to complete repairs in a timely manner.
- The Customer will be notified of any significant delays in the repair process.

8. Privacy Policy
Regarding customer privacy:
- The Company respects customer privacy and will not access personal data on devices except as necessary to perform repairs.
- Customer information will be handled in accordance with our Privacy Policy, available upon request.
- The Company may contact the Customer using the provided contact information for matters related to the repair service.

9. Dispute Resolution
In case of disputes:
- The Customer agrees to notify the Company of any issues with the repair within the warranty period.
- The Company will have the opportunity to inspect the device and address any warranty claims before the Customer seeks third-party repairs.
- Any disputes that cannot be resolved through direct negotiation will be subject to mediation before any legal action is taken.

10. Acceptance of Terms
By signing this waiver:
- The Customer acknowledges having read and understood all terms and conditions.
- The Customer agrees to be bound by these terms and conditions.
- The Customer authorizes the Company to perform the requested repairs on the specified device.
- These terms represent the entire agreement between the Customer and the Company regarding the repair service.
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
    pdf.text("DEVICE REPAIR WAIVER", 105, 20, { align: "center" })

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
    pdf.text("CUSTOMER WAIVER SUBMISSION", 105, yPos, { align: "center" })
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
    addField("Part Being Repaired", formData.partBeingRepaired)
    addField("Technician Name", formData.technicianName)
    addField("Repair Amount", formData.repairAmount)

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
    pdf.save(`Mobile_Care_Repair_Waiver_${formData.fullName.replace(/\s+/g, "_")}.pdf`)
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("There was an error generating the PDF. Please try again.")
  }
}
