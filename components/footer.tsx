import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src="/nouripet-logo.svg" alt="NouriPet Logo" className="h-8 w-8" />
              <span className="font-manrope text-xl font-bold">NouriPet</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Fresh food, fully explained. Science-backed nutrition for dogs who deserve the best.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <div className="space-y-2 text-sm">
              <Link href="/plan-builder" className="block hover:text-primary transition-colors">
                Build Your Plan
              </Link>
              <Link href="/recipes" className="block hover:text-primary transition-colors">
                Recipes
              </Link>
              <Link href="/add-ons" className="block hover:text-primary transition-colors">
                Add-ons
              </Link>
              <Link href="/pricing" className="block hover:text-primary transition-colors">
                Pricing
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/vet-board" className="block hover:text-primary transition-colors">
                Vet Board
              </Link>
              <Link href="/sustainability" className="block hover:text-primary transition-colors">
                Sustainability
              </Link>
              <Link href="/careers" className="block hover:text-primary transition-colors">
                Careers
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Stay Updated</h4>
            <p className="text-sm text-muted-foreground">Get nutrition tips and product updates.</p>
            <div className="flex gap-2">
              <Input placeholder="Enter your email" className="flex-1" />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">© 2024 NouriPet. All rights reserved.</div>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
