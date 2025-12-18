import * as LucideIcons from "lucide-react"
import { NOTIFICATION_ICON_NAMES, NOTIFICATION_ICON_BG_COLORS, NOTIFICATION_ICON_COLORS } from "@/lib/notifications/types"
import { cn } from "@/lib/utils"

interface NotificationIconProps {
  notificationType: string
  className?: string
  iconSize?: string
}

export function NotificationIcon({ notificationType, className, iconSize = "h-5 w-5" }: NotificationIconProps) {
  const iconName = NOTIFICATION_ICON_NAMES[notificationType] || 'Bell'
  const bgColor = NOTIFICATION_ICON_BG_COLORS[notificationType] || 'bg-gray-100'
  const iconColor = NOTIFICATION_ICON_COLORS[notificationType] || 'text-gray-600'

  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Bell

  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg flex-shrink-0",
      bgColor,
      className
    )}>
      <IconComponent className={cn(iconSize, iconColor)} />
    </div>
  )
}
