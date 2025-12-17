"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { Search, CheckCircle2, UserPlus } from "lucide-react"

interface EventSignup {
  id: string
  event_name: string
  dog_name: string | null
  email: string
  zip_code: string | null
  phone_number: string | null
  subscribe_to_updates: boolean
  utm_source: string | null
  created_at: string
  converted_to_lead: boolean
}

interface EventSignupsTableProps {
  signups: EventSignup[]
}

export function EventSignupsTable({ signups }: EventSignupsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const router = useRouter()
  const { toast } = useToast()

  // Get unique event names for filter
  const eventNames = useMemo(() => {
    return Array.from(new Set(signups.map(s => s.event_name))).sort()
  }, [signups])

  // Filter signups
  const filteredSignups = useMemo(() => {
    return signups.filter(signup => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        signup.email.toLowerCase().includes(searchLower) ||
        signup.dog_name?.toLowerCase().includes(searchLower) ||
        signup.event_name.toLowerCase().includes(searchLower)

      const matchesEvent = eventFilter === "all" || signup.event_name === eventFilter
      
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "converted" && signup.converted_to_lead) ||
        (statusFilter === "not_converted" && !signup.converted_to_lead)

      return matchesSearch && matchesEvent && matchesStatus
    })
  }, [signups, searchTerm, eventFilter, statusFilter])

  const handleConvertToLead = async (signup: EventSignup) => {
    try {
      const response = await fetch("/api/admin/sales/convert-signup-to-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signupId: signup.id,
          email: signup.email,
          dogName: signup.dog_name,
          zipCode: signup.zip_code,
          phone: signup.phone_number,
          eventName: signup.event_name,
          utmSource: signup.utm_source,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to convert signup to lead")
      }

      toast({
        title: "Success",
        description: "Signup converted to lead successfully",
      })

      router.refresh()
    } catch (error) {
      console.error("Error converting signup:", error)
      toast({
        title: "Error",
        description: "Failed to convert signup. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, dog name, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {eventNames.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="not_converted">Not Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredSignups.length} of {signups.length} signups
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Dog</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No signups found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSignups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{signup.email}</div>
                          {signup.phone_number && (
                            <div className="text-sm text-muted-foreground">{signup.phone_number}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{signup.event_name}</div>
                        {signup.utm_source && (
                          <div className="text-xs text-muted-foreground">via {signup.utm_source}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {signup.dog_name || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {signup.zip_code || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(signup.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {signup.converted_to_lead ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Converted
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!signup.converted_to_lead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConvertToLead(signup)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Convert to Lead
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
