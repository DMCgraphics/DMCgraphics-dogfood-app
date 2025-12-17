"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Phone, Calendar, User, Filter, Search, Sparkles, UserPlus } from "lucide-react"
import Link from "next/link"
import { AssignLeadDialog } from "./assign-lead-dialog"
import { UpdateLeadStatusDialog } from "./update-lead-status-dialog"
import { useRouter } from "next/navigation"

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
  zip_code: string | null
  created_at: string
  last_contacted_at: string | null
  next_follow_up_at: string | null
  contact_count: number
}

interface SalesTeamMember {
  id: string
  full_name: string | null
  email: string
  roles: string[]
}

interface LeadsTableProps {
  leads: Lead[]
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

export function LeadsTable({ leads, salesTeam }: LeadsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [assignedFilter, setAssignedFilter] = useState<string>("all")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.full_name?.toLowerCase().includes(searchLower) ||
        lead.dog_name?.toLowerCase().includes(searchLower)

      // Status filter
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter

      // Priority filter
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter

      // Source filter
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter

      // Assigned filter
      const matchesAssigned = assignedFilter === "all" ||
        (assignedFilter === "unassigned" && !lead.assigned_to) ||
        (assignedFilter !== "unassigned" && lead.assigned_to === assignedFilter)

      return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesAssigned
    })
  }, [leads, searchTerm, statusFilter, priorityFilter, sourceFilter, assignedFilter])

  // Get unique sources for filter
  const uniqueSources = Array.from(new Set(leads.map(l => l.source)))

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id))
    }
  }

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleAutoAssign = async (strategy: 'round-robin' | 'workload' = 'round-robin') => {
    if (selectedLeads.length === 0) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/sales/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedLeads,
          strategy,
          excludeManagers: false,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Successfully assigned ${data.stats.success} leads using ${strategy} strategy`)
        setSelectedLeads([])
        router.refresh()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Auto-assign error:', error)
      alert('Failed to auto-assign leads')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRescore = async () => {
    if (selectedLeads.length === 0) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/sales/rescore-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeads }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Successfully rescored ${data.stats.updated} leads`)
        setSelectedLeads([])
        router.refresh()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Rescore error:', error)
      alert('Failed to rescore leads')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or dog..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="nurturing">Nurturing</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
              </SelectContent>
            </Select>

            {/* Assigned Filter */}
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {salesTeam.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {(statusFilter !== "all" || priorityFilter !== "all" || sourceFilter !== "all" || assignedFilter !== "all" || searchTerm) && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary">
                  Search: {searchTerm}
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary">
                  Status: {formatStatus(statusFilter)}
                </Badge>
              )}
              {priorityFilter !== "all" && (
                <Badge variant="secondary">
                  Priority: {priorityFilter}
                </Badge>
              )}
              {assignedFilter !== "all" && (
                <Badge variant="secondary">
                  {assignedFilter === "unassigned"
                    ? "Unassigned"
                    : `Assigned: ${salesTeam.find(m => m.id === assignedFilter)?.full_name || "Unknown"}`
                  }
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setPriorityFilter("all")
                  setSourceFilter("all")
                  setAssignedFilter("all")
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {selectedLeads.length} lead{selectedLeads.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAutoAssign('round-robin')}
                  disabled={isProcessing}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Auto-Assign (Round Robin)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAutoAssign('workload')}
                  disabled={isProcessing}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Auto-Assign (Balance Workload)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRescore}
                  disabled={isProcessing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Rescore
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeads([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No leads found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={() => handleSelectLead(lead.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {lead.full_name || lead.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.dog_name && (
                          <div className="text-xs text-muted-foreground">
                            Dog: {lead.dog_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatSource(lead.source)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UpdateLeadStatusDialog
                        leadId={lead.id}
                        currentStatus={lead.status}
                      >
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(lead.status)} cursor-pointer hover:opacity-80`}
                        >
                          {formatStatus(lead.status)}
                        </Badge>
                      </UpdateLeadStatusDialog>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getPriorityColor(lead.priority)}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AssignLeadDialog
                        leadId={lead.id}
                        currentAssignee={lead.assigned_to}
                        salesTeam={salesTeam}
                      >
                        {lead.assigned_to_user ? (
                          <Button variant="ghost" size="sm" className="h-auto p-2">
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              <span className="text-xs">
                                {lead.assigned_to_user.profiles?.full_name || lead.assigned_to_user.email}
                              </span>
                            </div>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            Assign
                          </Button>
                        )}
                      </AssignLeadDialog>
                    </TableCell>
                    <TableCell>
                      {lead.last_contacted_at ? (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.last_contacted_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {lead.contact_count} {lead.contact_count === 1 ? 'contact' : 'contacts'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/sales/leads/${lead.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
