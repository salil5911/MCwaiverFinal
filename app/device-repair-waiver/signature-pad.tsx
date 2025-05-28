"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface SignaturePadProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export default function SignaturePad({ value, onChange, error }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const signatureDataRef = useRef<string>(value)

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Use willReadFrequently for better performance on Safari/WebKit
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return

    // Set fixed dimensions to prevent resizing issues
    const container = containerRef.current
    if (container) {
      const width = container.clientWidth
      canvas.width = width
      canvas.height = 200
    }

    // Set up the context
    context.lineWidth = 2.5
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = "#000000"
    setCtx(context)

    // If there's a saved signature, restore it
    if (value) {
      const img = new Image()
      img.onload = () => {
        context.drawImage(img, 0, 0)
      }
      img.src = value
      signatureDataRef.current = value
    }

    // Prevent scrolling when drawing on canvas
    const handleTouchMove = (e: TouchEvent) => {
      if (canvas.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [])

  // Handle mouse/touch events for drawing
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx) return

    setIsDrawing(true)

    // Get the correct coordinates
    const { offsetX, offsetY } = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return

    // Get the correct coordinates
    const { offsetX, offsetY } = getCoordinates(e)

    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || !ctx || !canvasRef.current) return

    setIsDrawing(false)
    ctx.closePath()

    // Save the signature as data URL
    const dataUrl = canvasRef.current.toDataURL("image/png")
    signatureDataRef.current = dataUrl
    onChange(dataUrl)
  }

  // Helper to get coordinates for both mouse and touch events
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { offsetX: 0, offsetY: 0 }

    const rect = canvas.getBoundingClientRect()

    if ("touches" in e) {
      // Touch event
      const touch = e.touches[0]
      return {
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
      }
    } else {
      // Mouse event
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY,
      }
    }
  }

  // Clear the signature
  const clearSignature = () => {
    if (!ctx || !canvasRef.current) return

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    onChange("")
    signatureDataRef.current = ""
  }

  // Restore signature from ref if canvas gets cleared unexpectedly
  useEffect(() => {
    const checkAndRestoreSignature = () => {
      if (!ctx || !canvasRef.current) return

      // Check if canvas is empty but we have signature data
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
      const pixelData = imageData.data

      // Check if canvas is empty (all pixels are transparent)
      const isCanvasEmpty = !pixelData.some((channel) => channel !== 0)

      if (isCanvasEmpty && signatureDataRef.current) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
        img.src = signatureDataRef.current
      }
    }

    // Check after scroll events and focus changes
    window.addEventListener("scroll", checkAndRestoreSignature)
    window.addEventListener("focus", checkAndRestoreSignature)

    return () => {
      window.removeEventListener("scroll", checkAndRestoreSignature)
      window.removeEventListener("focus", checkAndRestoreSignature)
    }
  }, [ctx])

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`border-2 rounded-md p-1 bg-white shadow-sm ${error ? "border-red-500" : "border-gray-200"}`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-[200px] touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Please sign above using mouse or touch</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          className="border-teal-600 text-teal-600 hover:bg-teal-50"
        >
          Clear Signature
        </Button>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  )
}
