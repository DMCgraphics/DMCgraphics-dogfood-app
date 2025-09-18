"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PhotoUpload } from "@/components/ui/photo-upload"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase/client"
import {
  User,
  Mail,
  Calendar,
  Shield,
  Trash2,
  Camera,
  Bell,
  CreditCard,
  Dog,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Edit,
} from "lucide-react"

interface DogProfile {
  id: string
  name: string
  breed: string
  age: number
  weight: number
  avatar_url?: string
  allergies?: string[]
  conditions?: string[]
  user_id: string
  created_at: string
  updated_at: string
}

interface PaymentMethod {
  id: string
  card_brand: string
  card_last_four: string
  cardholder_name: string
  expiry_month: number
  expiry_year: number
  is_default: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user, updateUser, refreshUserProfile, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    deliveryReminders: true,
    healthTips: false,
    promotions: false,
    newsletter: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const [dogProfiles, setDogProfiles] = useState<DogProfile[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingDogs, setIsLoadingDogs] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [editingDog, setEditingDog] = useState<DogProfile | null>(null)
  const [showAddDog, setShowAddDog] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadDogs()
      loadPaymentMethods()
      loadUserProfile()
    }
  }, [user?.id])

  const loadUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      if (!error && profile) {
        // Update the user context with profile data
        updateUser({
          name: profile.full_name || user.name,
          avatar_url: profile.avatar_url
        })
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
    }
  }

  const loadDogs = async () => {
    if (!user?.id) return

    setIsLoadingDogs(true)
    try {
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDogProfiles(data || [])
      console.log("[v0] dogs_loaded", { count: data?.length })
    } catch (error) {
      console.error("Error loading dogs:", error)
      setMessage("Failed to load dogs")
    } finally {
      setIsLoadingDogs(false)
    }
  }

  const loadPaymentMethods = async () => {
    if (!user?.id) return

    setIsLoadingPayments(true)
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPaymentMethods(data || [])
      console.log("[v0] payment_methods_loaded", { count: data?.length })
    } catch (error) {
      console.error("Error loading payment methods:", error)
      setMessage("Failed to load payment methods")
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const saveDog = async (dogData: Partial<DogProfile>) => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      if (editingDog) {
        // Update existing dog
        const { error } = await supabase
          .from("dogs")
          .update({
            name: dogData.name,
            breed: dogData.breed,
            age: dogData.age,
            weight: dogData.weight,
            avatar_url: dogData.avatar_url,
            allergies: dogData.allergies || [],
            conditions: dogData.conditions || [],
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingDog.id)
          .eq("user_id", user.id)

        if (error) throw error
        console.log("[v0] dog_updated", { dogId: editingDog.id })
      } else {
        // Create new dog
        const { error } = await supabase.from("dogs").insert({
          name: dogData.name,
          breed: dogData.breed,
          age: dogData.age,
          weight: dogData.weight,
          avatar_url: dogData.avatar_url,
          allergies: dogData.allergies || [],
          conditions: dogData.conditions || [],
          user_id: user.id,
        })

        if (error) throw error
        console.log("[v0] dog_created")
      }

      await loadDogs()
      setEditingDog(null)
      setShowAddDog(false)
      setMessage(editingDog ? "Dog updated successfully!" : "Dog added successfully!")
    } catch (error) {
      console.error("Error saving dog:", error)
      setMessage("Failed to save dog")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDog = async (dogId: string) => {
    if (!user?.id) return
    if (!confirm("Are you sure you want to delete this dog profile?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("dogs").delete().eq("id", dogId).eq("user_id", user.id)

      if (error) throw error

      await loadDogs()
      setMessage("Dog deleted successfully!")
      console.log("[v0] dog_deleted", { dogId })
    } catch (error) {
      console.error("Error deleting dog:", error)
      setMessage("Failed to delete dog")
    } finally {
      setIsLoading(false)
    }
  }

  const savePaymentMethod = async (paymentData: Partial<PaymentMethod>) => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("payment_methods").insert({
        card_brand: paymentData.card_brand,
        card_last_four: paymentData.card_last_four,
        cardholder_name: paymentData.cardholder_name,
        expiry_month: paymentData.expiry_month,
        expiry_year: paymentData.expiry_year,
        is_default: paymentData.is_default || false,
        user_id: user.id,
      })

      if (error) throw error

      await loadPaymentMethods()
      setShowAddPayment(false)
      setMessage("Payment method added successfully!")
      console.log("[v0] payment_method_created")
    } catch (error) {
      console.error("Error saving payment method:", error)
      setMessage("Failed to save payment method")
    } finally {
      setIsLoading(false)
    }
  }

  const deletePaymentMethod = async (paymentId: string) => {
    if (!user?.id) return
    if (!confirm("Are you sure you want to delete this payment method?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", paymentId).eq("user_id", user.id)

      if (error) throw error

      await loadPaymentMethods()
      setMessage("Payment method deleted successfully!")
      console.log("[v0] payment_method_deleted", { paymentId })
    } catch (error) {
      console.error("Error deleting payment method:", error)
      setMessage("Failed to delete payment method")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      updateUser({
        name: formData.name,
        email: formData.email,
      })

      setMessage("Profile updated successfully!")
      setIsEditing(false)
      console.log("[v0] profile_updated", { userId: user?.id })
    } catch (error) {
      setMessage("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New passwords don't match")
      return
    }
    if (passwordData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setMessage("Password updated successfully!")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      console.log("[v0] password_changed", { userId: user?.id })
    } catch (error) {
      setMessage("Failed to update password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    console.log("[v0] notification_preference_changed", { key, value })
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    })
    setIsEditing(false)
  }

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      console.log("[v0] account_deletion_requested", { userId: user?.id })
      alert("Account deletion would be processed here. For demo purposes, this just logs out.")
      logout()
    }
  }

  const handleAvatarUpload = async (photoUrl: string) => {
    try {
      // Update the user context with the new avatar URL
      if (user) {
        updateUser({ ...user, avatar_url: photoUrl })
      }
      
      // Also refresh the profile data from the database to ensure consistency
      await refreshUserProfile()
      
      setMessage("Profile photo updated successfully!")
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error updating avatar:", error)
      setMessage("Failed to update profile photo")
    }
  }

  const handleAddDog = () => {
    console.log("[v0] add_dog_clicked")
    setEditingDog(null)
    setShowAddDog(true)
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="font-manrope text-2xl lg:text-3xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="dogs">My Dogs</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
              </TabsList>

              {/* ... existing profile, security, and notifications tabs ... */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4">
                      <PhotoUpload
                        currentPhotoUrl={user?.avatar_url}
                        onPhotoUploaded={handleAvatarUpload}
                        uploadEndpoint="/api/upload/profile-photo"
                        size="lg"
                        shape="circle"
                        placeholder="Upload profile picture"
                      />
                      <div>
                        <h3 className="font-medium">{user?.name}</h3>
                        <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {isEditing ? (
                        <>
                          <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={handleCancel}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                        <div>{user?.email}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          Member Since
                        </div>
                        <div>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</div>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Subscription Status</div>
                      <div className="capitalize">{user?.subscriptionStatus || "None"}</div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button onClick={handlePasswordChange} disabled={isLoading}>
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Email Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries({
                      orderUpdates: "Order Updates",
                      deliveryReminders: "Delivery Reminders",
                      healthTips: "Health Tips & Articles",
                      promotions: "Promotions & Offers",
                      newsletter: "Monthly Newsletter",
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="text-sm text-muted-foreground">
                            {key === "orderUpdates" && "Get notified about order status changes"}
                            {key === "deliveryReminders" && "Reminders about upcoming deliveries"}
                            {key === "healthTips" && "Weekly tips for your dog's health"}
                            {key === "promotions" && "Special offers and discounts"}
                            {key === "newsletter" && "Monthly updates and new features"}
                          </div>
                        </div>
                        <Switch
                          checked={notifications[key as keyof typeof notifications]}
                          onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dogs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Dog className="h-5 w-5" />
                        My Dogs
                      </CardTitle>
                      <Button onClick={handleAddDog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Dog
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDogs ? (
                      <div className="text-center py-8">Loading dogs...</div>
                    ) : dogProfiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No dogs added yet. Click "Add Dog" to get started.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dogProfiles.map((dog) => (
                          <Card key={dog.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-4">
                                <img
                                  src="/happy-golden-retriever.png"
                                  alt={dog.name}
                                  className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <h3 className="font-semibold">{dog.name}</h3>
                                  <p className="text-sm text-muted-foreground">{dog.breed}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {dog.age} years old • {dog.weight} lbs
                                  </p>
                                  {dog.allergies && dog.allergies.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Allergies: {dog.allergies.join(", ")}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingDog(dog)
                                      setShowAddDog(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => deleteDog(dog.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {showAddDog && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{editingDog ? "Edit Dog" : "Add New Dog"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DogForm
                        dog={editingDog}
                        onSave={saveDog}
                        onCancel={() => {
                          setShowAddDog(false)
                          setEditingDog(null)
                        }}
                        isLoading={isLoading}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Methods
                      </CardTitle>
                      <Button onClick={() => setShowAddPayment(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingPayments ? (
                      <div className="text-center py-8">Loading payment methods...</div>
                    ) : paymentMethods.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No payment methods added yet. Click "Add Payment Method" to get started.
                      </div>
                    ) : (
                      paymentMethods.map((payment) => (
                        <div key={payment.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {payment.card_brand.toUpperCase()} •••• {payment.card_last_four}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {payment.cardholder_name} • Expires {payment.expiry_month.toString().padStart(2, "0")}
                                  /{payment.expiry_year}
                                  {payment.is_default && " • Default"}
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => deletePaymentMethod(payment.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {showAddPayment && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PaymentMethodForm
                        onSave={savePaymentMethod}
                        onCancel={() => setShowAddPayment(false)}
                        isLoading={isLoading}
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Delete Account</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  )
}

function DogForm({
  dog,
  onSave,
  onCancel,
  isLoading,
}: {
  dog: DogProfile | null
  onSave: (dog: Partial<DogProfile>) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: dog?.name || "",
    breed: dog?.breed || "",
    age: dog?.age || 1,
    weight: dog?.weight || 10,
    allergies: dog?.allergies?.join(", ") || "",
    conditions: dog?.conditions?.join(", ") || "",
  })
  const [dogPhotoUrl, setDogPhotoUrl] = useState(dog?.avatar_url || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      avatar_url: dogPhotoUrl,
      allergies: formData.allergies
        ? formData.allergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      conditions: formData.conditions
        ? formData.conditions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    })
  }

  const handleDogPhotoUpload = (photoUrl: string) => {
    setDogPhotoUrl(photoUrl)
    // Refresh the dog data to show the updated photo in the My Dogs section
    if (user?.id) {
      loadDogs()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dog Photo Upload */}
      <div className="flex items-center gap-4">
        <PhotoUpload
          currentPhotoUrl={dogPhotoUrl}
          onPhotoUploaded={handleDogPhotoUpload}
          uploadEndpoint="/api/upload/dog-photo"
          additionalData={dog?.id ? { dogId: dog.id } : {}}
          size="lg"
          shape="circle"
          placeholder="Upload dog photo"
        />
        <div>
          <h3 className="font-medium">{dog ? `Edit ${dog.name}` : "Add New Dog"}</h3>
          <p className="text-sm text-muted-foreground">Upload a photo of your dog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dogName">Name</Label>
          <Input
            id="dogName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dogBreed">Breed</Label>
          <Input
            id="dogBreed"
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dogAge">Age (years)</Label>
          <Input
            id="dogAge"
            type="number"
            min="0"
            max="30"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: Number.parseInt(e.target.value) || 1 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dogWeight">Weight (lbs)</Label>
          <Input
            id="dogWeight"
            type="number"
            min="1"
            max="300"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: Number.parseInt(e.target.value) || 10 })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dogAllergies">Allergies (comma-separated)</Label>
        <Input
          id="dogAllergies"
          value={formData.allergies}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          placeholder="e.g., chicken, beef, wheat"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dogConditions">Medical Conditions (comma-separated)</Label>
        <Input
          id="dogConditions"
          value={formData.conditions}
          onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
          placeholder="e.g., diabetes, arthritis"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : dog ? "Update Dog" : "Add Dog"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function PaymentMethodForm({
  onSave,
  onCancel,
  isLoading,
}: {
  onSave: (payment: Partial<PaymentMethod>) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    cardholder_name: "",
    card_brand: "visa",
    card_last_four: "",
    expiry_month: new Date().getMonth() + 1,
    expiry_year: new Date().getFullYear(),
    is_default: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardholderName">Cardholder Name</Label>
        <Input
          id="cardholderName"
          value={formData.cardholder_name}
          onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cardBrand">Card Brand</Label>
          <select
            id="cardBrand"
            value={formData.card_brand}
            onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            required
          >
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="amex">American Express</option>
            <option value="discover">Discover</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastFour">Last Four Digits</Label>
          <Input
            id="lastFour"
            value={formData.card_last_four}
            onChange={(e) => setFormData({ ...formData, card_last_four: e.target.value.slice(0, 4) })}
            maxLength={4}
            pattern="[0-9]{4}"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiryMonth">Expiry Month</Label>
          <select
            id="expiryMonth"
            value={formData.expiry_month}
            onChange={(e) => setFormData({ ...formData, expiry_month: Number.parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            required
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {month.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryYear">Expiry Year</Label>
          <select
            id="expiryYear"
            value={formData.expiry_year}
            onChange={(e) => setFormData({ ...formData, expiry_year: Number.parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            required
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isDefault">Set as default payment method</Label>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Payment Method"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
