"use client"

import { useRef, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle2 } from "lucide-react"

interface TermsAndConditionsProps {
  onComplete: () => void
}

export default function TermsAndConditions({ onComplete }: TermsAndConditionsProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const termsRef = useRef<HTMLDivElement>(null)

  // Check if user has scrolled to the bottom
  const handleScroll = () => {
    if (!termsRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = termsRef.current
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
      onComplete()
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={termsRef}
        onScroll={handleScroll}
        className="h-[300px] overflow-y-auto border rounded-md p-4 bg-gray-50"
      >
        <h2 className="text-xl font-semibold mb-4">Mobile Care Device Purchase Terms and Conditions</h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>1. Authorization & Final Sale</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                You, the customer, authorize Mobile Care to purchase your personal device. Once the agreed-upon amount
                has been given for the device, the sale is final, and no returns or refunds will be permitted.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>2. Verification & Legitimacy Checks</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">2.1 Device Verification</p>
              <p className="mb-2">Before completing the purchase, Mobile Care will verify the device to ensure:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The device is not flagged for non-payment, stolen, or lost status.</li>
                <li>The purchase date is valid and verifiable.</li>
              </ul>

              <p className="mt-4 mb-2">2.2 Proof of Purchase Requirement</p>
              <p className="mb-2">
                Mobile Care reserves the right to request a receipt or other proof of purchase. If the device fails
                verification checks (e.g., reported stolen or lost), Mobile Care reserves the right to refuse purchase
                and, in certain cases, will contact Law Enforcement.
              </p>

              <p className="mt-4 mb-2">2.3 Stolen & Lost Devices</p>
              <p className="mb-2">
                If a device sold to Mobile Care is later reported as stolen or lost, we will first attempt to contact
                the seller. Failure to respond or comply may result in Mobile Care reporting the incident to local Law
                Enforcement.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>3. Customer Identification & Age Restriction</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">3.1 ID Validation</p>
              <p className="mb-2">Mobile Care will validate your government-issued ID before purchasing any device.</p>

              <p className="mt-4 mb-2">3.2 Age Requirement</p>
              <p className="mb-2">
                Mobile Care will not purchase any device from individuals under the age of 18. If you are under 18, a
                parent or legal guardian must be present for the transaction.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>4. Legal Compliance & Ethics</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                Mobile Care abides by all local laws and city ordinances within its operating jurisdiction. We do not
                tolerate:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dishonesty in transactions.</li>
                <li>Stolen or fraudulent devices.</li>
                <li>Forgery or misrepresentation of customer information.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>Acknowledgment & Agreement</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                By signing below, you acknowledge that you have read, understood, and agreed to the Terms & Conditions
                set forth by Mobile Care.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Please scroll to the bottom to indicate that you have read and agree to these terms and conditions.
          </p>
        </div>

        <div className="h-[50px]"></div>
      </div>

      <div className="flex items-center">
        {hasScrolledToBottom ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-600 font-medium">Terms and conditions have been read</span>
          </>
        ) : (
          <span className="text-amber-600 font-medium">Please scroll through the entire document</span>
        )}
      </div>
    </div>
  )
}
