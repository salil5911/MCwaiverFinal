"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
  initialValue?: string
  debounceTime?: number
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  className = "",
  initialValue = "",
  debounceTime = 300,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue)

  // Debounce search input to avoid excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery)
    }, debounceTime)

    return () => clearTimeout(timer)
  }, [searchQuery, onSearch, debounceTime])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 w-full"
      />
    </div>
  )
}
