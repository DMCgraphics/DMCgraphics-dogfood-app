"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface WeightEntry {
  date: string
  weight: number
  notes?: string
}

interface WeightTrackerProps {
  dogName: string
  currentWeight: number
  weightUnit: "lb" | "kg"
  entries: WeightEntry[]
  onAddEntry: (entry: Omit<WeightEntry, "date">) => void
}

export function WeightTracker({ dogName, currentWeight, weightUnit, entries, onAddEntry }: WeightTrackerProps) {
  const [newWeight, setNewWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddWeight = () => {
    if (newWeight) {
      onAddEntry({
        weight: Number.parseFloat(newWeight),
        notes: notes || undefined,
      })
      setNewWeight("")
      setNotes("")
      setIsDialogOpen(false)
    }
  }

  // Calculate trend
  const getTrend = () => {
    if (entries.length < 2) return null
    const recent = entries.slice(-2)
    const change = recent[1].weight - recent[0].weight
    return {
      direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
      amount: Math.abs(change),
    }
  }

  const trend = getTrend()

  // Format data for chart
  const chartData = entries.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: entry.weight,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Weight Tracker
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                {trend.direction === "up" && <TrendingUp className="h-4 w-4 text-orange-500" />}
                {trend.direction === "down" && <TrendingDown className="h-4 w-4 text-primary" />}
                {trend.direction === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                <span className="text-muted-foreground">
                  {trend.direction === "stable" ? "Stable" : `${trend.amount.toFixed(1)} ${weightUnit}`}
                </span>
              </div>
            )}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Weight
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log {dogName}'s Weight</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight ({weightUnit})</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder={`Enter weight in ${weightUnit}`}
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any observations about your dog's condition..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddWeight} className="w-full">
                  Add Weight Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold">
            {currentWeight} {weightUnit}
          </div>
          <div className="text-sm text-muted-foreground">Current weight</div>
        </div>

        {chartData.length > 1 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent entries:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {entries
                .slice(-3)
                .reverse()
                .map((entry, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{new Date(entry.date).toLocaleDateString()}</span>
                    <span>
                      {entry.weight} {weightUnit}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
