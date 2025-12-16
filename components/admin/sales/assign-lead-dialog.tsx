"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface SalesTeamMember {
  id: string
  full_name: string | null
  email: string
  roles: string[]
}

interface AssignLeadDialogProps {
  leadId: string
  currentAssignee: string | null
  salesTeam: SalesTeamMember[]
  children: React.ReactNode
}

export function AssignLeadDialog({
  leadId,
  currentAssignee,
  salesTeam,
  children,
}: AssignLeadDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(currentAssignee)
  const [isLoading, setIsLoading] = useState(false)

  const handleAssign = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/sales/assign-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          assignedTo: selectedAssignee === "unassigned" ? null : selectedAssignee,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign lead")
      }

      toast({
        title: "Lead assigned",
        description: selectedAssignee === "unassigned"
          ? "Lead has been unassigned"
          : `Lead assigned to ${salesTeam.find(m => m.id === selectedAssignee)?.full_name || "team member"}`,
      })

      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Lead</DialogTitle>
          <DialogDescription>
            Assign this lead to a sales team member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select
            value={selectedAssignee || "unassigned"}
            onValueChange={setSelectedAssignee}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {salesTeam.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
