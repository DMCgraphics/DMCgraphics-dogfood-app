"use client"

import { Badge } from "@/components/ui/badge"
import { Check, Eye, MousePointerClick, AlertCircle, Send } from "lucide-react"

interface EmailActivityItemProps {
  activity: {
    email_status: string | null
    email_opened_at: string | null
    email_open_count: number | null
    email_clicked_at: string | null
    email_click_count: number | null
    email_subject: string | null
  }
}

export function EmailActivityItem({ activity }: EmailActivityItemProps) {
  if (!activity.email_status) {
    return null
  }

  const getStatusBadge = () => {
    switch (activity.email_status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Send className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Delivered
          </Badge>
        )
      case "opened":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Eye className="h-3 w-3 mr-1" />
            Opened ({activity.email_open_count || 1})
          </Badge>
        )
      case "clicked":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            <MousePointerClick className="h-3 w-3 mr-1" />
            Clicked ({activity.email_click_count || 1})
          </Badge>
        )
      case "bounced":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Bounced
          </Badge>
        )
      case "spam":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Marked as Spam
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-2 mt-2">
      {/* Status Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        {getStatusBadge()}

        {/* First Open Timestamp */}
        {activity.email_opened_at && (
          <span className="text-xs text-muted-foreground">
            First opened: {new Date(activity.email_opened_at).toLocaleString()}
          </span>
        )}
      </div>

      {/* Click Details */}
      {activity.email_click_count && activity.email_click_count > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <MousePointerClick className="h-3 w-3 inline" />
          {activity.email_click_count} click{activity.email_click_count > 1 ? "s" : ""}
          {activity.email_clicked_at && (
            <> • First click: {new Date(activity.email_clicked_at).toLocaleString()}</>
          )}
        </div>
      )}

      {/* Subject Line */}
      {activity.email_subject && (
        <div className="text-sm text-muted-foreground italic">
          Subject: "{activity.email_subject}"
        </div>
      )}
    </div>
  )
}
