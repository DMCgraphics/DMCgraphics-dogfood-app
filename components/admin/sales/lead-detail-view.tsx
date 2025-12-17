"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Calendar, User, TrendingUp, ExternalLink } from "lucide-react"
import { AssignLeadDialog } from "./assign-lead-dialog"
import { UpdateLeadStatusDialog } from "./update-lead-status-dialog"
import { AddActivityDialog } from "./add-activity-dialog"
import { EditLeadDialog } from "./edit-lead-dialog"
import { SendEmailDialog } from "./send-email-dialog"
import { EmailActivityItem } from "./email-activity-item"

interface Lead {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  source: string
  status: string
  priority: string
  assigned_to: string | null
  assigned_to_user?: {
    id: string
    email: string
    profiles: {
      full_name: string | null
    } | null
  } | null
  dog_name: string | null
  dog_weight: string | null
  dog_breed: string | null
  zip_code: string | null
  notes: string | null
  tags: string[]
  source_metadata: any
  created_at: string
  last_contacted_at: string | null
  next_follow_up_at: string | null
  contact_count: number
  conversion_probability: number
}

interface Activity {
  id: string
  activity_type: string
  subject: string | null
  description: string
  scheduled_for: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  performed_by_user?: {
    id: string
    email: string
    profiles: {
      full_name: string | null
    } | null
  } | null
  // Email-specific fields
  email_status?: string | null
  email_opened_at?: string | null
  email_open_count?: number | null
  email_clicked_at?: string | null
  email_click_count?: number | null
  email_subject?: string | null
}

interface SalesTeamMember {
  id: string
  full_name: string | null
  email: string
  roles: string[]
}

interface LeadDetailViewProps {
  lead: Lead
  activities: Activity[]
  salesTeam: SalesTeamMember[]
}

function formatSource(source: string): string {
  const sourceMap: Record<string, string> = {
    event_signup: 'Event Raffle',
    early_access: 'Early Access',
    abandoned_plan: 'Abandoned Plan',
    incomplete_checkout: 'Incomplete Checkout',
    individual_pack: 'Individual Pack',
    contact_form: 'Contact Form',
    medical_request: 'Medical Request',
    manual: 'Manual Entry',
  }
  return sourceMap[source] || source
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    nurturing: 'Nurturing',
    converted: 'Converted',
    lost: 'Lost',
    spam: 'Spam',
  }
  return statusMap[status] || status
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-green-100 text-green-800',
    nurturing: 'bg-yellow-100 text-yellow-800',
    converted: 'bg-emerald-100 text-emerald-800',
    lost: 'bg-gray-100 text-gray-800',
    spam: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    hot: 'bg-red-100 text-red-800',
    warm: 'bg-orange-100 text-orange-800',
    cold: 'bg-blue-100 text-blue-800',
  }
  return colorMap[priority] || 'bg-gray-100 text-gray-800'
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'email':
      return <Mail className="h-4 w-4" />
    case 'call':
      return <Phone className="h-4 w-4" />
    case 'meeting':
      return <Calendar className="h-4 w-4" />
    case 'note':
      return <User className="h-4 w-4" />
    case 'status_change':
      return <TrendingUp className="h-4 w-4" />
    default:
      return <Calendar className="h-4 w-4" />
  }
}

export function LeadDetailView({ lead, activities, salesTeam }: LeadDetailViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Lead Info */}
      <div className="lg:col-span-1 space-y-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {lead.full_name || lead.email}
              </CardTitle>
              <EditLeadDialog lead={lead}>
                <Button variant="outline" size="sm">
                  Edit Lead
                </Button>
              </EditLeadDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="hover:underline">
                {lead.email}
              </a>
            </div>

            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${lead.phone}`} className="hover:underline">
                  {lead.phone}
                </a>
              </div>
            )}

            {lead.zip_code && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{lead.zip_code}</span>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <div className="text-sm font-medium">Status</div>
              <UpdateLeadStatusDialog leadId={lead.id} currentStatus={lead.status}>
                <Badge variant="secondary" className={`${getStatusColor(lead.status)} cursor-pointer hover:opacity-80`}>
                  {formatStatus(lead.status)}
                </Badge>
              </UpdateLeadStatusDialog>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Priority</div>
              <Badge variant="secondary" className={getPriorityColor(lead.priority)}>
                {lead.priority}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Conversion Score</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      lead.conversion_probability >= 70
                        ? 'bg-green-500'
                        : lead.conversion_probability >= 50
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${lead.conversion_probability}%` }}
                  />
                </div>
                <span className="text-sm font-bold w-10 text-right">{lead.conversion_probability}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {lead.conversion_probability >= 70
                  ? 'High likelihood to convert'
                  : lead.conversion_probability >= 50
                  ? 'Moderate conversion potential'
                  : 'Needs nurturing'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Assigned To</div>
              <AssignLeadDialog
                leadId={lead.id}
                currentAssignee={lead.assigned_to}
                salesTeam={salesTeam}
              >
                {lead.assigned_to_user ? (
                  <Button variant="outline" size="sm" className="w-full">
                    <User className="h-3 w-3 mr-2" />
                    {lead.assigned_to_user.profiles?.full_name || lead.assigned_to_user.email}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full">
                    Assign to team member
                  </Button>
                )}
              </AssignLeadDialog>
            </div>
          </CardContent>
        </Card>

        {/* Dog Info */}
        {(lead.dog_name || lead.dog_weight || lead.dog_breed) && (
          <Card>
            <CardHeader>
              <CardTitle>Dog Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.dog_name && (
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{lead.dog_name}</div>
                </div>
              )}
              {lead.dog_breed && (
                <div>
                  <div className="text-sm text-muted-foreground">Breed</div>
                  <div className="font-medium">{lead.dog_breed}</div>
                </div>
              )}
              {lead.dog_weight && (
                <div>
                  <div className="text-sm text-muted-foreground">Weight</div>
                  <div className="font-medium">{lead.dog_weight}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Source & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm text-muted-foreground">Source</div>
              <Badge variant="outline">{formatSource(lead.source)}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm">{new Date(lead.created_at).toLocaleString()}</div>
            </div>
            {lead.last_contacted_at && (
              <div>
                <div className="text-sm text-muted-foreground">Last Contact</div>
                <div className="text-sm">{new Date(lead.last_contacted_at).toLocaleString()}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Total Contacts</div>
              <div className="text-sm">{lead.contact_count}</div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {lead.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Activity Timeline */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activity Timeline</CardTitle>
              <div className="flex gap-2">
                <SendEmailDialog
                  leadId={lead.id}
                  leadEmail={lead.email}
                  leadName={lead.full_name}
                >
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </SendEmailDialog>
                <AddActivityDialog leadId={lead.id}>
                  <Button size="sm">Add Activity</Button>
                </AddActivityDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activities yet</p>
                <p className="text-sm mt-2">Add your first activity to start tracking this lead</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex gap-4 ${index !== activities.length - 1 ? 'pb-4 border-b' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium capitalize">
                            {activity.activity_type.replace('_', ' ')}
                            {activity.subject && `: ${activity.subject}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.performed_by_user?.profiles?.full_name ||
                              activity.performed_by_user?.email ||
                              "System"}
                            {" • "}
                            {new Date(activity.created_at).toLocaleString()}
                          </div>
                        </div>
                        {!activity.completed && activity.scheduled_for && (
                          <Badge variant="outline" className="bg-yellow-50">
                            Scheduled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{activity.description}</p>
                      {activity.scheduled_for && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Scheduled for: {new Date(activity.scheduled_for).toLocaleString()}
                        </div>
                      )}
                      {activity.activity_type === 'email' && (
                        <EmailActivityItem activity={activity} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
