"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface GlobalSearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
}

export function GlobalSearch({ placeholder = "Search...", onSearch, className = "" }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Debounce search to avoid too many updates
    const handler = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery, onSearch])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 w-full max-w-sm"
      />
    </div>
  )
}
