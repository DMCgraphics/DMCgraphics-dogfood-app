"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface StoolEntry {
  date: string
  score: number
  notes?: string
}

interface StoolLogProps {
  dogName: string
  entries: StoolEntry[]
  onAddEntry: (entry: Omit<StoolEntry, "date">) => void
  isLoading?: boolean
}

const stoolScores = [
  { score: 1, label: "Very Hard", description: "Dry, crumbly pellets", color: "bg-red-500" },
  { score: 2, label: "Hard", description: "Firm, dry, difficult to pick up", color: "bg-orange-500" },
  { score: 3, label: "Slightly Hard", description: "Firm but not hard", color: "bg-yellow-500" },
  { score: 4, label: "Ideal", description: "Soft, formed, easy to pick up", color: "bg-primary" },
  { score: 5, label: "Slightly Soft", description: "Soft, loses form on ground", color: "bg-yellow-500" },
  { score: 6, label: "Loose", description: "Mushy, no defined shape", color: "bg-orange-500" },
  { score: 7, label: "Very Loose", description: "Liquid, no form", color: "bg-red-500" },
]

export function StoolLog({ dogName, entries, onAddEntry, isLoading = false }: StoolLogProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleAddEntry = () => {
    if (selectedScore !== null) {
      onAddEntry({
        score: selectedScore,
        notes: notes || undefined,
      })
      setSelectedScore(null)
      setNotes("")
      setIsDialogOpen(false)
    }
  }

  const getScoreInfo = (score: number) => {
    return stoolScores.find((s) => s.score === score) || stoolScores[3]
  }

  const getAverageScore = () => {
    if (entries.length === 0) return null
    const recentEntries = entries.slice(-7) // Last 7 entries
    const average = recentEntries.reduce((sum, entry) => sum + entry.score, 0) / recentEntries.length
    return average
  }

  const averageScore = getAverageScore()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stool Quality Log</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log {dogName}'s Stool Quality</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Select stool score (1-7 scale):</div>
                  <div className="grid grid-cols-1 gap-2">
                    {stoolScores.map((stool) => (
                      <Button
                        key={stool.score}
                        variant={selectedScore === stool.score ? "default" : "outline"}
                        onClick={() => setSelectedScore(stool.score)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-3 h-3 rounded-full ${stool.color}`}></div>
                          <div className="text-left">
                            <div className="font-medium">
                              {stool.score}. {stool.label}
                            </div>
                            <div className="text-xs text-muted-foreground">{stool.description}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    className="w-full p-2 border rounded-md text-sm"
                    rows={2}
                    placeholder="Any additional observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddEntry} disabled={selectedScore === null || isLoading} className="w-full">
                  {isLoading ? "Saving..." : "Add Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {averageScore && (
          <div className="text-center">
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">7-day average</div>
            <Badge
              variant="outline"
              className={`mt-2 ${averageScore >= 3.5 && averageScore <= 4.5 ? "border-primary text-primary" : "border-orange-500 text-orange-500"}`}
            >
              {averageScore >= 3.5 && averageScore <= 4.5 ? "Healthy Range" : "Monitor Closely"}
            </Badge>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent entries:</div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {entries
                .slice(0, 5)
                .map((entry, index) => {
                  const scoreInfo = getScoreInfo(entry.score)
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${scoreInfo.color}`}></div>
                        <div>
                          <div className="text-sm font-medium">
                            Score {entry.score} - {scoreInfo.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No entries yet</div>
            <div className="text-xs">Start tracking to monitor digestive health</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
