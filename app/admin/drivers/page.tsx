"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserCircle, Plus, Edit, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"

type Driver = {
  id: string
  name: string
  phone?: string
  email?: string
  home_zipcode: string
  home_address?: string
  is_active: boolean
  created_at: string
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    home_zipcode: '',
    home_address: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name')

      if (error) throw error

      if (data) setDrivers(data)
      console.log('[DRIVERS] Fetched drivers:', data?.length || 0)
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  const openAddDialog = () => {
    setEditingDriver(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      home_zipcode: '',
      home_address: ''
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (driver: Driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      phone: driver.phone || '',
      email: driver.email || '',
      home_zipcode: driver.home_zipcode,
      home_address: driver.home_address || ''
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.home_zipcode) {
        toast({
          title: "Validation error",
          description: "Name and home zipcode are required",
          variant: "destructive"
        })
        return
      }

      if (editingDriver) {
        // Update existing driver
        const { error } = await supabase
          .from('drivers')
          .update({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            home_zipcode: formData.home_zipcode,
            home_address: formData.home_address || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDriver.id)

        if (error) throw error

        toast({
          title: "Driver updated",
          description: `${formData.name} has been updated`
        })
      } else {
        // Create new driver
        const { error } = await supabase
          .from('drivers')
          .insert({
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            home_zipcode: formData.home_zipcode,
            home_address: formData.home_address || null,
            is_active: true
          })

        if (error) throw error

        toast({
          title: "Driver added",
          description: `${formData.name} has been added`
        })
      }

      setIsDialogOpen(false)
      fetchDrivers()
    } catch (error) {
      console.error('Error saving driver:', error)
      toast({
        title: "Error",
        description: "Failed to save driver",
        variant: "destructive"
      })
    }
  }

  const toggleActive = async (driver: Driver) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          is_active: !driver.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.id)

      if (error) throw error

      toast({
        title: driver.is_active ? "Driver deactivated" : "Driver activated",
        description: `${driver.name} is now ${driver.is_active ? 'inactive' : 'active'}`
      })
      fetchDrivers()
    } catch (error) {
      console.error('Error toggling driver status:', error)
      toast({
        title: "Error",
        description: "Failed to update driver status",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Drivers</h1>
          <p className="text-muted-foreground">Manage delivery drivers and their locations</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading drivers...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map(driver => (
            <Card key={driver.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    <CardTitle className="text-lg">{driver.name}</CardTitle>
                  </div>
                  <Badge variant={driver.is_active ? "default" : "secondary"}>
                    {driver.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Home Zipcode:</strong> {driver.home_zipcode}
                  </div>
                  {driver.home_address && (
                    <div>
                      <strong>Address:</strong> {driver.home_address}
                    </div>
                  )}
                  {driver.phone && (
                    <div>
                      <strong>Phone:</strong> {driver.phone}
                    </div>
                  )}
                  {driver.email && (
                    <div>
                      <strong>Email:</strong> {driver.email}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(driver)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={driver.is_active ? "destructive" : "default"}
                    onClick={() => toggleActive(driver)}
                    className="flex-1"
                  >
                    {driver.is_active ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {drivers.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No drivers found. Add your first driver to get started.
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
            <DialogDescription>
              Enter the driver's information and home location for route optimization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="home_zipcode">Home Zipcode *</Label>
              <Input
                id="home_zipcode"
                value={formData.home_zipcode}
                onChange={(e) => setFormData({ ...formData, home_zipcode: e.target.value })}
                placeholder="06902"
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="home_address">Home Address</Label>
              <Input
                id="home_address"
                value={formData.home_address}
                onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                placeholder="123 Main St, Stamford, CT"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(203) 555-1234"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="driver@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingDriver ? 'Update' : 'Add'} Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
