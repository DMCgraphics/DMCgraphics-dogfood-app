// app/cart/page.tsx (example)
"use client";
import ZipGate from "@/components/ZipGate";

export default function CartPage() {
  // Example data - in a real app, this would come from your state management
  const exampleLineItems = [
    { 
      stripe_price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BEEF || "price_example", 
      quantity: 1 
    },
  ];
  
  const exampleTotal = 32.67;
  const examplePlanId = "plan_example";

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium">Teddy's Plan</h3>
          <p className="text-sm text-gray-600">Beef & Quinoa Harvest</p>
          <p className="text-sm text-gray-600">Qty: 1 • Weekly delivery • 30 packs/month</p>
          <p className="text-sm text-gray-600">Daily: 375g (1 x 400g packs)</p>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>$21.00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping:</span>
            <span>$9.99</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax:</span>
            <span>$1.68</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total:</span>
            <span>${exampleTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <ZipGate 
          planId={examplePlanId}
          total={exampleTotal}
          lineItems={exampleLineItems}
          userEmail="user@example.com"
        />
      </div>
    </main>
  );
}
