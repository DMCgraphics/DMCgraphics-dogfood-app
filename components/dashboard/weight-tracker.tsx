"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, TrendingUp, TrendingDown, Minus, Target } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
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
  targetWeight?: number
  weightGoal?: "lose" | "gain" | "maintain"
  weightUnit: "lb" | "kg"
  entries: WeightEntry[]
  onAddEntry: (entry: Omit<WeightEntry, "date">) => void
}

export function WeightTracker({
  dogName,
  currentWeight,
  targetWeight,
  weightGoal,
  weightUnit,
  entries,
  onAddEntry,
}: WeightTrackerProps) {
  const [newWeight, setNewWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddWeight = async () => {
    if (newWeight) {
      const entry = {
        weight: Number.parseFloat(newWeight),
        notes: notes || undefined,
      }

      onAddEntry(entry)

      setNewWeight("")
      setNotes("")
      setIsDialogOpen(false)
    }
  }

  // Calculate trend
  const getTrend = () => {
    if (entries.length < 2) return null

    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const recent = sortedEntries.slice(-2)

    const olderEntry = recent[0]
    const newerEntry = recent[1]
    const change = newerEntry.weight - olderEntry.weight

    return {
      direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
      amount: Math.abs(change),
    }
  }

  const getTargetProgress = () => {
    if (!targetWeight) return null

    const difference = currentWeight - targetWeight
    const isOnTrack = Math.abs(difference) <= 1 // Within 1 unit of target

    return {
      difference: Math.abs(difference),
      isOnTrack,
      direction: difference > 0 ? "above" : difference < 0 ? "below" : "at",
      progressPercentage: targetWeight
        ? Math.max(0, Math.min(100, ((targetWeight - Math.abs(difference)) / targetWeight) * 100))
        : 0,
    }
  }

  const trend = getTrend()
  const targetProgress = getTargetProgress()

  // Format data for chart
  const chartData = entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((entry) => ({
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {currentWeight} {weightUnit}
            </div>
            <div className="text-sm text-muted-foreground">Current weight</div>
          </div>

          {targetWeight && (
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {targetWeight} {weightUnit}
              </div>
              <div className="text-sm text-muted-foreground">Target weight</div>
              {targetProgress && (
                <div className="mt-2">
                  <div
                    className={`text-xs font-medium ${targetProgress.isOnTrack ? "text-green-600" : "text-orange-600"}`}
                  >
                    {targetProgress.isOnTrack
                      ? "On track!"
                      : `${targetProgress.difference.toFixed(1)} ${weightUnit} ${targetProgress.direction} target`}
                  </div>
                </div>
              )}
            </div>
          )}
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
                {targetWeight && (
                  <ReferenceLine
                    y={targetWeight}
                    stroke="hsl(var(--destructive))"
                    strokeDasharray="5 5"
                    label={{ value: "Target", position: "topRight" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent entries:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {entries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
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
