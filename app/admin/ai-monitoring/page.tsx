"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react"

interface CostStats {
  daily: {
    cost: number
    requests: number
    tokens: number
    cacheHitRate: number
  }
  monthly: {
    cost: number
  }
}

export default function AIMonitoringPage() {
  const [stats, setStats] = useState<CostStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Budget configuration from env
  const dailyBudget = parseFloat(process.env.NEXT_PUBLIC_AI_DAILY_BUDGET || "5.00")
  const monthlyBudget = parseFloat(process.env.NEXT_PUBLIC_AI_MONTHLY_BUDGET || "100.00")

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ai/track-cost")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch AI stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()

    // Auto-refresh every minute
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const getBudgetStatus = (cost: number, limit: number) => {
    const percentage = (cost / limit) * 100
    if (percentage >= 100) return { status: "exceeded", color: "text-red-600", bgColor: "bg-red-50", icon: XCircle }
    if (percentage >= 95) return { status: "critical", color: "text-orange-600", bgColor: "bg-orange-50", icon: AlertCircle }
    if (percentage >= 80) return { status: "warning", color: "text-yellow-600", bgColor: "bg-yellow-50", icon: AlertTriangle }
    return { status: "normal", color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle2 }
  }

  const dailyStatus = stats ? getBudgetStatus(stats.daily.cost, dailyBudget) : null
  const monthlyStatus = stats ? getBudgetStatus(stats.monthly.cost, monthlyBudget) : null

  const dailyPercentage = stats ? (stats.daily.cost / dailyBudget) * 100 : 0
  const monthlyPercentage = stats ? (stats.monthly.cost / monthlyBudget) * 100 : 0

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Cost Monitoring</h1>
          <p className="text-muted-foreground">Track LLM usage, costs, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={fetchStats} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Daily Budget */}
        <Card className={dailyStatus?.bgColor}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Daily Budget
              </span>
              {dailyStatus && <dailyStatus.icon className={`h-5 w-5 ${dailyStatus.color}`} />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-3xl font-bold">${stats.daily.cost.toFixed(2)}</div>
                  <div className="text-muted-foreground">/ ${dailyBudget.toFixed(2)}</div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{dailyPercentage.toFixed(1)}% used</span>
                    <Badge variant={dailyPercentage >= 80 ? "destructive" : "secondary"}>
                      {dailyStatus?.status}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        dailyPercentage >= 100 ? "bg-red-600" :
                        dailyPercentage >= 95 ? "bg-orange-500" :
                        dailyPercentage >= 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Requests</div>
                    <div className="font-semibold">{stats.daily.requests.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Tokens</div>
                    <div className="font-semibold">{stats.daily.tokens.toLocaleString()}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Budget */}
        <Card className={monthlyStatus?.bgColor}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Budget
              </span>
              {monthlyStatus && <monthlyStatus.icon className={`h-5 w-5 ${monthlyStatus.color}`} />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-3xl font-bold">${stats.monthly.cost.toFixed(2)}</div>
                  <div className="text-muted-foreground">/ ${monthlyBudget.toFixed(2)}</div>
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{monthlyPercentage.toFixed(1)}% used</span>
                    <Badge variant={monthlyPercentage >= 80 ? "destructive" : "secondary"}>
                      {monthlyStatus?.status}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        monthlyPercentage >= 100 ? "bg-red-600" :
                        monthlyPercentage >= 95 ? "bg-orange-500" :
                        monthlyPercentage >= 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Projected month-end: ${((stats.monthly.cost / new Date().getDate()) * 30).toFixed(2)}
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <>
                <div className="text-3xl font-bold mb-2">
                  {stats.daily.cacheHitRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: 70%+
                </div>
                <Badge variant={stats.daily.cacheHitRate >= 70 ? "default" : "secondary"} className="mt-2">
                  {stats.daily.cacheHitRate >= 70 ? "On Target" : "Below Target"}
                </Badge>
              </>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Avg Cost / Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.daily.requests > 0 ? (
              <>
                <div className="text-3xl font-bold mb-2">
                  ${(stats.daily.cost / stats.daily.requests).toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Per API call
                </div>
              </>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">No requests today</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Cost Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.daily.cacheHitRate > 0 ? (
              <>
                <div className="text-3xl font-bold mb-2 text-green-600">
                  {((stats.daily.cacheHitRate / 100) * stats.daily.cost).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Saved via caching today
                </div>
              </>
            ) : (
              <div className="h-20 flex items-center justify-center">
                <div className="text-muted-foreground text-sm">No cache data</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-2">Alert Settings</div>
              <div className="space-y-1 text-muted-foreground">
                <div>Daily Budget: ${dailyBudget.toFixed(2)}</div>
                <div>Monthly Budget: ${monthlyBudget.toFixed(2)}</div>
                <div>Alert Threshold: 80%</div>
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Alert Recipients</div>
              <div className="space-y-1 text-muted-foreground">
                <div>bbalick@nouripet.net</div>
                <div>dcohen@nouripet.net</div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <strong>Note:</strong> Configure budgets in Vercel environment variables:
            <code className="block mt-1 bg-white p-2 rounded">AI_DAILY_BUDGET, AI_MONTHLY_BUDGET</code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
