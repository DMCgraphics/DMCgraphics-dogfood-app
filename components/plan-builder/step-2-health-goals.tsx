"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import type { HealthGoals } from "@/lib/nutrition-calculator"

interface Step2Props {
  goals: Partial<HealthGoals>
  onUpdate: (updates: Partial<HealthGoals>) => void
}

export function Step2HealthGoals({ goals, onUpdate }: Step2Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Health & Wellness Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Health Goals Checkboxes */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">What areas would you like to focus on?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weight"
                  checked={goals.weightManagement || false}
                  onCheckedChange={(checked) => onUpdate({ weightManagement: !!checked })}
                />
                <Label htmlFor="weight" className="text-sm font-normal">
                  Weight Management
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skin-coat"
                  checked={goals.skinCoat || false}
                  onCheckedChange={(checked) => onUpdate({ skinCoat: !!checked })}
                />
                <Label htmlFor="skin-coat" className="text-sm font-normal">
                  Skin & Coat Health
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="joints"
                  checked={goals.joints || false}
                  onCheckedChange={(checked) => onUpdate({ joints: !!checked })}
                />
                <Label htmlFor="joints" className="text-sm font-normal">
                  Joint Support
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="digestive"
                  checked={goals.digestiveHealth || false}
                  onCheckedChange={(checked) => onUpdate({ digestiveHealth: !!checked })}
                />
                <Label htmlFor="digestive" className="text-sm font-normal">
                  Digestive Health
                </Label>
              </div>
            </div>
          </div>

          {/* Stool Score */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Current Stool Quality (1-7 scale)</Label>
            <div className="space-y-2">
              <Slider
                value={[goals.stoolScore || 4]}
                onValueChange={([value]) => onUpdate({ stoolScore: value })}
                max={7}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 - Very Hard</span>
                <span>4 - Ideal</span>
                <span>7 - Very Loose</span>
              </div>
              <div className="text-center text-sm">
                Current: <span className="font-semibold">{goals.stoolScore || 4}</span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Additional Health Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any specific health concerns, medications, or other details your vet should know about..."
              value={goals.notes || ""}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Health Goals Summary */}
      {(goals.weightManagement || goals.skinCoat || goals.joints || goals.digestiveHealth) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selected Focus Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {goals.weightManagement && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm">
                    Weight Management - We'll optimize portions and suggest low-calorie recipes
                  </span>
                </div>
              )}
              {goals.skinCoat && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm">
                    Skin & Coat - We'll recommend omega-3 rich recipes and fish oil supplements
                  </span>
                </div>
              )}
              {goals.joints && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm">
                    Joint Support - We'll suggest glucosamine supplements and anti-inflammatory ingredients
                  </span>
                </div>
              )}
              {goals.digestiveHealth && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm">
                    Digestive Health - We'll recommend probiotics and easily digestible recipes
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
