"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { Phone, Mail, MessageSquare } from "lucide-react"

interface Lead {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  source: string
  status: string
  priority: string
  last_contacted_at: string | null
  conversion_probability: number
  notes: string | null
  created_at: string
}

interface MyLeadsTableProps {
  leads: Lead[]
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  nurturing: "bg-purple-500",
  converted: "bg-emerald-500",
  lost: "bg-gray-500",
}

const priorityColors: Record<string, string> = {
  hot: "bg-red-500",
  warm: "bg-orange-500",
  cold: "bg-blue-500",
}

const sourceLabels: Record<string, string> = {
  event_signup: "Event Signup",
  early_access: "Early Access",
  abandoned_plan: "Abandoned Plan",
  incomplete_checkout: "Incomplete Checkout",
  individual_pack: "Individual Pack",
  contact_form: "Contact Form",
  medical_request: "Medical Request",
  manual: "Manual",
}

export function MyLeadsTable({ leads }: MyLeadsTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm ||
        lead.email.toLowerCase().includes(searchLower) ||
        lead.full_name?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(searchTerm)

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [leads, searchTerm, statusFilter, priorityFilter])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by email, name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:max-w-sm"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-[180px]">
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

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="md:w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredLeads.length} of {leads.length} leads
      </p>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/sales/leads/${lead.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{lead.full_name || "—"}</span>
                      <span className="text-sm text-muted-foreground">{lead.email}</span>
                      {lead.phone && (
                        <span className="text-sm text-muted-foreground">{lead.phone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sourceLabels[lead.source] || lead.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.status]}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[lead.priority]}>
                      {lead.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${lead.conversion_probability}%` }}
                        />
                      </div>
                      <span className="text-sm">{lead.conversion_probability}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lead.last_contacted_at
                      ? formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {lead.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`tel:${lead.phone}`)}
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`mailto:${lead.email}`)}
                        title="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/sales/leads/${lead.id}`)}
                        title="View details"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
