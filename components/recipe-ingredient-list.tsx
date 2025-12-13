"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface IngredientListProps {
  ingredients: string[]
  premixDetails?: Record<string, string[]>
  className?: string
}

export function RecipeIngredientList({ ingredients, premixDetails = {}, className }: IngredientListProps) {
  const [expandedPremixes, setExpandedPremixes] = useState<Set<string>>(new Set())

  const togglePremix = (premixName: string) => {
    setExpandedPremixes((prev) => {
      const next = new Set(prev)
      if (next.has(premixName)) {
        next.delete(premixName)
      } else {
        next.add(premixName)
      }
      return next
    })
  }

  const isPremix = (ingredient: string) => {
    return ingredient in premixDetails
  }

  return (
    <ul className={cn("space-y-1 text-sm", className)}>
      {ingredients.map((ingredient, index) => {
        const hasPremixDetails = isPremix(ingredient)
        const isExpanded = expandedPremixes.has(ingredient)

        return (
          <li key={index}>
            {hasPremixDetails ? (
              <div>
                <button
                  onClick={() => togglePremix(ingredient)}
                  className="flex items-center gap-1 hover:text-primary transition-colors group w-full text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                  ) : (
                    <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                  )}
                  <span>{ingredient}</span>
                </button>
                {isExpanded && (
                  <ul className="ml-5 mt-1 space-y-0.5 text-xs text-muted-foreground border-l-2 border-muted pl-3">
                    {premixDetails[ingredient].map((detail, detailIndex) => (
                      <li key={detailIndex}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <span>• {ingredient}</span>
            )}
          </li>
        )}
      )}
    </ul>
  )
}
