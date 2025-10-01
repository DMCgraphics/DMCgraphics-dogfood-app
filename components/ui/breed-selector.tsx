"use client"

import { useCallback, useEffect, useMemo, useState, useId, useRef } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
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
  const [isMobile, setIsMobile] = useState(false)
  const [hasInitiallyFocused, setHasInitiallyFocused] = useState(false)
  
  const searchInputId = useId()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth <= 768
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobile(isMobileWidth || isTouchDevice)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : []

  // Focus the search input when modal opens
  useEffect(() => {
    if (open && !hasInitiallyFocused) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          // For mobile, also trigger click to ensure keyboard appears
          if (isMobile) {
            searchInputRef.current.click()
          }
          setHasInitiallyFocused(true)
        }
      }, 150) // Increased delay to ensure modal is fully rendered
      return () => clearTimeout(timer)
    }
  }, [open, hasInitiallyFocused, isMobile])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch("")
      setHasInitiallyFocused(false)
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
    const canonicalizedValue = canonicalizeBreed(opt.value)
    onValueChange(canonicalizedValue)
    setOpen(false)
    setSearch("")
  }, [onValueChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim() && filtered.length === 0) {
      const canonicalizedValue = canonicalizeBreed(search)
      onValueChange(canonicalizedValue)
      setOpen(false)
      setSearch("")
    }
  }, [search, filtered.length, onValueChange])

  const handleInputFocus = useCallback(() => {
    // Ensure mobile keyboard appears
    if (isMobile && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isMobile])

  const handleInputClick = useCallback(() => {
    // Ensure mobile keyboard appears on click
    if (isMobile && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.click()
    }
  }, [isMobile])

  const BreedList = () => (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
          autoFocus={false}
          readOnly={false}
          tabIndex={0}
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

      <div className={cn("max-h-60 overflow-y-auto overscroll-contain", isMobile && "max-h-[50vh]")} role="listbox" style={{ WebkitOverflowScrolling: 'touch' }}>
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
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(opt)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-none cursor-pointer select-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                  tabIndex={-1}
                >
                  <span className="font-medium pointer-events-none">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary pointer-events-none" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // Mobile: Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-10 px-3 py-2 text-left font-normal bg-transparent"
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="z-[60] h-[80dvh] max-h-[95vh]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DrawerHeader className="pb-4">
            <DrawerTitle>Select Breed</DrawerTitle>
            <DrawerDescription>Search and select your dog's breed.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 flex-1 overflow-hidden">
            <BreedList />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Dialog
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
        <DialogContent className="sm:max-w-[480px] z-[1000]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Select Breed</DialogTitle>
            <DialogDescription>Search and select your dog's breed.</DialogDescription>
          </DialogHeader>
          <BreedList />
        </DialogContent>
      </Dialog>
    </>
  )
}