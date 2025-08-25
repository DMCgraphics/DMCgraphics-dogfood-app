export interface VetVerificationRequest {
  id: string
  userId: string
  dogName: string
  prescriptionDietId: string
  prescriptionDietName: string
  vetInfo: {
    name: string
    clinic: string
    phone: string
    email: string
  }
  prescriptionDetails: {
    notes: string
    fileUrl?: string
    fileName?: string
  }
  status: "pending" | "approved" | "rejected" | "requires-clarification"
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  reviewNotes?: string
  expiresAt?: Date
}

export interface VetDashboardUser {
  id: string
  name: string
  email: string
  clinic: string
  licenseNumber: string
  isVerified: boolean
  specializations: string[]
}

// Mock verification requests for demo
export const mockVerificationRequests: VetVerificationRequest[] = [
  {
    id: "req-001",
    userId: "user-123",
    dogName: "Max",
    prescriptionDietId: "renal-support",
    prescriptionDietName: "Renal Support Formula",
    vetInfo: {
      name: "Dr. Sarah Johnson",
      clinic: "Westside Animal Hospital",
      phone: "(555) 123-4567",
      email: "sjohnson@westsideah.com",
    },
    prescriptionDetails: {
      notes: "Chronic kidney disease stage 2. Requires low phosphorus diet. Monitor BUN/creatinine monthly.",
      fileUrl: "/mock-prescription.pdf",
      fileName: "max-prescription-2024.pdf",
    },
    status: "pending",
    submittedAt: new Date("2024-01-15T10:30:00Z"),
  },
  {
    id: "req-002",
    userId: "user-456",
    dogName: "Luna",
    prescriptionDietId: "hepatic-support",
    prescriptionDietName: "Hepatic Support Formula",
    vetInfo: {
      name: "Dr. Michael Chen",
      clinic: "City Pet Clinic",
      phone: "(555) 987-6543",
      email: "mchen@citypet.com",
    },
    prescriptionDetails: {
      notes: "Hepatic lipidosis. Low copper diet required. Recheck liver enzymes in 4 weeks.",
    },
    status: "approved",
    submittedAt: new Date("2024-01-10T14:20:00Z"),
    reviewedAt: new Date("2024-01-12T09:15:00Z"),
    reviewedBy: "Dr. Michael Chen",
    reviewNotes: "Prescription approved. Diet appropriate for condition.",
    expiresAt: new Date("2024-07-12T09:15:00Z"),
  },
]

export function getVerificationRequestById(id: string): VetVerificationRequest | undefined {
  return mockVerificationRequests.find((req) => req.id === id)
}

export function getVerificationRequestsByVet(vetEmail: string): VetVerificationRequest[] {
  return mockVerificationRequests.filter((req) => req.vetInfo.email === vetEmail)
}

export function getVerificationRequestsByUser(userId: string): VetVerificationRequest[] {
  return mockVerificationRequests.filter((req) => req.userId === userId)
}

export function createVerificationRequest(
  data: Omit<VetVerificationRequest, "id" | "submittedAt" | "status">,
): VetVerificationRequest {
  const request: VetVerificationRequest = {
    ...data,
    id: `req-${Date.now()}`,
    status: "pending",
    submittedAt: new Date(),
  }

  mockVerificationRequests.push(request)
  return request
}

export function updateVerificationStatus(
  requestId: string,
  status: VetVerificationRequest["status"],
  reviewNotes?: string,
  reviewedBy?: string,
): VetVerificationRequest | null {
  const request = mockVerificationRequests.find((req) => req.id === requestId)
  if (!request) return null

  request.status = status
  request.reviewedAt = new Date()
  request.reviewNotes = reviewNotes
  request.reviewedBy = reviewedBy

  if (status === "approved") {
    // Set expiration to 6 months from approval
    request.expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
  }

  return request
}

export function sendVerificationEmail(request: VetVerificationRequest): void {
  // Mock email sending
  console.log(`[v0] Sending verification email to ${request.vetInfo.email}`)
  console.log(`[v0] Request ID: ${request.id}`)
  console.log(`[v0] Diet: ${request.prescriptionDietName}`)
  console.log(`[v0] Patient: ${request.dogName}`)
}

export function sendStatusUpdateEmail(request: VetVerificationRequest): void {
  // Mock email sending to pet owner
  console.log(`[v0] Sending status update email for request ${request.id}`)
  console.log(`[v0] Status: ${request.status}`)
  console.log(`[v0] Diet: ${request.prescriptionDietName}`)
}
