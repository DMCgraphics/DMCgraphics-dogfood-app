"use client"

import { useState } from "react"
import { GraduationCap, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Citation } from "@/lib/ai/citations"
import { formatCitation } from "@/lib/ai/citations"

interface CitationsSectionProps {
  citations: Citation[]
}

export function CitationsSection({ citations }: CitationsSectionProps) {
  const [showCitations, setShowCitations] = useState(false)

  if (citations.length === 0) {
    return null
  }

  return (
    <div className="border-t pt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowCitations(!showCitations)}
        className="w-full justify-between text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30"
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Scientific References ({citations.length})</span>
        </div>
        {showCitations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showCitations && (
        <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {citations.map((citation, index) => (
            <div
              key={citation.id}
              className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg text-sm"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 font-semibold text-blue-600 dark:text-blue-400 text-xs">
                  [{index + 1}]
                </span>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm">{citation.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {formatCitation(citation)}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {citation.summary}
                  </p>
                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View Source →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="text-xs text-muted-foreground italic px-3">
            All recommendations are reviewed by veterinary nutrition experts and based on current scientific understanding.
          </div>
        </div>
      )}
    </div>
  )
}
