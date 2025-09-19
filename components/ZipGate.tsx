"use client";
import { useState } from "react";
import { isAllowedZip, normalizeZip } from "@/lib/allowed-zips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";

interface ZipGateProps {
  planId: string;
  total: number;
  lineItems: any[];
  userEmail?: string;
}

export default function ZipGate({ planId, total, lineItems, userEmail }: ZipGateProps) {
  const [zip, setZip] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const normalized = normalizeZip(zip);
  const ok = Boolean(normalized) && isAllowedZip(normalized);

  const handleCheckout = async () => {
    if (!ok) return;
    
    console.log("[ZipGate] Starting checkout with:", {
      zip: normalized,
      email: userEmail,
      lineItems: lineItems,
      planId,
      total
    });
    
    setIsLoading(true);
    try {
      // First try the new session API with ZIP validation
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zip: normalized,
          email: userEmail,
          lineItems: lineItems.map(item => ({
            price: item.stripe_price_id,
            quantity: item.qty || 1,
          })),
          plan: "weekly", // or get from line items
        }),
      });

      const data = await response.json();
      console.log("[ZipGate] Checkout response:", data);
      
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      } else {
        console.error("[ZipGate] New checkout API failed:", data);
        
        // Fallback to original checkout API if new one fails
        console.log("[ZipGate] Trying fallback to original checkout API");
        const fallbackResponse = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan_id: planId }),
        });

        const fallbackData = await fallbackResponse.json();
        console.log("[ZipGate] Fallback checkout response:", fallbackData);
        
        if (fallbackData.url) {
          window.location.href = fallbackData.url;
          return;
        } else {
          alert(data.message || fallbackData.error || "Unable to start checkout.");
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("There was an error processing your checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="zipCode">Delivery ZIP code</Label>
        <Input
          id="zipCode"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="e.g., 06902"
          inputMode="numeric"
          maxLength={10}
        />
        {!ok && normalized && (
          <p className="text-sm text-red-600">
            We currently deliver only to Westchester County, NY and Fairfield County, CT.
          </p>
        )}
      </div>
      
      <Button
        onClick={handleCheckout}
        disabled={!ok || isLoading}
        className="w-full bg-[#635bff] hover:bg-[#5a52e8] text-white"
        size="lg"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isLoading ? "Processing..." : `Pay with Stripe - $${total.toFixed(2)}`}
      </Button>
    </div>
  );
}
