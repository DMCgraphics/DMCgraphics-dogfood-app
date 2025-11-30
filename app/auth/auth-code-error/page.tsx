"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AuthCodeErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Authentication Error</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            There was a problem with your authentication link. This could be because:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>The link has expired</li>
            <li>The link has already been used</li>
            <li>The link is invalid</li>
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => router.push("/auth/login")}>
              Back to Login
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/resend-verification")}
            >
              Request New Verification Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
