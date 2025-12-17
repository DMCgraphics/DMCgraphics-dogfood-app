"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Phone, Mail, MessageSquare, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function QuickActions() {
  const [open, setOpen] = useState(false)
  const [actionType, setActionType] = useState<string | null>(null)

  const handleAction = (type: string) => {
    setActionType(type)
    // In a real implementation, this would open a dialog or form
    // For now, we'll just log it
    console.log("Quick action:", type)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleAction("call")}>
            <Phone className="h-4 w-4 mr-2" />
            Log Call
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("email")}>
            <Mail className="h-4 w-4 mr-2" />
            Log Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("note")}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("schedule")}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Follow-up
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
