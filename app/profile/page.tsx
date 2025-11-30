import { ProtectedRoute } from "@/components/auth/protected-route"
import { ProfileContent } from "./profile-content"

export default function ProfilePage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <ProfileContent />
    </ProtectedRoute>
  )
}
