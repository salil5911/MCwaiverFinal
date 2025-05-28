"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't show navbar on success animation pages or admin pages
  if (pathname?.includes("success") || pathname?.startsWith("/admin")) {
    return null
  }

  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith("/admin")

  // Define navigation links
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/device-repair-waiver", label: "Repair Waiver" },
    { href: "/device-selling-waiver", label: "Selling Waiver" },
    { href: "/device-purchase-waiver", label: "Purchase Waiver" },
  ]

  // Admin-specific links
  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/waivers", label: "Waivers" },
    { href: "/admin/invoices", label: "Invoices" },
    { href: "/admin/inventory", label: "Inventory" },
  ]

  // Determine which links to show based on the current page
  const displayLinks = isAdminPage ? adminLinks : navLinks

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a3d62] border-b border-gray-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center h-16">
          {/* Mobile menu button */}
          <div className="absolute left-4 inset-y-0 flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-[#0c4b79] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>

          {/* Desktop navigation - centered */}
          <div className="hidden md:flex items-center justify-center space-x-8">
            {displayLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href) &&
                    // Special case for admin routes to prevent Dashboard from staying highlighted
                    (!link.href.includes("/admin") || link.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.includes(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors relative",
                    isActive ? "text-white" : "text-gray-200 hover:text-white",
                  )}
                >
                  {link.label}
                  {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform"></span>}
                </Link>
              )
            })}

            {/* Always show Admin link on non-admin pages */}
            {!isAdminPage && (
              <Link
                href="/admin"
                className="px-3 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0c4b79] shadow-lg">
          {displayLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href) &&
                  // Special case for admin routes to prevent Dashboard from staying highlighted
                  (!link.href.includes("/admin") || link.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.includes(link.href))

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  isActive ? "bg-[#0a3d62] text-white" : "text-gray-200 hover:bg-[#0a3d62]",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Always show Admin link on non-admin pages */}
          {!isAdminPage && (
            <Link
              href="/admin"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-[#0a3d62]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Panel
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
