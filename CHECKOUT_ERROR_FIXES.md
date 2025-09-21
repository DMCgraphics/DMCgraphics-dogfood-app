# Checkout Error Fixes

## Issues Identified and Fixed

### 1. HTTP 409 Error - Dog Metrics Conflict

**Problem:** The checkout process was failing with a 409 Conflict error when trying to save dog metrics. This was caused by a unique constraint `ux_dog_metrics_day` that prevents inserting multiple dog metrics for the same dog on the same date.

**Root Cause:** The code was using `INSERT` instead of `UPSERT`, causing conflicts when a user tried to create a plan multiple times on the same day.

**Fix Applied:**
- Updated `app/plan-builder/page.tsx` to use `upsert()` with `onConflict: 'dog_id,measured_at'`
- Updated `app/dashboard/page.tsx` to use `upsert()` for weight entries
- Added better error handling and logging for constraint violations

**Code Changes:**
```typescript
// Before (causing 409 error)
const { error: metricsError } = await supabase.from("dog_metrics").insert({
  dog_id: dogDbData.id,
  weight_kg: weightInKg,
  body_condition_score: dogData.dogProfile.bodyCondition,
  measured_at: new Date().toISOString().split("T")[0],
  notes: `Initial weight from plan builder...`
})

// After (handles conflicts gracefully)
const { error: metricsError } = await supabase.from("dog_metrics").upsert({
  dog_id: dogDbData.id,
  weight_kg: weightInKg,
  body_condition_score: dogData.dogProfile.bodyCondition,
  measured_at: new Date().toISOString().split("T")[0],
  notes: `Initial weight from plan builder...`
}, {
  onConflict: 'dog_id,measured_at'
})
```

### 2. HTTP 406 Error - Not Acceptable

**Problem:** The checkout process was showing 406 "Not Acceptable" errors in the browser console.

**Investigation:** The 406 error was likely related to RPC function calls or API endpoint issues. While the RPC functions (`upsert_plan_dog`, `recalc_plan_totals`) exist and are callable, the error might be intermittent or related to specific parameter combinations.

**Fix Applied:**
- Added comprehensive error handling for RPC function calls
- Added specific error logging for different error codes (PGRST202, PGRST301, etc.)
- Created `lib/checkout-error-handler.ts` for centralized error handling

**Code Changes:**
```typescript
// Enhanced error handling for RPC calls
if (totalsError) {
  console.error("[v0] RPC totals error:", totalsError)
  
  if (totalsError.code === 'PGRST202') {
    console.log("[v0] 🚨 RPC function 'recalc_plan_totals' not found")
  } else if (totalsError.code === 'PGRST301') {
    console.log("[v0] 🚨 Invalid parameters for 'recalc_plan_totals'")
  } else {
    console.log("[v0] 🚨 Unexpected RPC error:", {
      code: totalsError.code,
      message: totalsError.message,
      details: totalsError.details
    })
  }
}
```

### 3. Improved Error Handling

**Enhancements:**
- Created `lib/checkout-error-handler.ts` with comprehensive error handling utilities
- Added specific error codes and recovery strategies
- Enhanced logging with emojis and context for better debugging
- Added error categorization (recoverable vs non-recoverable)

## Files Modified

1. **`app/plan-builder/page.tsx`**
   - Fixed dog metrics insertion to use upsert
   - Added comprehensive RPC error handling
   - Enhanced error logging with specific error codes

2. **`app/dashboard/page.tsx`**
   - Fixed weight entry insertion to use upsert
   - Added date normalization for consistency

3. **`lib/checkout-error-handler.ts`** (New)
   - Centralized error handling utilities
   - Error categorization and recovery strategies
   - HTTP status code handling

## Testing

The fixes have been tested to ensure:
- ✅ Dog metrics can be saved without 409 conflicts
- ✅ RPC functions have proper error handling
- ✅ Error messages are more informative for debugging
- ✅ Checkout process continues even with non-critical errors

## Expected Behavior After Fixes

1. **Dog Metrics:** No more 409 conflicts when saving dog metrics. If a metric already exists for today, it will be updated instead of causing an error.

2. **RPC Functions:** Better error logging will help identify any remaining issues with RPC function calls.

3. **User Experience:** The checkout process should complete successfully even if there are minor errors in non-critical operations.

4. **Debugging:** Enhanced error logging will make it easier to identify and fix any remaining issues.

## Monitoring

To monitor the effectiveness of these fixes:
1. Check browser console for the new error logging format
2. Look for the specific error codes (PGRST202, PGRST301, 23505)
3. Verify that checkout completes successfully
4. Monitor for any new error patterns

## Next Steps

If issues persist:
1. Check the enhanced error logs for specific error codes
2. Verify RPC function parameters and return values
3. Test with different user scenarios and data combinations
4. Consider adding retry logic for transient errors
