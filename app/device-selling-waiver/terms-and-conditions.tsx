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
        <h2 className="text-xl font-semibold mb-4">Mobile Care Device Selling Terms and Conditions</h2>

        <p className="mb-4">
          By purchasing a device from Mobile Care, you acknowledge that you have read, understood, and agreed to the
          following Terms & Conditions:
        </p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>1. Purchase Agreement & Condition of Sale</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                You, the customer, understand that Mobile Care is selling the device to you in "AS IS" condition. All
                devices sold by Mobile Care are certified pre-owned with original parts, unless otherwise specified by
                us.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>2. Warranty & Customer Responsibility</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">2.1 Warranty Coverage</p>
              <p className="mb-2">All purchased devices come with a 30-day warranty from Mobile Care.</p>
              <p className="mb-2">2.2 Warranty Exclusions</p>
              <p className="mb-2">
                If the customer damages the device, Mobile Care is not responsible for repairs or replacements. However,
                Mobile Care may offer a discount on repair services in such cases.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>3. Carrier & Unlocking Information</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                All devices sold by Mobile Care are carrier-unlocked. Device unlock information is available upon
                request. Mobile Care is not responsible for carrier-related issues or services not provided by us.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>4. Payment & Fraud Prevention</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">4.1 Debit/Credit Card Transactions</p>
              <p className="mb-2">All debit/credit card purchases require ID verification and customer signature.</p>
              <p className="mb-2">4.2 Cash Payments</p>
              <p className="mb-2">
                All cash transactions will be checked for counterfeit currency to prevent fraudulent transactions.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>5. Legal Compliance & Ethics</AccordionTrigger>
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

          <AccordionItem value="item-6">
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
