"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLocation } from "@/contexts/location-context"
import type { Location } from "@/lib/supabase"
import { LogOut, ChevronDown, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LocationSelectorModal } from "./location-selector-modal"

interface AdminLayoutProps {
  children: React.ReactNode
}

const locations: Location[] = ["Augusta", "Perimeter", "Cumberland", "Southlake", "Lynnhaven", "Carolina Place"]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { signOut, isLoading: isAuthLoading } = useAuth()
  const { selectedLocation, setSelectedLocation, isLocationSelected, isInitialized } = useLocation()
  const router = useRouter()
  const pathname = usePathname()

  // Logo colors for the theme
  const logoBlue = "#0a3d62" // Deep blue from logo
  const logoTeal = "#00a8a8" // Teal-green from logo

  const handleSignOut = () => {
    signOut()
  }

  // Update the onLocationChange handler to log location changes
  const handleLocationChange = (newLocation: Location) => {
    console.log("Location changed from", selectedLocation, "to", newLocation)
    setSelectedLocation(newLocation)
  }

  // Navigation items for the top nav
  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/repair-waivers", label: "Repair Waivers" },
    { href: "/admin/selling-waivers", label: "Selling Waivers" },
    { href: "/admin/purchase-waivers", label: "Purchase Waivers" },
    { href: "/admin/invoices", label: "Invoices" },
    { href: "/admin/inventory", label: "Inventory" },
  ]

  // Show loading state while initializing
  if (isAuthLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Render the location selector if needed
  if (!isLocationSelected) {
    return <LocationSelectorModal />
  }

  return (
    <div className="min-h-screen bg-gray-50 text-left ltr" dir="ltr" style={{ direction: "ltr !important" }}>
      {/* Header with enhanced navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          {/* Top section with logo and location selector */}
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            {/* Logo - made bigger */}
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center">
                <div className="relative h-14 w-48">
                  <Image
                    src="/images/mobile-care-logo.png"
                    alt="Mobile Care Logo"
                    fill
                    style={{ objectFit: "contain" }}
                    priority
                  />
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-800">Admin</span>
              </Link>
            </div>

            <div className="flex items-center space-x-6">
              {/* Home Link - moved to left of location, made bold and bigger */}
              <Link href="/" className="text-lg font-bold text-gray-800 hover:text-teal-600 transition-colors">
                Home
              </Link>

              {/* Location selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-teal-300 bg-teal-50 text-base font-medium px-6 py-2 shadow-sm"
                  >
                    <span className="mr-1">Location:</span>
                    <span className="font-bold text-teal-700">{selectedLocation}</span>
                    <ChevronDown className="ml-2 h-4 w-4 text-teal-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuLabel>Select Location</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {locations.map((location) => (
                    <DropdownMenuItem
                      key={location}
                      onClick={() => handleLocationChange(location)}
                      className={selectedLocation === location ? "bg-teal-50 text-teal-700 font-medium" : ""}
                    >
                      {location}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sign Out Button - made bold and bigger */}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-lg font-bold text-gray-800 hover:text-teal-600"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Main navigation tabs - highlighted with blue */}
          <div className="flex items-center justify-center overflow-x-auto py-1 bg-[#0a3d62]">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-8 py-4 text-lg font-semibold transition-colors whitespace-nowrap",
                    isActive
                      ? "text-white border-b-2 border-white"
                      : "text-gray-100 hover:text-white hover:bg-[#0c4b79]",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
