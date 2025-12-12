"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { HealthGoals, DogProfile } from "@/lib/nutrition-calculator"
import { WeightGoalHelper } from "./ai-inline-helper"
import { AILiveFeedback } from "./ai-live-feedback"

interface Step2Props {
  goals: Partial<HealthGoals>
  onUpdate: (updates: Partial<HealthGoals>) => void
  dogProfile?: Partial<DogProfile>
}

export function Step2HealthGoals({ goals, onUpdate, dogProfile }: Step2Props) {
  const getSuggestedTargetWeights = (goalType: "lose" | "gain" | "maintain") => {
    if (!dogProfile?.weight) return []

    const currentWeight = dogProfile.weight
    const weightUnit = dogProfile.weightUnit || "lb"

    if (goalType === "maintain") {
      return [
        {
          weight: currentWeight,
          label: `Maintain ${currentWeight} ${weightUnit}`,
          description: "Keep current weight",
        },
      ]
    }

    if (goalType === "lose") {
      // Suggest 5%, 10%, and 15% weight loss options
      const option1 = Math.round(currentWeight * 0.95 * 10) / 10
      const option2 = Math.round(currentWeight * 0.9 * 10) / 10
      const option3 = Math.round(currentWeight * 0.85 * 10) / 10

      return [
        {
          weight: option1,
          label: `Lose to ${option1} ${weightUnit}`,
          description: "Gradual weight loss (5%)",
        },
        {
          weight: option2,
          label: `Lose to ${option2} ${weightUnit}`,
          description: "Moderate weight loss (10%)",
        },
        {
          weight: option3,
          label: `Lose to ${option3} ${weightUnit}`,
          description: "Significant weight loss (15%)",
        },
      ]
    }

    if (goalType === "gain") {
      // Suggest 5%, 10%, and 15% weight gain options
      const option1 = Math.round(currentWeight * 1.05 * 10) / 10
      const option2 = Math.round(currentWeight * 1.1 * 10) / 10
      const option3 = Math.round(currentWeight * 1.15 * 10) / 10

      return [
        {
          weight: option1,
          label: `Gain to ${option1} ${weightUnit}`,
          description: "Gradual weight gain (5%)",
        },
        {
          weight: option2,
          label: `Gain to ${option2} ${weightUnit}`,
          description: "Moderate weight gain (10%)",
        },
        {
          weight: option3,
          label: `Gain to ${option3} ${weightUnit}`,
          description: "Significant weight gain (15%)",
        },
      ]
    }

    return []
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Health & Wellness Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {dogProfile?.weight && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{dogProfile.name}'s Current Stats</h4>
                  <p className="text-sm text-muted-foreground">
                    Weight: {dogProfile.weight} {dogProfile.weightUnit || "lb"} • Body Condition:{" "}
                    {dogProfile.bodyCondition || 5}/9
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Target Weight Input when Weight Management is selected */}
          {goals.weightManagement && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <Label className="text-base font-semibold">Target Weight Goal</Label>

              <div className="space-y-2">
                <Label htmlFor="weight-goal" className="text-sm">
                  Goal Type
                </Label>
                <select
                  id="weight-goal"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  value={goals.weightGoal || ""}
                  onChange={(e) => onUpdate({ weightGoal: e.target.value as "lose" | "gain" | "maintain" })}
                >
                  <option value="">Select a goal type</option>
                  <option value="lose">Lose Weight</option>
                  <option value="gain">Gain Weight</option>
                  <option value="maintain">Maintain Weight</option>
                </select>
              </div>

              {goals.weightGoal && dogProfile?.weight && (
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Quick suggestions based on {dogProfile?.name}'s current stats:
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {getSuggestedTargetWeights(goals.weightGoal).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onUpdate({
                            targetWeight: suggestion.weight,
                          })
                        }
                        className="text-left justify-start"
                      >
                        <div>
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="target-weight" className="text-sm">
                  Target Weight
                </Label>
                <Input
                  id="target-weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter target weight"
                  value={goals.targetWeight || ""}
                  onChange={(e) =>
                    onUpdate({ targetWeight: e.target.value ? Number.parseFloat(e.target.value) : undefined })
                  }
                />
              </div>

              {/* AI Weight Goal Helper */}
              {goals.targetWeight && dogProfile?.weight && dogProfile?.name && goals.weightGoal && (
                <WeightGoalHelper
                  dogName={dogProfile.name}
                  currentWeight={dogProfile.weight}
                  targetWeight={goals.targetWeight}
                  weightUnit={dogProfile.weightUnit || "lb"}
                  goal={goals.weightGoal}
                />
              )}

              <p className="text-xs text-muted-foreground">
                We'll track progress toward this goal in your dashboard and adjust portions accordingly.
              </p>
            </div>
          )}

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
                    Weight Management - We'll optimize portions and suggest{" "}
                    {goals.weightGoal === "lose"
                      ? "low-calorie"
                      : goals.weightGoal === "gain"
                        ? "high-calorie"
                        : "balanced"}{" "}
                    recipes
                    {goals.targetWeight && (
                      <span className="font-medium">
                        {" "}
                        (Target: {goals.targetWeight} {dogProfile?.weightUnit || "lbs"})
                      </span>
                    )}
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
