"use client"

import { useCallback, useEffect, useMemo, useState, useId, useRef } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { canonicalizeBreed, type BreedOption as MixedBreedOption } from "@/lib/data/dog-breeds-mixed"

interface BreedOption { value: string; label: string }
interface BreedSelectorProps {
  options: BreedOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

export function BreedSelector({
  options,
  value,
  onValueChange,
  placeholder = "Select breed...",
  searchPlaceholder = "Search breeds...",
  emptyMessage = "No breeds found.",
}: BreedSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const measuredMobile = useMobile(768)       // true | false | null
  const isMobile = measuredMobile === true    // treat null as desktop
  
  // Use React's useId for stable, unique IDs
  const searchInputId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus the search input when dialog/drawer opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      // Use requestAnimationFrame for better timing with Radix UI
      requestAnimationFrame(() => {
        searchInputRef.current?.focus()
      })
    }
  }, [open])

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("")
    }
  }, [open])

  const canonicalizedSearch = useMemo(() => canonicalizeBreed(search), [search])
  const filtered = useMemo(() => 
    options.filter(o => 
      o.label.toLowerCase().includes(canonicalizedSearch.toLowerCase()) ||
      o.value.toLowerCase().includes(canonicalizedSearch.toLowerCase())
    ), [options, canonicalizedSearch]
  )
  const selected = useMemo(() => options.find(o => o.value === value), [options, value])

  const handleSelect = useCallback((opt: BreedOption) => {
    const canonicalizedValue = canonicalizeBreed(opt.value)
    onValueChange(canonicalizedValue)
    setOpen(false)
    setSearch("")
  }, [onValueChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim() && filtered.length === 0) {
      // Allow free-text fallback when no matches found
      const canonicalizedValue = canonicalizeBreed(search)
      onValueChange(canonicalizedValue)
      setOpen(false)
      setSearch("")
    }
  }, [search, filtered.length, onValueChange])

  const BreedList = useCallback(() => (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          id={searchInputId}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10"
          inputMode="search"
          role="searchbox"
          aria-label="Search dog breeds"
          aria-describedby={`${searchInputId}-description`}
          autoComplete="off"
        />
        <div id={`${searchInputId}-description`} className="sr-only">
          Type to search through available dog breeds
        </div>
      </div>
      {search.trim() && filtered.length === 0 && (
        <div className="text-xs text-muted-foreground px-1">
          Don't see your dog's breed? Press Enter to use what you typed.
        </div>
      )}

      <div className={cn("max-h-60 overflow-y-auto", isMobile && "max-h-[50vh]")} role="listbox">
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="space-y-1">
            {filtered.map(opt => {
              const isSelected = selected?.value === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                >
                  <span className="font-medium">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  ), [search, filtered, selected, handleSelect, handleKeyDown, searchInputId, searchPlaceholder, emptyMessage, isMobile])

  // Show loading state while mobile detection is happening to prevent flickering
  if (measuredMobile === null) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between h-10 px-3 py-2 text-left font-normal bg-transparent"
        type="button"
        disabled
      >
        <span className="truncate text-muted-foreground">Loading...</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  // ---- Mobile: Drawer ----
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-10 px-3 py-2 text-left font-normal bg-transparent"
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent 
          className="z-[60] h-[80dvh] max-h-[95vh]"
          onOpenAutoFocus={(e) => {
            // Prevent default focus behavior and let our custom focus take over
            e.preventDefault()
            // Focus our input after a brief delay
            setTimeout(() => {
              searchInputRef.current?.focus()
            }, 0)
          }}
        >
          <DrawerHeader className="pb-4">
            <DrawerTitle>Select Breed</DrawerTitle>
            <DrawerDescription>Search and select your dog's breed.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <BreedList />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // ---- Desktop: Dialog (popover-free, bulletproof) ----
  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-10 px-3 py-2 text-left font-normal bg-transparent"
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[480px] z-[1000]"
          onOpenAutoFocus={(e) => {
            // Prevent default focus behavior and let our custom focus take over
            e.preventDefault()
            // Focus our input after a brief delay
            setTimeout(() => {
              searchInputRef.current?.focus()
            }, 0)
          }}
        >
          <DialogHeader>
            <DialogTitle>Select Breed</DialogTitle>
          </DialogHeader>
          <BreedList />
        </DialogContent>
      </Dialog>
    </>
  )
}
