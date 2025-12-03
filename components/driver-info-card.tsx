"use client"

import { Card, CardContent } from "@/components/ui/card"
import { User, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DriverInfoCardProps {
  driverName: string
  driverPhone?: string
  estimatedWindow?: string
}

export function DriverInfoCard({
  driverName,
  driverPhone,
  estimatedWindow,
}: DriverInfoCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Driver avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white">
            <User className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Your Driver</h3>
            <p className="text-blue-900 font-medium">{driverName}</p>

            {estimatedWindow && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-700">
                <MapPin className="h-4 w-4" />
                <span>Estimated arrival: {estimatedWindow}</span>
              </div>
            )}

            {driverPhone && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => (window.location.href = `tel:${driverPhone}`)}
                >
                  <Phone className="h-4 w-4" />
                  Call Driver
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
