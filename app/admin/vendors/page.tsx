"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Store, Loader2, Plus, Phone, Mail } from "lucide-react"
import Link from "next/link"

interface Vendor {
  id: string
  name: string
  contact_name: string | null
  contact_email: string
  contact_phone: string | null
  lead_time_days: number
  minimum_order_lbs: number
  is_active: boolean
  notes: string | null
}

interface VendorProduct {
  id: string
  ingredient_name: string
  unit_price_per_lb: number | null
  notes: string | null
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    if (selectedVendor) {
      fetchProducts(selectedVendor.id)
    }
  }, [selectedVendor])

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name")

      if (error) throw error
      setVendors(data || [])

      // Auto-select first vendor if exists
      if (data && data.length > 0 && !selectedVendor) {
        setSelectedVendor(data[0])
      }
    } catch (error: any) {
      console.error("Error fetching vendors:", error)
      toast.error("Failed to load vendors")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async (vendorId: string) => {
    setLoadingProducts(true)
    try {
      const { data, error } = await supabase
        .from("vendor_products")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("ingredient_name")

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error("Error fetching products:", error)
      toast.error("Failed to load vendor products")
    } finally {
      setLoadingProducts(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground">Manage protein suppliers and pricing</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/purchase-orders">
            <Button variant="outline">View Purchase Orders</Button>
          </Link>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Vendors List */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No vendors configured</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vendors.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedVendor?.id === vendor.id
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/50 border-transparent hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{vendor.name}</div>
                      {vendor.is_active ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {vendor.contact_email && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {vendor.contact_email}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Details & Products */}
        <div className="lg:col-span-2 space-y-6">
          {selectedVendor ? (
            <>
              {/* Vendor Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Name</div>
                      <div className="text-lg font-semibold">{selectedVendor.name}</div>
                    </div>

                    {selectedVendor.contact_name && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Contact Name</div>
                        <div>{selectedVendor.contact_name}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Email</div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedVendor.contact_email}`} className="text-primary hover:underline">
                          {selectedVendor.contact_email}
                        </a>
                      </div>
                    </div>

                    {selectedVendor.contact_phone && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Phone</div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${selectedVendor.contact_phone}`} className="text-primary hover:underline">
                            {selectedVendor.contact_phone}
                          </a>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Lead Time</div>
                      <div>{selectedVendor.lead_time_days} days</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Minimum Order</div>
                      <div>{selectedVendor.minimum_order_lbs} lbs</div>
                    </div>
                  </div>

                  {selectedVendor.notes && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                      <div className="text-sm bg-muted/50 p-3 rounded-md">{selectedVendor.notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vendor Products */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Products</CardTitle>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Plus className="h-3 w-3" />
                      Add Product
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No products configured for this vendor</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ingredient</TableHead>
                          <TableHead>Price/lb</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.ingredient_name}</TableCell>
                            <TableCell>
                              {product.unit_price_per_lb
                                ? `$${product.unit_price_per_lb.toFixed(2)}`
                                : <span className="text-muted-foreground">Not set</span>
                              }
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {product.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a vendor to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
