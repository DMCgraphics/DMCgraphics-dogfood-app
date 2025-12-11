"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Package, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"

type DeliveryData = {
  total: number
  completed: number
  pending: number
  orders: any[]
}

export function DriverCalendar() {
  const [month, setMonth] = useState(new Date())
  const [deliveries, setDeliveries] = useState<Record<string, DeliveryData>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDeliveries()
  }, [month])

  const fetchDeliveries = async () => {
    setIsLoading(true)
    try {
      const start = format(startOfMonth(month), 'yyyy-MM-dd')
      const end = format(endOfMonth(month), 'yyyy-MM-dd')

      const response = await fetch(`/api/deliveries/driver/calendar?start=${start}&end=${end}`)
      const data = await response.json()

      if (response.ok) {
        setDeliveries(data)
      }
    } catch (error) {
      console.error('Error fetching driver calendar data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviousMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setMonth(new Date())
  }

  // Calculate monthly summary
  const monthlySummary = Object.values(deliveries).reduce(
    (acc, day) => ({
      total: acc.total + day.total,
      completed: acc.completed + day.completed,
      pending: acc.pending + day.pending,
    }),
    { total: 0, completed: 0, pending: 0 }
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Delivery Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{monthlySummary.total}</div>
            <div className="text-xs text-muted-foreground">Total Deliveries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{monthlySummary.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{monthlySummary.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Month Title */}
        <h3 className="text-lg font-semibold text-center">
          {format(month, 'MMMM yyyy')}
        </h3>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {(() => {
            const firstDay = startOfMonth(month)
            const lastDay = endOfMonth(month)
            const daysInMonth = lastDay.getDate()
            const startDayOfWeek = firstDay.getDay()

            const days = []

            // Empty cells before month starts
            for (let i = 0; i < startDayOfWeek; i++) {
              days.push(<div key={`empty-${i}`} className="p-2" />)
            }

            // Days of the month
            for (let day = 1; day <= daysInMonth; day++) {
              const date = new Date(month.getFullYear(), month.getMonth(), day)
              const dateStr = format(date, 'yyyy-MM-dd')
              const dayData = deliveries[dateStr]
              const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr

              days.push(
                <Popover key={day}>
                  <PopoverTrigger asChild>
                    <button
                      className={`
                        relative p-2 min-h-[60px] border rounded-lg text-left
                        hover:bg-accent transition-colors
                        ${isToday ? 'border-primary border-2' : 'border-border'}
                        ${dayData ? 'bg-blue-50 dark:bg-blue-950' : 'bg-background'}
                      `}
                    >
                      <div className="font-medium mb-1 text-sm">{day}</div>
                      {dayData && (
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {dayData.total}
                          </Badge>
                          {dayData.completed > 0 && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              <span>{dayData.completed}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  </PopoverTrigger>
                  {dayData && (
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold">
                            {format(date, 'EEEE, MMMM d, yyyy')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {dayData.total} {dayData.total === 1 ? 'delivery' : 'deliveries'}
                          </p>
                        </div>

                        {/* Status Summary */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                            <div className="text-lg font-bold text-green-600">{dayData.completed}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                            <div className="text-lg font-bold text-blue-600">{dayData.pending}</div>
                            <div className="text-xs text-muted-foreground">Pending</div>
                          </div>
                        </div>

                        {/* Order List */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Orders:</p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {dayData.orders.map((order, idx) => (
                              <div
                                key={order.id}
                                className="text-xs p-2 rounded border"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    Stop #{order.route_position || idx + 1}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {order.fulfillment_status}
                                  </Badge>
                                </div>
                                <div className="text-muted-foreground mt-1">
                                  {order.order_number}
                                </div>
                                {order.delivery_zipcode && (
                                  <div className="text-muted-foreground">
                                    ZIP: {order.delivery_zipcode}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              )
            }

            return days
          })()}
        </div>

        {isLoading && (
          <div className="text-center text-sm text-muted-foreground py-4">
            Loading calendar data...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
