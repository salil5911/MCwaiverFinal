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
        className="h-[500px] overflow-y-auto border rounded-md p-4 bg-white shadow-inner"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Mobile Care Device Repair Terms and Conditions</h2>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">1. Service Agreement</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">
                By submitting this waiver, you (the "Customer") agree to the following terms and conditions for device
                repair services provided by Mobile Care (the "Company"):
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The Company will attempt to repair the device to the best of its ability but cannot guarantee that all
                  repairs will be successful.
                </li>
                <li>
                  The Customer acknowledges that the device may already have pre-existing damage not related to the
                  specific repair being requested.
                </li>
                <li>
                  The Company is not responsible for any data loss that may occur during the repair process. It is the
                  Customer's responsibility to back up all data before submitting the device for repair.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">
              2. Warranty Information
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">All repairs come with a limited warranty subject to the following conditions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Screen repairs and replacements are warranted for 30 days from the date of repair.</li>
                <li>Battery replacements are warranted for 90 days from the date of repair.</li>
                <li>Other internal component repairs are warranted for 60 days from the date of repair.</li>
                <li>The warranty covers only the specific part that was repaired or replaced.</li>
                <li>
                  The warranty is void if the device shows signs of water damage, physical damage, or unauthorized
                  repair attempts after our service.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">3. Payment and Fees</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">The Customer agrees to the following payment terms:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Full payment is due upon completion of the repair before the device is returned.</li>
                <li>If a repair cannot be completed, a diagnostic fee may still apply.</li>
                <li>
                  If additional issues are discovered during repair, the Customer will be notified before any additional
                  work is performed or charges are incurred.
                </li>
                <li>
                  Devices left unclaimed for more than 30 days after repair completion may be subject to storage fees or
                  may be considered abandoned.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">
              4. Liability Limitations
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">The Customer acknowledges the following limitations of liability:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The Company's maximum liability is limited to the cost of the repair or the current market value of
                  the device, whichever is less.
                </li>
                <li>
                  The Company is not liable for any indirect, consequential, or incidental damages, including but not
                  limited to loss of business, loss of profits, or loss of data.
                </li>
                <li>
                  For devices with water damage, there is no guarantee that all issues can be resolved, and additional
                  problems may arise after repair.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">5. Parts and Service</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Regarding parts used in repairs:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The Company may use new, used, or refurbished parts of similar quality and functionality for repairs.
                </li>
                <li>
                  Original manufacturer parts will be used when specified and available, which may affect the final
                  repair cost.
                </li>
                <li>
                  Third-party parts may be used when original parts are unavailable or when requested by the Customer to
                  reduce costs.
                </li>
                <li>
                  The Customer acknowledges that the use of third-party parts may affect the device's functionality with
                  certain features.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">
              6. Customer Responsibilities
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">The Customer agrees to the following responsibilities:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  To remove any SIM cards, memory cards, cases, screen protectors, or other accessories before
                  submitting the device for repair.
                </li>
                <li>
                  To disable any activation locks, passwords, or security features that may prevent the Company from
                  accessing the device for repair.
                </li>
                <li>To provide accurate information about the device and the issues requiring repair.</li>
                <li>To back up all data before submitting the device for repair.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">7. Repair Timeframes</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Regarding repair timeframes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The Company will provide an estimated timeframe for completion of repairs, but this is not guaranteed.
                </li>
                <li>Complex repairs may take longer than initially estimated if additional issues are discovered.</li>
                <li>The Company will make reasonable efforts to complete repairs in a timely manner.</li>
                <li>The Customer will be notified of any significant delays in the repair process.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">8. Privacy Policy</AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">Regarding customer privacy:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The Company respects customer privacy and will not access personal data on devices except as necessary
                  to perform repairs.
                </li>
                <li>
                  Customer information will be handled in accordance with our Privacy Policy, available upon request.
                </li>
                <li>
                  The Company may contact the Customer using the provided contact information for matters related to the
                  repair service.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">
              9. Dispute Resolution
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">In case of disputes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  The Customer agrees to notify the Company of any issues with the repair within the warranty period.
                </li>
                <li>
                  The Company will have the opportunity to inspect the device and address any warranty claims before the
                  Customer seeks third-party repairs.
                </li>
                <li>
                  Any disputes that cannot be resolved through direct negotiation will be subject to mediation before
                  any legal action is taken.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10" className="border-b border-gray-200">
            <AccordionTrigger className="text-teal-700 hover:text-teal-800 py-4">
              10. Acceptance of Terms
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2">By signing this waiver:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Customer acknowledges having read and understood all terms and conditions.</li>
                <li>The Customer agrees to be bound by these terms and conditions.</li>
                <li>The Customer authorizes the Company to perform the requested repairs on the specified device.</li>
                <li>
                  These terms represent the entire agreement between the Customer and the Company regarding the repair
                  service.
                </li>
              </ul>
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

      <div className="flex items-center p-3 bg-gray-50 rounded-md border">
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
