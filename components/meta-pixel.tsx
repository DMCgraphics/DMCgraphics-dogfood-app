"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

/**
 * Meta (Facebook) Pixel Integration
 *
 * Tracks key events for retargeting and conversion optimization:
 * - PageView: All page visits
 * - ViewContent: Plan builder, pricing pages
 * - InitiateCheckout: Checkout page visits
 * - AddToCart: Product added to cart
 * - Purchase: Successful subscription/purchase
 *
 * To set up:
 * 1. Add NEXT_PUBLIC_META_PIXEL_ID to .env.local
 * 2. Create Meta Pixel in Facebook Events Manager
 * 3. Add pixel ID to environment variable
 */

declare global {
  interface Window {
    fbq: any
  }
}

export function MetaPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

  useEffect(() => {
    if (!pixelId) {
      console.warn("[Meta Pixel] NEXT_PUBLIC_META_PIXEL_ID not set")
      return
    }

    // Track page views on route change
    if (window.fbq) {
      window.fbq("track", "PageView")
    }
  }, [pathname, searchParams, pixelId])

  // Don't render if no pixel ID
  if (!pixelId) {
    return null
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}

/**
 * Track custom Meta Pixel events
 * Use throughout the app to track user actions
 */
export function trackMetaEvent(eventName: string, data?: Record<string, any>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, data)
  }
}

/**
 * Track standard Meta Pixel events with proper data structure
 */
export const metaPixelEvents = {
  /**
   * Track when user views plan builder or pricing
   */
  viewContent: (data?: { content_name?: string; content_category?: string; value?: number }) => {
    trackMetaEvent("ViewContent", data)
  },

  /**
   * Track when user adds item to cart
   */
  addToCart: (data?: { content_name?: string; content_ids?: string[]; value?: number; currency?: string }) => {
    trackMetaEvent("AddToCart", {
      currency: "USD",
      ...data,
    })
  },

  /**
   * Track when user initiates checkout
   */
  initiateCheckout: (data?: { value?: number; currency?: string; num_items?: number }) => {
    trackMetaEvent("InitiateCheckout", {
      currency: "USD",
      ...data,
    })
  },

  /**
   * Track when user completes purchase
   */
  purchase: (data?: { value: number; currency?: string; content_ids?: string[]; content_type?: string }) => {
    trackMetaEvent("Purchase", {
      currency: "USD",
      content_type: "product",
      ...data,
    })
  },

  /**
   * Track when user completes lead form
   */
  lead: (data?: { content_name?: string; value?: number }) => {
    trackMetaEvent("Lead", data)
  },

  /**
   * Track when user starts trial/subscription
   */
  startTrial: (data?: { value?: number; currency?: string; predicted_ltv?: number }) => {
    trackMetaEvent("StartTrial", {
      currency: "USD",
      ...data,
    })
  },

  /**
   * Track when user subscribes
   */
  subscribe: (data?: { value: number; currency?: string; predicted_ltv?: number }) => {
    trackMetaEvent("Subscribe", {
      currency: "USD",
      ...data,
    })
  },
}
