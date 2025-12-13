# AI Meal Recommendation System - Complete Documentation

## 🎯 Overview

The AI Meal Recommendation System provides personalized, conversational meal recommendations for dogs using Claude 3 Haiku LLM, combined with rule-based scoring and multi-layer caching for optimal performance and cost efficiency.

## ✅ Features Complete (Phases 1-5+)

### Phase 1: LLM Integration ✅
- Anthropic Claude 3 Haiku integration
- Personalized, conversational explanations
- Interactive Q&A chat
- Graceful fallbacks to template-based reasoning

### Phase 2: Enhanced UI ✅
- Confidence visualization with breakdowns
- Inline AI helpers throughout plan builder
- Real-time guidance as users input data
- What-If simulator for exploring scenarios

### Phase 3: Trust-Building ✅
- Transparency dashboard showing data usage
- Science-based citations
- Detailed confidence explanations
- Alternative recipe recommendations

### Phase 4: Engagement ✅
- Progress indicators through wizard steps
- Multi-dog complexity guidance
- Interactive "What If" scenarios

### Phase 5: Performance & Polish ✅
- **3-layer caching** (session + localStorage + Supabase)
- Target: 70%+ cache hit rate
- AI loading skeletons
- Centralized error handling
- Comprehensive analytics tracking
- Token usage and cost tracking

### Phase 5+: Advanced Monitoring ✅ (NEW)
- **Cost alert system** with email notifications
- **Admin dashboard** for real-time monitoring
- **Layer 3 global cache** (Supabase)
- **Automated cost checking** via cron job
- **Budget management** with configurable limits

---

## 🚀 Setup Instructions

### 1. Environment Variables

Add these to your Vercel/production environment:

```bash
# AI Configuration
ENABLE_AI_LLM=true
ANTHROPIC_API_KEY=sk-ant-xxx

# Cost Budgets & Alerts
AI_DAILY_BUDGET=5.00              # Daily budget in USD
AI_MONTHLY_BUDGET=100.00          # Monthly budget in USD
AI_ALERT_THRESHOLD=80             # Alert at 80% of budget
AI_EMERGENCY_SHUTOFF=false        # Auto-disable LLM when exceeded

# Alert Recipients
AI_ALERT_EMAIL_1=bbalick@nouripet.net
AI_ALERT_EMAIL_2=dcohen@nouripet.net
AI_ALERT_FROM_EMAIL=alerts@nouripet.net

# Email Service (Resend)
RESEND_API_KEY=re_xxx

# Cron Security
CRON_SECRET=your-random-secret-here

# App URL
NEXT_PUBLIC_APP_URL=https://nouripet.net
```

### 2. Database Migrations

Run the Supabase migrations:

```bash
# From your local Supabase project or Supabase Dashboard SQL Editor

# Migration 1: AI Cost Tracking
supabase/migrations/20251212_ai_cost_tracking.sql

# Migration 2: AI Global Cache
supabase/migrations/20251212_ai_global_cache.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### 3. Vercel Cron Job

The `vercel.json` file is already configured with an hourly cron:

```json
{
  "crons": [{
    "path": "/api/cron/check-ai-costs",
    "schedule": "0 * * * *"
  }]
}
```

**Important**: Add the `CRON_SECRET` to Vercel environment variables for security.

### 4. Email Setup (Resend)

1. Sign up at https://resend.com
2. Get API key
3. Add `RESEND_API_KEY` to environment variables
4. Verify sending domain (alerts@nouripet.net)

---

## 📊 Admin Dashboard

Access the admin dashboard at:
```
https://nouripet.net/admin/ai-monitoring
```

**Features:**
- Real-time cost tracking (daily & monthly)
- Budget status indicators
- Cache hit rate monitoring
- Cost per request metrics
- Savings from caching
- Auto-refresh every minute

---

## 💰 Cost Management

### Budget Configuration

Default budgets:
- **Daily**: $5.00 USD
- **Monthly**: $100.00 USD
- **Alert Threshold**: 80%

### Alert Levels

| Threshold | Type | Action |
|-----------|------|--------|
| 80% | Warning | Email alert sent |
| 95% | Critical | Urgent email alert |
| 100% | Emergency | Emergency alert (+ optional LLM shutoff) |

### Email Alerts

Recipients:
- bbalick@nouripet.net
- dcohen@nouripet.net

Alerts include:
- Current cost vs limit
- Percentage used
- Period (daily/monthly)
- Recommended actions

### Cost Tracking

All LLM API calls are tracked with:
- Input/output tokens
- Estimated cost (based on Haiku pricing)
- Response time
- Cache hit/miss
- Feature type

View in:
- Admin dashboard (`/admin/ai-monitoring`)
- Database tables (`ai_token_usage`, `ai_daily_costs`)

---

## 🎯 Caching Strategy

### Layer 1: Session Cache (In-Memory)
- Fastest (< 1ms)
- Current session only
- Automatically cleared on page refresh

### Layer 2: localStorage (Browser)
- Fast (< 10ms)
- 7-day TTL
- Persists across sessions
- Automatic cleanup of expired entries

### Layer 3: Supabase (Global)
- Shared across all users
- 30-day TTL
- Tracks hit count for popular profiles
- Automatic promotion to Layer 1 & 2 on hit

**Cache Key Generation:**
- Deterministic hash of dog profile
- Rounds weight to nearest 5 lbs (better hit rates)
- Includes: age, weight, activity, body condition, allergens, weight goal

**Performance:**
- Target: 70%+ cache hit rate
- Reduces API costs by ~70%
- Response time: < 10ms (cached) vs 1-2s (API call)

---

## 📈 Analytics Tracking

### Events Tracked

| Event | Description |
|-------|-------------|
| `ai_recommendation_viewed` | User sees AI recommendation |
| `ai_explanation_generated` | LLM explanation created |
| `ai_cache_hit` | Cache hit (with layer info) |
| `ai_cache_miss` | Cache miss (API call made) |
| `ai_chat_message_sent` | Q&A chat interaction |
| `ai_what_if_used` | What-If simulator used |
| `ai_error` | AI error occurred |
| `ai_fallback_used` | Template fallback used |

### Integration Points

Analytics are sent to:
- Google Analytics 4 (if configured)
- PostHog (if configured)
- Custom API endpoint (`/api/analytics/ai`)

**Client-side:** `lib/analytics/ai-events.ts`

---

## 🔧 API Endpoints

### Cost Tracking

**POST** `/api/ai/track-cost`
```json
{
  "feature": "explanation",
  "inputTokens": 800,
  "outputTokens": 300,
  "estimatedCost": 0.00069,
  "responseTimeMs": 1234,
  "cached": false,
  "llmUsed": true
}
```

**GET** `/api/ai/track-cost`
- Returns daily and monthly cost summaries

### Cost Checking (Cron)

**GET** `/api/cron/check-ai-costs`
- Requires `Authorization: Bearer {CRON_SECRET}`
- Checks budgets and sends alerts
- Runs hourly via Vercel Cron

### LLM Explanation

**POST** `/api/ai/generate-explanation`
```json
{
  "dogProfile": { /* MultiDogProfile */ },
  "scoringBreakdown": { /* scoring data */ },
  "explanationType": "reasoning"
}
```

### Chat

**POST** `/api/ai/chat`
```json
{
  "dogProfile": { /* MultiDogProfile */ },
  "recommendation": { /* AIRecommendation */ },
  "messages": [ /* ChatMessage[] */ ],
  "question": "Why this recipe for Max?"
}
```

---

## 🗄️ Database Schema

### Tables

#### `ai_token_usage`
Tracks every LLM API call
- `input_tokens`, `output_tokens`, `estimated_cost`
- `feature`, `session_id`, `user_id`
- `response_time_ms`, `cached`, `llm_used`

#### `ai_daily_costs`
Aggregated daily summaries
- `total_requests`, `total_tokens`, `total_cost`
- `cache_hits`, `cache_misses`, `cache_hit_rate`
- `alert_sent`, `alert_type`

#### `ai_cost_alerts`
Historical alert log
- `alert_type`, `period`, `current_cost`
- `budget_limit`, `percentage`
- `recipients`, `email_sent`

#### `ai_global_cache`
Shared LLM response cache
- `cache_key`, `explanation`, `explanation_type`
- `hit_count`, `last_accessed_at`
- `expires_at` (30 days)

---

## 💡 Usage Examples

### Check Cache Stats
```typescript
import { getCacheStats } from "@/lib/ai/cache-manager"

const stats = getCacheStats()
console.log(`Cache hit rate: ${stats.hitRate.toFixed(1)}%`)
```

### Get Cost Summary
```typescript
import { getCostSummary } from "@/lib/analytics/cost-tracker"

const summary = getCostSummary(7) // Last 7 days
console.log(`Total cost: $${summary.totalCost.toFixed(4)}`)
```

### Track Custom Event
```typescript
import { trackAIEvent } from "@/lib/analytics/ai-events"

trackAIEvent("ai_recommendation_viewed", {
  dogName: "Max",
  confidence: 87,
  topRecipe: "Beef Quinoa Harvest"
})
```

---

## 🛠️ Troubleshooting

### LLM Not Working
1. Check `ENABLE_AI_LLM=true` in environment
2. Verify `ANTHROPIC_API_KEY` is set and not truncated
3. Check `/api/ai/debug` endpoint (if created) for env var status

### Email Alerts Not Sending
1. Verify `RESEND_API_KEY` is set
2. Check sending domain is verified in Resend
3. View error logs in `/api/cron/check-ai-costs` response

### Cache Not Working
1. Check browser localStorage isn't full
2. Verify Supabase tables exist (run migrations)
3. Check cache hit rate in admin dashboard

### Cron Job Not Running
1. Verify `vercel.json` is deployed
2. Check Vercel Dashboard → Settings → Cron Jobs
3. Ensure `CRON_SECRET` is set

---

## 📝 Cost Estimates

### Claude 3 Haiku Pricing
- Input: $0.25 per 1M tokens
- Output: $1.25 per 1M tokens

### Typical Usage
| Scenario | Input Tokens | Output Tokens | Cost |
|----------|--------------|---------------|------|
| Explanation | 800 | 300 | $0.00069 |
| Chat message | 400 | 200 | $0.00035 |

### With 70% Cache Hit Rate
- **Per session**: ~$0.002 (avg)
- **1000 sessions/month**: ~$2/month
- **Expected ROI**: 5% conversion boost = +$6,000/month revenue

---

## 🔐 Security Notes

1. **CRON_SECRET**: Required for cron endpoint security
2. **RLS Policies**: Ensure proper Row Level Security on Supabase tables
3. **API Keys**: Never commit API keys to git
4. **Rate Limiting**: Consider adding rate limits to prevent abuse

---

## 📚 Resources

- **Anthropic Claude Docs**: https://docs.anthropic.com
- **Resend Docs**: https://resend.com/docs
- **Vercel Cron**: https://vercel.com/docs/cron-jobs
- **Supabase**: https://supabase.com/docs

---

## 🎉 Success Metrics

**Target KPIs:**
- ✅ Cache hit rate: 70%+
- ✅ Daily cost: < $5
- ✅ Response time: < 2s (95th percentile)
- ✅ Conversion boost: +5%
- ✅ User engagement: 60%+ view AI features

---

## 🤝 Support

For issues or questions:
- Technical: dcohen@nouripet.net
- Business: bbalick@nouripet.net
- Alerts will be sent automatically to both addresses

---

Last updated: December 12, 2024
