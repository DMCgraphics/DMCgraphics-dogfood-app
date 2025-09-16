"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { checkApiHealth, getApiConfig } from "@/lib/auth"

export function ApiStatus() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const apiConfig = getApiConfig()

  const checkHealth = async () => {
    setIsChecking(true)
    const healthy = await checkApiHealth()
    setIsHealthy(healthy)
    setIsChecking(false)
  }

  useEffect(() => {
    checkHealth()
  }, [])

  if (isHealthy === false) {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Supabase Unreachable</strong>
            <br />
            Cannot connect to: <code>{apiConfig.baseUrl}</code>
            <br />
            Using local session fallback for development.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={isChecking}
            className="ml-4 bg-transparent"
          >
            {isChecking ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Retry"}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isHealthy === true) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Supabase Connected</strong>
          <br />
          Successfully connected to: <code>{apiConfig.baseUrl}</code>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
