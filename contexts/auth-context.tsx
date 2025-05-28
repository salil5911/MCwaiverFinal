"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Static credentials
const STATIC_USERNAME = "mobilecaredigital"
const STATIC_PASSWORD = "Mobile1985"
const AUTH_STORAGE_KEY = "mobile-care-auth"

type AuthContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  signIn: ({
    username,
    password,
  }: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuth = localStorage.getItem(AUTH_STORAGE_KEY) === "true"
        console.log("Auth check:", isAuth ? "authenticated" : "not authenticated")
        setIsAuthenticated(isAuth)
      } catch (error) {
        console.error("Error checking authentication:", error)
        setIsAuthenticated(false)
      } finally {
        // Always set loading to false after checking auth
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure the component is mounted
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  const signIn = async ({ username, password }: { username: string; password: string }) => {
    setIsLoading(true)

    try {
      // Check against static credentials
      if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
        // Set authentication in localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, "true")
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: "Invalid username or password" }
      }
    } catch (error) {
      console.error("Error during sign in:", error)
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    try {
      // Clear authentication from localStorage
      localStorage.removeItem(AUTH_STORAGE_KEY)
      // Also clear location selection
      localStorage.removeItem("selectedLocation")
      setIsAuthenticated(false)

      // Redirect to home page instead of login page
      router.push("/")
    } catch (error) {
      console.error("Error during sign out:", error)
    }
  }

  const value = {
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
