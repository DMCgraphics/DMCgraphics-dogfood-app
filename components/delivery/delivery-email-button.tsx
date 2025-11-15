"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeliveryEmailButtonProps {
  customerEmail: string
  customerName: string
  dogName: string
}

export function DeliveryEmailButton({ customerEmail, customerName, dogName }: DeliveryEmailButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Delivery details with defaults
  const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
  const [deliveryDate, setDeliveryDate] = useState(today)
  const [deliveryWindow, setDeliveryWindow] = useState("9:00 AM - 5:00 PM")
  const [recipes, setRecipes] = useState("Fresh dog food")
  const [schedule, setSchedule] = useState("As scheduled")

  const handleSendEmail = async () => {
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/delivery/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: customerEmail,
          dogName,
          customerName,
          deliveryDate,
          deliveryWindow,
          recipes,
          schedule,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      setSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
      console.error("Error sending email:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Email Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Delivery Email</DialogTitle>
          <DialogDescription>
            Send a delivery notification to {customerName} ({customerEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryDate">Delivery Date</Label>
            <Input
              id="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              placeholder="11/15/2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryWindow">Delivery Window</Label>
            <Input
              id="deliveryWindow"
              value={deliveryWindow}
              onChange={(e) => setDeliveryWindow(e.target.value)}
              placeholder="9:00 AM - 5:00 PM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipes">Recipes</Label>
            <Input
              id="recipes"
              value={recipes}
              onChange={(e) => setRecipes(e.target.value)}
              placeholder="Beef & Quinoa, Lamb & Pumpkin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <Input
              id="schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Weekly (Sundays)"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription className="text-green-600">
                Email sent successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
