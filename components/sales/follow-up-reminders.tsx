"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Bell, CheckCircle, Clock } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Activity {
  id: string
  lead_id: string
  activity_type: string
  subject: string | null
  description: string | null
  scheduled_for: string | null
  completed: boolean
  created_at: string
}

interface FollowUpRemindersProps {
  activities: Activity[]
}

const activityTypeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  note: "Note",
  meeting: "Meeting",
  text: "Text Message",
  task: "Task",
  status_change: "Status Change",
}

const activityTypeIcons: Record<string, string> = {
  call: "📞",
  email: "✉️",
  note: "📝",
  meeting: "🤝",
  text: "💬",
  task: "✅",
  status_change: "🔄",
}

export function FollowUpReminders({ activities }: FollowUpRemindersProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState<string | null>(null)

  const now = new Date()

  // Separate overdue and upcoming
  const overdue = activities.filter(a => {
    if (!a.scheduled_for) return false
    return new Date(a.scheduled_for) < now
  })

  const upcoming = activities.filter(a => {
    if (!a.scheduled_for) return false
    return new Date(a.scheduled_for) >= now
  }).slice(0, 5) // Show next 5 upcoming

  const handleComplete = async (activityId: string) => {
    setCompleting(activityId)

    try {
      const response = await fetch("/api/admin/sales/complete-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error("Failed to complete activity")
      }
    } catch (error) {
      console.error("Error completing activity:", error)
    } finally {
      setCompleting(null)
    }
  }

  if (activities.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Follow-up Reminders
        </CardTitle>
        <CardDescription>
          {overdue.length > 0 && (
            <span className="text-red-500 font-semibold">
              {overdue.length} overdue
            </span>
          )}
          {overdue.length > 0 && upcoming.length > 0 && " • "}
          {upcoming.length > 0 && (
            <span>{upcoming.length} upcoming</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-500 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Overdue
              </h4>
              {overdue.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{activityTypeIcons[activity.activity_type]}</span>
                      <span className="font-medium">
                        {activity.subject || activityTypeLabels[activity.activity_type]}
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        {formatDistanceToNow(new Date(activity.scheduled_for!), { addSuffix: true })}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/sales/leads/${activity.lead_id}`)}
                    >
                      View Lead
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleComplete(activity.id)}
                      disabled={completing === activity.id}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Upcoming</h4>
              {upcoming.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{activityTypeIcons[activity.activity_type]}</span>
                      <span className="font-medium">
                        {activity.subject || activityTypeLabels[activity.activity_type]}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatDistanceToNow(new Date(activity.scheduled_for!), { addSuffix: true })}
                      </Badge>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/sales/leads/${activity.lead_id}`)}
                    >
                      View Lead
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComplete(activity.id)}
                      disabled={completing === activity.id}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
