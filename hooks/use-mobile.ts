"use client"

import { useEffect, useState } from "react"

/**
 * Returns:
 *   - true  => viewport width <= breakpoint (mobile)
 *   - false => viewport width  > breakpoint (desktop)
 *   - null  => not yet measured (initial render, avoids SSR mismatch)
 */
export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setIsMobile(mq.matches)

    update() // set immediately on mount

    if (mq.addEventListener) {
      mq.addEventListener("change", update)
      return () => mq.removeEventListener("change", update)
    } else {
      // legacy Safari
      // @ts-ignore
      mq.addListener(update)
      // @ts-ignore
      return () => mq.removeListener(update)
    }
  }, [breakpoint])

  return isMobile
}
