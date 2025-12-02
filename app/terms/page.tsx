import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | NouriPet",
  description: "Terms of Service for NouriPet - Fresh dog food subscriptions and deliveries",
  robots: "index, follow",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-padding">
        <div className="container max-w-4xl">
          <div className="prose prose-gray max-w-none">
            <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 2025</p>

            <p>
              Welcome to NouriPet! These Terms of Service ("Terms") govern your access to and use of NouriPet's
              website, services, products, subscriptions, and deliveries ("Services"). By creating an account, placing
              an order, or using our website, you agree to these Terms.
            </p>
            <p>If you do not agree, please do not use our Services.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. About NouriPet</h2>
            <p>
              NouriPet LLC ("we," "us," or "our") provides freshly-made pet meals, toppers, treats, and related
              products delivered through recurring subscriptions, one-time purchases, and local delivery.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Eligibility</h2>
            <p>You must:</p>
            <ul>
              <li>Be at least 18 years old,</li>
              <li>Have authority to agree to these Terms,</li>
              <li>Provide accurate and complete account information.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Accounts</h2>
            <p>When creating an account, you agree to:</p>
            <ul>
              <li>Provide accurate, current information</li>
              <li>Maintain the confidentiality of your login credentials</li>
              <li>Notify us if you suspect unauthorized use of your account</li>
            </ul>
            <p>We may suspend or terminate your account if we detect suspicious or abusive activity.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Orders, Billing & Subscriptions</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Subscription Billing</h3>
            <ul>
              <li>NouriPet meals and toppers may be purchased as recurring subscriptions.</li>
              <li>
                By subscribing, you authorize us and our payment processor (Stripe) to charge your payment method on a
                recurring basis until you cancel.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Pricing</h3>
            <p>
              Pricing may change periodically. We will notify you of material pricing changes by email or via your
              account prior to your next billing date.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Cancellations</h3>
            <ul>
              <li>You may cancel or pause your subscription at any time before your next billing cycle.</li>
              <li>Cancellations made after billing may apply to the next cycle.</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Failed Payments</h3>
            <p>
              If a payment fails, Stripe may automatically retry. If payment cannot be collected, we may pause
              deliveries until the issue is resolved.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Deliveries</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Local Delivery</h3>
            <p>
              We currently deliver to select areas. Delivery availability and windows may vary by location.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Customer Responsibilities</h3>
            <p>You are responsible for:</p>
            <ul>
              <li>Providing a correct delivery address</li>
              <li>Ensuring that delivered meals are promptly refrigerated or frozen</li>
              <li>Maintaining safe food handling (we provide fresh, perishable meals)</li>
            </ul>
            <p>NouriPet is not responsible for spoilage due to late retrieval or improper handling.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Meal Safety & Suitability</h2>
            <p>We formulate recipes using veterinarian-approved nutritional guidelines. However, every pet is different.</p>
            <p>You acknowledge that:</p>
            <ul>
              <li>NouriPet provides general nutritional guidance, not veterinary care</li>
              <li>You should consult your veterinarian regarding medical conditions, allergies, or diet changes</li>
              <li>You are responsible for determining whether our meals are suitable for your pet</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Promotions, Referral Codes & Credits</h2>
            <p>
              From time to time, we may offer promotions, credits, coupons, or referral programs. We may modify or
              discontinue these at any time.
            </p>
            <p>Credits have no cash value and cannot be transferred.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Intellectual Property</h2>
            <p>
              All content, branding, images, recipes, and materials on our site are owned by NouriPet LLC and may not be
              copied or used without written permission.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use our Services for unlawful purposes</li>
              <li>Attempt to access or tamper with systems, code, or databases</li>
              <li>Create accounts using fake information</li>
              <li>Abuse referral or discount systems</li>
            </ul>
            <p>Violations may result in account termination.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Disclaimer</h2>
            <p>
              NouriPet provides meals "as is" without warranties of any kind, including fitness for a particular purpose.
            </p>
            <p>We do not guarantee:</p>
            <ul>
              <li>That your pet will accept or enjoy any meal</li>
              <li>Specific health outcomes or improvement</li>
              <li>Uninterrupted or error-free site operation</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">11. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, NouriPet is not liable for:</p>
            <ul>
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Issues arising from your pet's health, reactions, or dietary sensitivities</li>
              <li>Spoilage due to customer mishandling</li>
              <li>Delays or interruptions beyond our control</li>
            </ul>
            <p>Our maximum liability is limited to the amount you paid for the affected product.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">12. Termination</h2>
            <p>We may suspend or terminate your account for violations of these Terms or misuse of our Services.</p>
            <p>You may terminate your account at any time by contacting us.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">13. Changes to These Terms</h2>
            <p>
              We may update these Terms occasionally. If changes are significant, we will notify you via email or through
              your account.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">14. Contact Us</h2>
            <p>
              For questions, email us at{" "}
              <a href="mailto:support@nouripet.com" className="text-primary hover:underline">
                support@nouripet.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
