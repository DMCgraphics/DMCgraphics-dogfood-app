"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  runAITests,
  testLLMService,
  quickTest,
  testProfileWeightLoss,
  testProfileMinimal,
  testProfileExtreme,
  testProfilePuppy,
} from "@/lib/ai/test-ai-system"
import { generateAIMealRecommendations } from "@/lib/ai-meal-recommendations"
import { calculateConfidence } from "@/lib/ai/confidence-calculator"
import type { AIRecommendation } from "@/lib/multi-dog-types"

export default function TestAIPage() {
  const [results, setResults] = useState<AIRecommendation | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTest = async (profile: any, name: string) => {
    setLoading(true)
    console.clear()
    console.log(`\n🧪 Testing with ${name}\n`)

    const recommendations = generateAIMealRecommendations([profile])
    const rec = recommendations[0]

    console.log("Full recommendation object:", rec)
    setResults(rec)
    setLoading(false)
  }

  const handleRunAllTests = () => {
    console.clear()
    runAITests()
    alert("✅ Check the browser console for full test results!")
  }

  const handleTestLLM = async () => {
    console.clear()
    await testLLMService()
    alert("✅ Check the browser console for LLM test results!")
  }

  const confidenceResult = results ? calculateConfidence(results.confidence) : null

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🧪 AI System Test Lab</h1>
          <p className="text-muted-foreground">
            Test the enhanced AI meal recommendation system with different profiles
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Individual Profile Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => handleTest(testProfileWeightLoss, "Max (Weight Loss)")}
                disabled={loading}
                className="w-full"
              >
                Test: Complete Profile with Weight Loss
              </Button>
              <Button
                onClick={() => handleTest(testProfileMinimal, "Bella (Minimal Data)")}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test: Minimal Profile (Missing Data)
              </Button>
              <Button
                onClick={() => handleTest(testProfileExtreme, "Rocky (Extreme Change)")}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test: Extreme Weight Change (Edge Cases)
              </Button>
              <Button
                onClick={() => handleTest(testProfilePuppy, "Luna (Puppy Growth)")}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Test: Puppy Growth Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleRunAllTests} variant="secondary" className="w-full">
                Run All Tests (Console)
              </Button>
              <Button onClick={handleTestLLM} variant="secondary" className="w-full">
                Test LLM Service (Console)
              </Button>
              <Button
                onClick={() => {
                  console.clear()
                  quickTest()
                }}
                variant="secondary"
                className="w-full"
              >
                Quick Test (Console)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Display */}
        {results && confidenceResult && (
          <div className="space-y-6">
            {/* Confidence Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recommendation for {results.dogName}</span>
                  <Badge className={confidenceResult.bgColor + " " + confidenceResult.textColor}>
                    {confidenceResult.emoji} {results.confidence}% {confidenceResult.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Confidence Level</span>
                      <span className="text-muted-foreground">{results.confidence}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          confidenceResult.level === "very-high"
                            ? "bg-emerald-500"
                            : confidenceResult.level === "high"
                              ? "bg-blue-500"
                              : confidenceResult.level === "moderate"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                        }`}
                        style={{ width: `${results.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <h4 className="font-medium mb-2">Reasoning</h4>
                    <p className="text-sm text-muted-foreground">{results.reasoning}</p>
                  </div>

                  {/* Recommended Recipes */}
                  <div>
                    <h4 className="font-medium mb-2">Recommended Recipes</h4>
                    <div className="flex gap-2">
                      {results.recommendedRecipes.map((recipeId) => (
                        <Badge key={recipeId} variant="secondary">
                          {recipeId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Nutritional Focus */}
                  <div>
                    <h4 className="font-medium mb-2">Nutritional Focus</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.nutritionalFocus.map((focus) => (
                        <Badge key={focus} variant="outline">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Confidence Breakdown */}
            {results.confidenceBreakdown && (
              <Card>
                <CardHeader>
                  <CardTitle>Confidence Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Base Score:</span>
                      <span className="font-medium">{results.confidenceBreakdown.baseScore}</span>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Top Adjustments</h4>
                      <div className="space-y-3">
                        {results.confidenceBreakdown.adjustments.map((adj, i) => (
                          <div key={i} className="border-l-2 border-primary pl-3">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm">{adj.factor}</span>
                              <Badge
                                variant={
                                  adj.impact === "high"
                                    ? "default"
                                    : adj.impact === "medium"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="ml-2"
                              >
                                +{adj.points}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{adj.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between text-sm pt-3 border-t">
                      <span className="font-semibold">Total Score:</span>
                      <span className="font-semibold">{results.confidenceBreakdown.totalScore}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Factors Considered */}
            <Card>
              <CardHeader>
                <CardTitle>All Factors Considered ({results.factorsConsidered.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {results.factorsConsidered.map((factor, i) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{factor.factor}</span>
                        <Badge variant="outline" className="ml-2">
                          +{factor.points}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {factor.category}
                        </Badge>
                        <Badge
                          variant={
                            factor.impact === "high"
                              ? "default"
                              : factor.impact === "medium"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {factor.impact}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Missing Data */}
            {results.missingData && results.missingData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-600">Missing Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.missingData.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600">⚠️</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Edge Cases */}
            {results.edgeCases && results.edgeCases.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Edge Cases Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.edgeCases.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-600">🚨</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Alternative Recommendations */}
            {results.alternativeRecommendations && results.alternativeRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alternative Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.alternativeRecommendations.map((alt, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{alt.recipeName}</span>
                          <Badge variant="outline">{alt.confidence}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alt.reasoning}</p>
                        <p className="text-xs text-muted-foreground">
                          Difference from top: {alt.differenceFromTop}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!results && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Select a test profile above to see detailed AI recommendation results
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
