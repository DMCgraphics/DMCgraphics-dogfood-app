"use client"

import { useState } from "react"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import type { Citation } from "@/lib/ai/citations"
import { formatCitation } from "@/lib/ai/citations"

interface CitationBadgeProps {
  citation: Citation
  number?: number
}

export function CitationBadge({ citation, number }: CitationBadgeProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full inline-flex items-center justify-center mx-0.5"
        >
          <GraduationCap className="h-3 w-3" />
          {number && <span className="sr-only">[{number}]</span>}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" side="top">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{citation.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCitation(citation)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{citation.summary}</p>
          {citation.url && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              View Source →
            </a>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

/**
 * Inline citation reference
 */
export function CitationRef({ number }: { number: number }) {
  return (
    <sup className="text-blue-600 dark:text-blue-400 font-medium text-xs ml-0.5 cursor-help">
      [{number}]
    </sup>
  )
}
