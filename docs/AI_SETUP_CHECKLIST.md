# AI System Setup Checklist

## Prerequisites
- [ ] Vercel account with access to project
- [ ] Supabase project set up
- [ ] Anthropic API key obtained
- [ ] Resend account created (for email alerts)

## Step 1: Environment Variables

### Vercel Dashboard → Settings → Environment Variables

Add the following (for **Production** environment):

- [ ] `ENABLE_AI_LLM=true`
- [ ] `ANTHROPIC_API_KEY=sk-ant-xxx` (full key, not truncated!)
- [ ] `AI_DAILY_BUDGET=5.00`
- [ ] `AI_MONTHLY_BUDGET=100.00`
- [ ] `AI_ALERT_THRESHOLD=80`
- [ ] `AI_EMERGENCY_SHUTOFF=false`
- [ ] `AI_ALERT_EMAIL_1=bbalick@nouripet.net`
- [ ] `AI_ALERT_EMAIL_2=dcohen@nouripet.net`
- [ ] `AI_ALERT_FROM_EMAIL=alerts@nouripet.net`
- [ ] `RESEND_API_KEY=re_xxx`
- [ ] `CRON_SECRET=[generate random string]`
- [ ] `NEXT_PUBLIC_APP_URL=https://nouripet.net`

**Note**: Also add to Preview environment if testing there.

## Step 2: Database Migrations

### Via Supabase Dashboard

1. [ ] Go to Supabase Dashboard → SQL Editor
2. [ ] Run migration: `supabase/migrations/20251212_ai_cost_tracking.sql`
3. [ ] Run migration: `supabase/migrations/20251212_ai_global_cache.sql`
4. [ ] Verify tables created:
   - [ ] `ai_token_usage`
   - [ ] `ai_daily_costs`
   - [ ] `ai_cost_alerts`
   - [ ] `ai_global_cache`

### Via Supabase CLI (Alternative)

```bash
supabase db push
```

## Step 3: Email Service (Resend)

1. [ ] Sign up at https://resend.com
2. [ ] Get API key from dashboard
3. [ ] Add domain: `nouripet.net`
4. [ ] Verify domain (add DNS records)
5. [ ] Test send email to verify setup

## Step 4: Deploy & Verify

### Trigger Deployment

1. [ ] Commit is already pushed to main branch
2. [ ] Wait for Vercel deployment to complete
3. [ ] Check deployment logs for errors

### Verify LLM is Working

1. [ ] Go to https://nouripet.net/plan-builder
2. [ ] Create a test dog profile (e.g., "Luigi", 20 lbs, 4 years)
3. [ ] Complete the wizard
4. [ ] On Step 4, verify you see:
   - [ ] AI recommendation card appears
   - [ ] Personalized explanation (conversational, not template)
   - [ ] "Ask questions about this recommendation" button
5. [ ] Test the Q&A chat

### Verify Caching

1. [ ] Complete plan builder for same dog profile
2. [ ] Check browser console for cache hit logs
3. [ ] Refresh page and complete again (should be instant)

### Verify Cost Tracking

1. [ ] Go to https://nouripet.net/admin/ai-monitoring
2. [ ] Verify you see:
   - [ ] Daily cost > $0
   - [ ] Request count > 0
   - [ ] Cache hit rate displayed

## Step 5: Test Cost Alerts

### Manual Test (Optional)

1. [ ] Temporarily set `AI_DAILY_BUDGET=0.001` in Vercel
2. [ ] Trigger a few LLM calls (plan builder)
3. [ ] Manually call cron: `curl https://nouripet.net/api/cron/check-ai-costs -H "Authorization: Bearer YOUR_CRON_SECRET"`
4. [ ] Check email inboxes (bbalick & dcohen) for alert
5. [ ] Reset `AI_DAILY_BUDGET=5.00`

### Verify Cron Job

1. [ ] Check Vercel Dashboard → Settings → Cron Jobs
2. [ ] Verify hourly cron is listed
3. [ ] Check next run time
4. [ ] (Optional) View execution logs after first run

## Step 6: Monitor First Week

### Daily Checks (First 3 Days)

- [ ] Check admin dashboard daily
- [ ] Monitor daily costs
- [ ] Verify cache hit rate is climbing toward 70%
- [ ] Check for any error logs

### After 7 Days

- [ ] Review weekly cost summary
- [ ] Check cache performance
- [ ] Verify no alerts sent (if costs are under budget)
- [ ] Review user engagement analytics

## Troubleshooting

### If LLM Not Working

1. [ ] Check environment variables are set correctly
2. [ ] Verify API key is not truncated (common issue!)
3. [ ] Check Vercel function logs for errors
4. [ ] Ensure `ENABLE_AI_LLM=true` (exact string)

### If Email Alerts Not Sending

1. [ ] Verify Resend API key is valid
2. [ ] Check domain verification in Resend
3. [ ] Look for errors in cron job logs
4. [ ] Test Resend API directly: https://resend.com/docs/send-with-nodejs

### If Cache Not Working

1. [ ] Check browser localStorage (may be full)
2. [ ] Verify database migrations ran successfully
3. [ ] Check Supabase table permissions (RLS)
4. [ ] Clear cache and retry

## Success Criteria

After setup is complete, you should see:

✅ **LLM Explanations**: Personalized, conversational recommendations
✅ **Interactive Chat**: Users can ask follow-up questions
✅ **Admin Dashboard**: Real-time cost and performance metrics
✅ **Cache Working**: Hit rate trending toward 70%+
✅ **Costs Tracked**: Database logging all LLM calls
✅ **Cron Running**: Hourly cost checks in Vercel logs
✅ **No Alerts** (assuming costs under budget)

---

## Quick Reference

**Admin Dashboard**: https://nouripet.net/admin/ai-monitoring
**Cron Endpoint**: https://nouripet.net/api/cron/check-ai-costs
**Test Plan Builder**: https://nouripet.net/plan-builder

**Email Recipients**:
- bbalick@nouripet.net
- dcohen@nouripet.net

**Default Budgets**:
- Daily: $5.00
- Monthly: $100.00

---

Last Updated: December 12, 2024
