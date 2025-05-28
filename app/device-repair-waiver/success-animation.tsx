"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"

export default function SuccessAnimation() {
  const [animationStage, setAnimationStage] = useState(0)

  useEffect(() => {
    // Start animation sequence
    const stage1 = setTimeout(() => setAnimationStage(1), 100)
    const stage2 = setTimeout(() => setAnimationStage(2), 600)
    const stage3 = setTimeout(() => setAnimationStage(3), 1200)

    return () => {
      clearTimeout(stage1)
      clearTimeout(stage2)
      clearTimeout(stage3)
    }
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-95 z-50">
      <div className="text-center">
        <div
          className={`transform transition-all duration-500 ease-out ${
            animationStage >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" strokeWidth={2.5} />
          </div>
        </div>

        <h2
          className={`text-2xl font-bold mb-2 transition-all duration-500 ease-out ${
            animationStage >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          Thank you for your submission!
        </h2>

        <p
          className={`text-gray-600 transition-all duration-500 ease-out ${
            animationStage >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          Your waiver has been processed successfully.
          <br />
          Redirecting to home page...
        </p>

        <div className="mt-6 relative h-1 w-48 mx-auto bg-gray-200 rounded overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-green-500 animate-progress"></div>
        </div>
      </div>
    </div>
  )
}
