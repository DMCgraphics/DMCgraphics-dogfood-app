"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface PaymentFormProps {
  formData: any
  onFormChange: (field: string, value: string) => void
}

export function PaymentForm({ formData, onFormChange }: PaymentFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>This is a demo checkout. No real payment will be processed.</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            value={formData.cardNumber || ""}
            onChange={(e) => onFormChange("cardNumber", e.target.value)}
            placeholder="4242 4242 4242 4242"
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryMonth">Expiry Month</Label>
            <Select value={formData.expiryMonth || ""} onValueChange={(value) => onFormChange("expiryMonth", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1).padStart(2, "0")}>
                    {String(i + 1).padStart(2, "0")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryYear">Expiry Year</Label>
            <Select value={formData.expiryYear || ""} onValueChange={(value) => onFormChange("expiryYear", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => (
                  <SelectItem key={2024 + i} value={String(2024 + i)}>
                    {2024 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            value={formData.cvv || ""}
            onChange={(e) => onFormChange("cvv", e.target.value)}
            placeholder="123"
            maxLength={4}
            className="w-24"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardName">Name on Card</Label>
          <Input
            id="cardName"
            value={formData.cardName || ""}
            onChange={(e) => onFormChange("cardName", e.target.value)}
            placeholder="John Doe"
          />
        </div>
      </CardContent>
    </Card>
  )
}
