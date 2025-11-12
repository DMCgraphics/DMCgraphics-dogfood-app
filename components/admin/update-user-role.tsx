"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, ShieldOff } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UpdateUserRoleProps {
  userId: string
  currentIsAdmin: boolean
  userName: string
}

export function UpdateUserRole({ userId, currentIsAdmin, userName }: UpdateUserRoleProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleUpdateRole = async (newIsAdmin: boolean) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isAdmin: newIsAdmin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role")
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      console.error("Error updating role:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Current Role:</span>
        {currentIsAdmin ? (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            User
          </Badge>
        )}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          {currentIsAdmin ? (
            <Button variant="outline" size="sm" disabled={isLoading}>
              <ShieldOff className="h-4 w-4 mr-2" />
              Remove Admin
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={isLoading}>
              <Shield className="h-4 w-4 mr-2" />
              Make Admin
            </Button>
          )}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentIsAdmin ? "Remove Admin Access" : "Grant Admin Access"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentIsAdmin ? (
                <>
                  Are you sure you want to remove admin access from <strong>{userName}</strong>?
                  They will no longer be able to access the admin panel.
                </>
              ) : (
                <>
                  Are you sure you want to grant admin access to <strong>{userName}</strong>?
                  They will be able to access the admin panel and manage users, orders, and other administrative functions.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleUpdateRole(!currentIsAdmin)}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}