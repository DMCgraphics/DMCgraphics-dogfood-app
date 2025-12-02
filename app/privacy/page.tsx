import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | NouriPet",
  description: "Privacy Policy for NouriPet - How we collect, use, and protect your information",
  robots: "index, follow",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-padding">
        <div className="container max-w-4xl">
          <div className="prose prose-gray max-w-none">
            <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: December 2025</p>

            <p>
              This Privacy Policy describes how NouriPet LLC ("we," "us," "our") collects, uses, and protects your
              information when you use our website, create an account, or purchase products.
            </p>
            <p>By using our Services, you consent to this Privacy Policy.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            <p>We may collect:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Personal Information</h3>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Delivery address</li>
              <li>Account login credentials</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Payment Information</h3>
            <p>
              We do not store full credit card numbers. Payments are securely handled by Stripe.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.3 Pet Information</h3>
            <ul>
              <li>Pet name</li>
              <li>Breed</li>
              <li>Weight</li>
              <li>Age</li>
              <li>Dietary preferences or allergies (optional)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.4 Usage Data</h3>
            <ul>
              <li>Pages visited</li>
              <li>IP address</li>
              <li>Device type</li>
              <li>Session behavior (e.g., via analytics like FullStory or Google Analytics)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Process orders, subscriptions, and payments</li>
              <li>Deliver meals to your location</li>
              <li>Provide support and respond to inquiries</li>
              <li>Improve the website and user experience</li>
              <li>Send marketing emails and updates (you may opt out anytime)</li>
              <li>Prevent fraud or misuse of our Services</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Sharing of Information</h2>
            <p>We do not sell your data.</p>
            <p>We may share information only with trusted third parties needed to operate our Services:</p>
            <ul>
              <li>Stripe (payment processing)</li>
              <li>Supabase (database and authentication)</li>
              <li>Email/SMS providers (order updates, delivery notifications)</li>
              <li>Analytics tools (site performance analysis)</li>
              <li>Delivery partners (if applicable)</li>
            </ul>
            <p>All third-party partners follow security and privacy standards.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Cookies & Tracking</h2>
            <p>We may use cookies, pixels, and similar technologies to:</p>
            <ul>
              <li>Log you into your account</li>
              <li>Keep items in your cart</li>
              <li>Analyze site performance</li>
              <li>Personalize your experience</li>
            </ul>
            <p>
              You may disable cookies in your browser, but some features may not work properly.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Data Security</h2>
            <p>We use industry-standard security measures including:</p>
            <ul>
              <li>HTTPS encryption</li>
              <li>Access controls and permission policies</li>
              <li>Secure third-party services such as Stripe and Supabase</li>
            </ul>
            <p>No system is 100% perfect, but we take all reasonable steps to protect your information.</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain your information for as long as you have an account or as needed to provide Services. You may
              request deletion of your account and personal data at any time.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Your Rights</h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul>
              <li>Access the personal data we hold</li>
              <li>Request corrections</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing</li>
              <li>Request a copy of your data</li>
            </ul>
            <p>
              To make a request, email{" "}
              <a href="mailto:support@nouripet.com" className="text-primary hover:underline">
                support@nouripet.com
              </a>
              .
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              We do not knowingly collect information from individuals under 18. If we discover such data, we will
              delete it.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If changes are significant, we will notify you via
              email or through your account.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">10. Contact Us</h2>
            <p>
              Questions? Contact us at{" "}
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
