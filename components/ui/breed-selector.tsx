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
  const measuredMobile = useMobile(768)
  const isMobile = measuredMobile === true
  
  // Use React's useId for stable, unique IDs
  const searchInputId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debug logging
  console.log('BreedSelector received options:', options?.length || 0, 'breeds')
  
  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : []

  // Focus the search input when dialog/drawer opens
  useEffect(() => {
    if (open) {
      console.log('Modal opened, attempting to focus search input')
      // Use multiple attempts to focus the input
      const focusAttempts = [100, 200, 300]
      const timers = focusAttempts.map(delay => 
        setTimeout(() => {
          if (searchInputRef.current) {
            console.log(`Focus attempt at ${delay}ms`)
            searchInputRef.current.focus()
          }
        }, delay)
      )
      return () => timers.forEach(clearTimeout)
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
    safeOptions.filter(o => 
      o.label.toLowerCase().includes(canonicalizedSearch.toLowerCase()) ||
      o.value.toLowerCase().includes(canonicalizedSearch.toLowerCase())
    ), [safeOptions, canonicalizedSearch]
  )
  const selected = useMemo(() => safeOptions.find(o => o.value === value), [safeOptions, value])

  const handleSelect = useCallback((opt: BreedOption) => {
    console.log('Breed selected:', opt.label, opt.value)
    const canonicalizedValue = canonicalizeBreed(opt.value)
    console.log('Canonicalized value:', canonicalizedValue)
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
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
        <p className="text-sm text-yellow-800">Debug: Modal content is rendering</p>
        <p className="text-xs text-yellow-600">Options count: {safeOptions.length}</p>
        <p className="text-xs text-yellow-600">Filtered count: {filtered.length}</p>
        <p className="text-xs text-yellow-600">Search value: "{search}"</p>
        <button
          type="button"
          onClick={() => {
            console.log('Test button clicked!')
            alert('Test button works!')
          }}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Test Click
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          id={searchInputId}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => {
            console.log('Input onChange triggered:', e.target.value)
            setSearch(e.target.value)
          }}
          onKeyDown={(e) => {
            console.log('Input onKeyDown triggered:', e.key)
            handleKeyDown(e)
          }}
          className="pl-10"
          inputMode="search"
          role="searchbox"
          aria-label="Search dog breeds"
          aria-describedby={`${searchInputId}-description`}
          autoComplete="off"
          autoFocus={false}
          onFocus={() => console.log('Search input focused')}
          onBlur={() => console.log('Search input blurred')}
          onMouseDown={() => console.log('Input mouse down')}
          onMouseUp={() => console.log('Input mouse up')}
          onClick={() => console.log('Input clicked')}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Manual focus button clicked')
            searchInputRef.current?.focus()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Focus button mouse down')
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground bg-red-100 px-1 py-0.5 rounded"
        >
          Focus
        </button>
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
        {safeOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No breed options available. Please refresh the page.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="space-y-1">
            {filtered.map(opt => {
              const isSelected = selected?.value === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Breed button clicked:', opt.label)
                    handleSelect(opt)
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Breed button mouse down:', opt.label)
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Breed button mouse up:', opt.label)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors border border-gray-200",
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
  ), [search, filtered, selected, handleSelect, handleKeyDown, searchInputId, searchPlaceholder, emptyMessage, isMobile, safeOptions])

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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Mobile breed selector button clicked')
            }}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Mobile breed selector button mouse down')
            }}
            onMouseUp={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Mobile breed selector button mouse up')
            }}
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

  // ---- Desktop: Dialog ----
  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-10 px-3 py-2 text-left font-normal bg-transparent"
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Breed selector button clicked, current open state:', open);
          setOpen(o => !o);
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Breed selector button mouse down')
        }}
        onMouseUp={(e) => {
          e.preventDefault()
          e.stopPropagation()
          console.log('Breed selector button mouse up')
        }}
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