"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, AlertCircle, Download, Stethoscope, Calendar, User, Building } from "lucide-react"
import type { VetVerificationRequest } from "@/lib/vet-verification"
import { mockVerificationRequests, updateVerificationStatus, sendStatusUpdateEmail } from "@/lib/vet-verification"

interface VetDashboardProps {
  vetEmail: string
  vetName: string
}

export function VetDashboard({ vetEmail, vetName }: VetDashboardProps) {
  const [requests, setRequests] = useState<VetVerificationRequest[]>(
    mockVerificationRequests.filter((req) => req.vetInfo.email === vetEmail),
  )
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({})

  const handleStatusUpdate = (requestId: string, status: VetVerificationRequest["status"]) => {
    const notes = reviewNotes[requestId] || ""
    const updatedRequest = updateVerificationStatus(requestId, status, notes, vetName)

    if (updatedRequest) {
      setRequests((prev) => prev.map((req) => (req.id === requestId ? updatedRequest : req)))
      sendStatusUpdateEmail(updatedRequest)
      setReviewNotes((prev) => ({ ...prev, [requestId]: "" }))
    }
  }

  const getStatusIcon = (status: VetVerificationRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "requires-clarification":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: VetVerificationRequest["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      case "requires-clarification":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
    }
  }

  const pendingRequests = requests.filter((req) => req.status === "pending")
  const reviewedRequests = requests.filter((req) => req.status !== "pending")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Stethoscope className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Veterinary Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {vetName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved This Month</p>
                <p className="text-2xl font-bold">
                  {reviewedRequests.filter((req) => req.status === "approved").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({reviewedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No pending prescription reviews at this time.</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{request.prescriptionDietName}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Patient: {request.dogName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {request.submittedAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status.replace("-", " ")}</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Patient Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold mb-2">Owner Information</h4>
                      <p className="text-sm text-muted-foreground">Request ID: {request.id}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Clinic Information</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {request.vetInfo.clinic}
                        </div>
                        <p className="text-muted-foreground">{request.vetInfo.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Prescription Details */}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Medical Notes</h4>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm">{request.prescriptionDetails.notes}</p>
                    </div>
                  </div>

                  {/* File Download */}
                  {request.prescriptionDetails.fileUrl && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Prescription ({request.prescriptionDetails.fileName})
                      </Button>
                    </div>
                  )}

                  {/* Review Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor={`notes-${request.id}`}>Review Notes</Label>
                    <Textarea
                      id={`notes-${request.id}`}
                      placeholder="Add your review notes here..."
                      value={reviewNotes[request.id] || ""}
                      onChange={(e) =>
                        setReviewNotes((prev) => ({
                          ...prev,
                          [request.id]: e.target.value,
                        }))
                      }
                      rows={3}
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStatusUpdate(request.id, "approved")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(request.id, "requires-clarification")}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Request Clarification
                      </Button>
                      <Button variant="destructive" onClick={() => handleStatusUpdate(request.id, "rejected")}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          {reviewedRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.prescriptionDietName}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Patient: {request.dogName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Reviewed: {request.reviewedAt?.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1 capitalize">{request.status.replace("-", " ")}</span>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {request.reviewNotes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Review Notes</h4>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm">{request.reviewNotes}</p>
                    </div>
                  </div>
                )}

                {request.status === "approved" && request.expiresAt && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Prescription expires: {request.expiresAt.toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
