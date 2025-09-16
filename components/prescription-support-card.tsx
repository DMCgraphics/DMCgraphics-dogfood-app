"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stethoscope, Mail, Clock } from "lucide-react"
import { useState } from "react"

export function PrescriptionSupportCard() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleNotifyMe = () => {
    if (email && email.includes("@")) {
      setIsSubmitted(true)
      // Track validation/demand
      console.log("[v0] Prescription support email captured:", email)
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full text-xs font-medium">
          <Clock className="h-3 w-3" />
          Coming Soon
        </div>
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Prescription Support</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Custom vet-approved meals for conditions like kidney or liver needs.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We're partnering with veterinary nutritionists to create specialized meal plans for dogs with medical
          conditions. Be the first to know when these vet-approved options become available.
        </p>

        {!isSubmitted ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="prescription-email" className="text-sm font-medium">
                Get notified when available
              </Label>
              <div className="flex gap-2">
                <Input
                  id="prescription-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleNotifyMe} disabled={!email || !email.includes("@")} className="px-6">
                  <Mail className="h-4 w-4 mr-2" />
                  Notify Me
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-600"></div>
            Thank you! We'll notify you when prescription support is available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
