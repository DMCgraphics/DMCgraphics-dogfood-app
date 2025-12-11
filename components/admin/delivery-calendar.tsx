"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Package, Truck, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"

type DeliveryData = {
  total: number
  by_status: {
    driver_assigned: number
    preparing: number
    out_for_delivery: number
    delivered: number
  }
  by_driver: Array<{
    driver_id: string
    driver_name: string
    count: number
    color: string
  }>
  orders: any[]
}

export function DeliveryCalendar() {
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

      const response = await fetch(`/api/admin/deliveries/calendar?start=${start}&end=${end}`)
      const data = await response.json()

      if (response.ok) {
        setDeliveries(data)
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
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

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(month, 'MMMM yyyy')}
        </h3>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          <span>Driver Assigned / Preparing</span>
        </div>
        <div className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          <span>Out for Delivery</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Delivered</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
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
                      relative p-2 min-h-[80px] border rounded-lg text-left
                      hover:bg-accent transition-colors
                      ${isToday ? 'border-primary border-2' : 'border-border'}
                      ${dayData ? 'bg-blue-50 dark:bg-blue-950' : 'bg-background'}
                    `}
                  >
                    <div className="font-medium mb-1">{day}</div>
                    {dayData && (
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {dayData.total} {dayData.total === 1 ? 'delivery' : 'deliveries'}
                        </Badge>
                        {dayData.by_driver.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dayData.by_driver.slice(0, 2).map((driver) => (
                              <div
                                key={driver.driver_id}
                                className="text-xs px-1 py-0.5 rounded"
                                style={{
                                  backgroundColor: driver.color + '20',
                                  color: driver.color,
                                  borderLeft: `3px solid ${driver.color}`
                                }}
                              >
                                {driver.count}
                              </div>
                            ))}
                            {dayData.by_driver.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{dayData.by_driver.length - 2}
                              </div>
                            )}
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
                          {dayData.total} {dayData.total === 1 ? 'delivery' : 'deliveries'} scheduled
                        </p>
                      </div>

                      {/* Status Breakdown */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Status Breakdown:</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {dayData.by_status.driver_assigned > 0 && (
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-blue-600" />
                              <span>{dayData.by_status.driver_assigned} assigned</span>
                            </div>
                          )}
                          {dayData.by_status.preparing > 0 && (
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-purple-600" />
                              <span>{dayData.by_status.preparing} preparing</span>
                            </div>
                          )}
                          {dayData.by_status.out_for_delivery > 0 && (
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3 text-green-600" />
                              <span>{dayData.by_status.out_for_delivery} out</span>
                            </div>
                          )}
                          {dayData.by_status.delivered > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>{dayData.by_status.delivered} delivered</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Driver Assignments */}
                      {dayData.by_driver.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Drivers:</p>
                          <div className="space-y-1">
                            {dayData.by_driver.map((driver) => (
                              <div
                                key={driver.driver_id}
                                className="flex items-center justify-between text-sm p-2 rounded"
                                style={{
                                  backgroundColor: driver.color + '10',
                                  borderLeft: `3px solid ${driver.color}`
                                }}
                              >
                                <span>{driver.driver_name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {driver.count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
    </div>
  )
}
