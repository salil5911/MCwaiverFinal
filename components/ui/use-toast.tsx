"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"

type ToastVariant = "default" | "destructive" | "success"

interface ToastProps {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

const toastStore: {
  toasts: Array<ToastProps & { id: string }>
  addToast: (toast: ToastProps) => void
  removeToast: (id: string) => void
} = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])

  const addToast = (toast: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])

    if (toast.duration !== Number.POSITIVE_INFINITY) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Update the store
  toastStore.toasts = toasts
  toastStore.addToast = addToast
  toastStore.removeToast = removeToast

  return (
    <>
      {children}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-w-md w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border p-4 shadow-md transition-all duration-300 animate-in slide-in-from-right-full ${
              toast.variant === "destructive"
                ? "bg-red-50 border-red-200 text-red-800"
                : toast.variant === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-white border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{toast.title}</h3>
                {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function toast(props: ToastProps) {
  toastStore.addToast(props)
}
