"use client"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Smartphone, RefreshCw, ShoppingBag, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMobile } from "@/hooks/use-mobile"
import React from "react"

// Quick action items
const quickActions = [
  {
    title: "New Repair Waiver",
    description: "Process a new device repair",
    icon: <Smartphone className="h-8 w-8" />,
    href: "/device-repair-waiver",
    color: "bg-teal-50 text-teal-700",
  },
  {
    title: "Sell Device to Customer",
    description: "Complete a device sale",
    icon: <ShoppingBag className="h-8 w-8" />,
    href: "/device-selling-waiver",
    color: "bg-teal-50 text-teal-700",
  },
  {
    title: "Buy Device from Customer",
    description: "Process a device purchase",
    icon: <RefreshCw className="h-8 w-8" />,
    href: "/device-purchase-waiver",
    color: "bg-teal-50 text-teal-700",
  },
  {
    title: "Admin Panel",
    description: "Access admin dashboard",
    icon: <Shield className="h-8 w-8" />,
    href: "/admin",
    color: "bg-teal-50 text-teal-700",
  },
]

export default function Home() {
  const isMobile = useMobile()
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy")

  // Logo colors for the theme
  const logoBlue = "#0a3d62" // Deep blue from logo
  const logoTeal = "#00a8a8" // Teal-green from logo

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content - Reduced top padding */}
      <div className="flex-1 transition-all duration-300 ease-in-out pt-16">
        <main className="p-4 md:p-6 flex flex-col">
          {/* Add the logo at the top, centered with reduced margin */}
          <div className="flex justify-center mb-6">
            <div className="relative h-48 w-[500px]">
              <Image
                src="/images/mobile-care-logo.png"
                alt="Mobile Care Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </div>

          {/* Header with reduced margin */}
          <div className="flex flex-col items-center text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome to Mobile Care Portal</h1>
            <p className="mt-1 text-gray-600">Manage repairs, sales, and purchases efficiently across all locations.</p>
            <div className="mt-2 text-sm text-gray-600">
              <div>{currentDate}</div>
            </div>
          </div>

          {/* Quick Actions - Moved up with reduced padding */}
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {quickActions.map((action, index) => (
                <Link href={action.href} key={index} className="w-full">
                  <Card
                    className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer border-t-4 transform hover:scale-105"
                    style={{ borderTopColor: logoTeal }}
                  >
                    <CardHeader className={`${action.color} rounded-t-lg p-4`}>
                      <div className="flex justify-center items-center" style={{ color: logoTeal }}>
                        {React.cloneElement(action.icon, { className: "h-10 w-10" })}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-5 px-4 text-center">
                      <CardTitle className="text-lg mb-1">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </main>

        {/* Footer - Positioned at the bottom with auto margin top */}
        <footer className="border-t border-gray-200 mt-auto py-4 px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div>
              <p>Mobile Care Internal Portal</p>
            </div>
            <div className="mt-2 md:mt-0">
              <p>
                Support:{" "}
                <a href="mailto:support@mobilecare.internal" className="hover:underline" style={{ color: logoTeal }}>
                  support@mobilecare.internal
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
