"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Shield, Truck, TrendingUp, Phone, Package } from "lucide-react"
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

interface ManageUserRolesProps {
  userId: string
  currentRoles: string[]
  userName: string
}

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Admin', icon: Shield, description: 'Full access to admin panel' },
  { id: 'sales_manager', label: 'Sales Manager', icon: TrendingUp, description: 'Manage sales team and all leads' },
  { id: 'sales_rep', label: 'Sales Rep', icon: Phone, description: 'Manage assigned leads and customer outreach' },
  { id: 'delivery_driver', label: 'Delivery Driver', icon: Truck, description: 'Access to delivery management' },
  { id: 'operations', label: 'Operations', icon: Package, description: 'Manage inventory and production batching' },
]

export function ManageUserRoles({ userId, currentRoles, userName }: ManageUserRolesProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId])
    } else {
      setSelectedRoles(prev => prev.filter(r => r !== roleId))
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/users/update-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          roles: selectedRoles,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update roles")
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      console.error("Error updating roles:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (roleId: string) => {
    const role = AVAILABLE_ROLES.find(r => r.id === roleId)
    if (!role) return null

    const Icon = role.icon

    const colorClass = {
      admin: 'bg-purple-100 text-purple-800',
      sales_manager: 'bg-green-100 text-green-800',
      sales_rep: 'bg-emerald-100 text-emerald-800',
      delivery_driver: 'bg-blue-100 text-blue-800',
      operations: 'bg-orange-100 text-orange-800',
    }[roleId] || 'bg-gray-100 text-gray-800'

    return (
      <Badge key={roleId} variant="secondary" className={colorClass}>
        <Icon className="h-3 w-3 mr-1" />
        {role.label}
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Current Roles:</span>
        {currentRoles.length > 0 ? (
          currentRoles.map(role => getRoleBadge(role))
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            User
          </Badge>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Manage Roles
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Select the roles for <strong>{userName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {AVAILABLE_ROLES.map(role => {
              const Icon = role.icon
              return (
                <div key={role.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={role.id}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor={role.id}
                      className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <Icon className="h-4 w-4" />
                      {role.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
