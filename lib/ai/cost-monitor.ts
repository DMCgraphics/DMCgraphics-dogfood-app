/**
 * Server-side cost monitoring and alerting system
 * Tracks AI LLM costs and sends alerts when thresholds are exceeded
 */

import type { TokenUsage } from "@/lib/analytics/cost-tracker"

export interface CostBudget {
  dailyLimit: number // USD
  monthlyLimit: number // USD
  alertThreshold: number // Percentage (e.g., 80 for 80%)
  emergencyShutoff: boolean // Auto-disable LLM when budget exceeded
}

export interface CostAlert {
  type: "warning" | "critical" | "emergency"
  message: string
  currentCost: number
  limit: number
  percentage: number
  timestamp: number
  period: "daily" | "monthly"
}

/**
 * Default budget configuration
 * Can be overridden via environment variables
 */
const DEFAULT_BUDGET: CostBudget = {
  dailyLimit: parseFloat(process.env.AI_DAILY_BUDGET || "5.00"), // $5/day default
  monthlyLimit: parseFloat(process.env.AI_MONTHLY_BUDGET || "100.00"), // $100/month default
  alertThreshold: parseFloat(process.env.AI_ALERT_THRESHOLD || "80"), // 80% default
  emergencyShutoff: process.env.AI_EMERGENCY_SHUTOFF === "true", // false default
}

/**
 * Check if current costs exceed budget thresholds
 */
export async function checkCostBudget(
  dailyCost: number,
  monthlyCost: number
): Promise<CostAlert[]> {
  const alerts: CostAlert[] = []
  const budget = DEFAULT_BUDGET

  // Check daily budget
  const dailyPercentage = (dailyCost / budget.dailyLimit) * 100

  if (dailyPercentage >= 100) {
    alerts.push({
      type: "emergency",
      message: `🚨 CRITICAL: Daily AI cost limit exceeded! Current: $${dailyCost.toFixed(2)}, Limit: $${budget.dailyLimit.toFixed(2)}`,
      currentCost: dailyCost,
      limit: budget.dailyLimit,
      percentage: dailyPercentage,
      timestamp: Date.now(),
      period: "daily",
    })
  } else if (dailyPercentage >= budget.alertThreshold) {
    alerts.push({
      type: dailyPercentage >= 95 ? "critical" : "warning",
      message: `⚠️ Daily AI cost at ${dailyPercentage.toFixed(1)}%: $${dailyCost.toFixed(2)} of $${budget.dailyLimit.toFixed(2)}`,
      currentCost: dailyCost,
      limit: budget.dailyLimit,
      percentage: dailyPercentage,
      timestamp: Date.now(),
      period: "daily",
    })
  }

  // Check monthly budget
  const monthlyPercentage = (monthlyCost / budget.monthlyLimit) * 100

  if (monthlyPercentage >= 100) {
    alerts.push({
      type: "emergency",
      message: `🚨 CRITICAL: Monthly AI cost limit exceeded! Current: $${monthlyCost.toFixed(2)}, Limit: $${budget.monthlyLimit.toFixed(2)}`,
      currentCost: monthlyCost,
      limit: budget.monthlyLimit,
      percentage: monthlyPercentage,
      timestamp: Date.now(),
      period: "monthly",
    })
  } else if (monthlyPercentage >= budget.alertThreshold) {
    alerts.push({
      type: monthlyPercentage >= 95 ? "critical" : "warning",
      message: `⚠️ Monthly AI cost at ${monthlyPercentage.toFixed(1)}%: $${monthlyCost.toFixed(2)} of $${budget.monthlyLimit.toFixed(2)}`,
      currentCost: monthlyCost,
      limit: budget.monthlyLimit,
      percentage: monthlyPercentage,
      timestamp: Date.now(),
      period: "monthly",
    })
  }

  return alerts
}

/**
 * Send cost alerts via email
 */
export async function sendCostAlerts(alerts: CostAlert[]): Promise<void> {
  if (alerts.length === 0) return

  const recipients = [
    process.env.AI_ALERT_EMAIL_1 || "bbalick@nouripet.net",
    process.env.AI_ALERT_EMAIL_2 || "dcohen@nouripet.net",
  ]

  // Sort alerts by severity
  const emergencyAlerts = alerts.filter((a) => a.type === "emergency")
  const criticalAlerts = alerts.filter((a) => a.type === "critical")
  const warningAlerts = alerts.filter((a) => a.type === "warning")

  // Build email content
  const subject = emergencyAlerts.length > 0
    ? "🚨 URGENT: AI Cost Budget Exceeded"
    : criticalAlerts.length > 0
    ? "⚠️ CRITICAL: AI Cost Alert"
    : "⚠️ AI Cost Warning"

  const emailBody = buildAlertEmail(alerts)

  // Send via your email service
  try {
    // Using Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(recipients, subject, emailBody)
    }
    // Fallback to console in development
    else if (process.env.NODE_ENV === "development") {
      console.log("\n" + "=".repeat(60))
      console.log("📧 COST ALERT EMAIL (Development Mode)")
      console.log("=".repeat(60))
      console.log(`To: ${recipients.join(", ")}`)
      console.log(`Subject: ${subject}`)
      console.log("\n" + emailBody)
      console.log("=".repeat(60) + "\n")
    }
  } catch (error) {
    console.error("[Cost Monitor] Failed to send alert email:", error)
  }
}

/**
 * Build HTML email for cost alerts
 */
function buildAlertEmail(alerts: CostAlert[]): string {
  const now = new Date().toLocaleString()

  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .alert { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
    .emergency { background: #fef2f2; border-color: #dc2626; }
    .critical { background: #fff7ed; border-color: #ea580c; }
    .warning { background: #fffbeb; border-color: #f59e0b; }
    .footer { color: #6b7280; font-size: 0.875rem; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .metric { font-size: 1.25rem; font-weight: bold; color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AI Cost Alert - NouriPet</h1>
      <p>Time: ${now}</p>
    </div>
`

  alerts.forEach((alert) => {
    const className = alert.type
    html += `
    <div class="alert ${className}">
      <h3>${alert.message}</h3>
      <p>
        <strong>Current Cost:</strong> <span class="metric">$${alert.currentCost.toFixed(2)}</span><br>
        <strong>Budget Limit:</strong> $${alert.limit.toFixed(2)}<br>
        <strong>Usage:</strong> ${alert.percentage.toFixed(1)}%<br>
        <strong>Period:</strong> ${alert.period === "daily" ? "Last 24 hours" : "This month"}
      </p>
    </div>
`
  })

  html += `
    <div class="footer">
      <h4>Recommended Actions:</h4>
      <ul>
        <li>Review AI usage patterns in the admin dashboard</li>
        <li>Check cache hit rate (target: 70%+)</li>
        <li>Consider increasing budget limits if usage is justified</li>
        <li>Temporarily disable LLM features if costs are concerning</li>
      </ul>

      <p><strong>Environment Variables:</strong></p>
      <ul>
        <li><code>AI_DAILY_BUDGET</code> - Current: $${DEFAULT_BUDGET.dailyLimit.toFixed(2)}</li>
        <li><code>AI_MONTHLY_BUDGET</code> - Current: $${DEFAULT_BUDGET.monthlyLimit.toFixed(2)}</li>
        <li><code>AI_ALERT_THRESHOLD</code> - Current: ${DEFAULT_BUDGET.alertThreshold}%</li>
      </ul>

      <p><small>This is an automated alert from the NouriPet AI Cost Monitoring system.</small></p>
    </div>
  </div>
</body>
</html>
`

  return html
}

/**
 * Send email via Resend
 */
async function sendViaResend(
  recipients: string[],
  subject: string,
  htmlBody: string
): Promise<void> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.AI_ALERT_FROM_EMAIL || "alerts@nouripet.net",
      to: recipients,
      subject,
      html: htmlBody,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${error}`)
  }
}

/**
 * Check if LLM should be disabled due to budget
 */
export async function shouldDisableLLM(
  dailyCost: number,
  monthlyCost: number
): Promise<boolean> {
  if (!DEFAULT_BUDGET.emergencyShutoff) {
    return false
  }

  // Disable if either daily or monthly budget is exceeded
  return (
    dailyCost >= DEFAULT_BUDGET.dailyLimit ||
    monthlyCost >= DEFAULT_BUDGET.monthlyLimit
  )
}

/**
 * Get current budget status
 */
export function getBudgetStatus(
  dailyCost: number,
  monthlyCost: number
): {
  daily: { cost: number; limit: number; percentage: number; status: string }
  monthly: { cost: number; limit: number; percentage: number; status: string }
} {
  const budget = DEFAULT_BUDGET

  const dailyPercentage = (dailyCost / budget.dailyLimit) * 100
  const monthlyPercentage = (monthlyCost / budget.monthlyLimit) * 100

  const getDailyStatus = (pct: number) => {
    if (pct >= 100) return "exceeded"
    if (pct >= 95) return "critical"
    if (pct >= 80) return "warning"
    return "normal"
  }

  return {
    daily: {
      cost: dailyCost,
      limit: budget.dailyLimit,
      percentage: dailyPercentage,
      status: getDailyStatus(dailyPercentage),
    },
    monthly: {
      cost: monthlyCost,
      limit: budget.monthlyLimit,
      percentage: monthlyPercentage,
      status: getDailyStatus(monthlyPercentage),
    },
  }
}
