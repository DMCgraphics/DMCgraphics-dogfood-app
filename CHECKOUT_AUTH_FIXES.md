# Checkout Authentication Loop Fixes

## Problem Identified

The user was getting stuck in an authentication loop when trying to proceed to checkout after creating an account. The console showed:

```
[v0] Auth still loading, waiting...
[v0] Auth already processing, skipping duplicate call
[v0] Auth success timeout - closing modal to prevent stuck state
```

This created an infinite loop where the system couldn't proceed to checkout.

## Root Causes

1. **Race Condition**: The auth context (`useAuth`) and direct session check were not synchronized
2. **Duplicate Call Prevention**: The `isProcessingAuth` flag was preventing legitimate retries
3. **Session Detection**: The system wasn't properly detecting when a user was already authenticated
4. **Timeout Logic**: The timeout logic was creating conflicts between different authentication checks

## Fixes Applied

### 1. Enhanced Authentication State Detection

**Before:**
```typescript
console.log("[v0] Checking authentication state:", { user: !!user, isLoading })

if (!user && !isLoading) {
  // Create anonymous plan
}

if (isLoading) {
  // Wait and retry
}
```

**After:**
```typescript
console.log("[v0] Checking authentication state:", { user: !!user, isLoading })

// Check if user is authenticated via direct session check as well
const { data: { session: directSession } } = await supabase.auth.getSession()
const isAuthenticatedViaSession = !!directSession?.user
console.log("[v0] Direct session check:", { isAuthenticatedViaSession, userId: directSession?.user?.id })

if (!user && !isLoading && !isAuthenticatedViaSession) {
  // Create anonymous plan
}

if (isLoading && !isAuthenticatedViaSession) {
  // Wait and retry
}
```

### 2. Improved Duplicate Call Prevention

**Before:**
```typescript
const handleProceedToCheckout = async () => {
  console.log("[v0] proceed_to_checkout_clicked")
  // ... rest of function
}
```

**After:**
```typescript
const handleProceedToCheckout = async () => {
  console.log("[v0] proceed_to_checkout_clicked")

  // Prevent multiple simultaneous calls
  if (isProcessingAuth) {
    console.log("[v0] Checkout already processing, skipping duplicate call")
    return
  }

  // ... rest of function
}
```

### 3. Enhanced Session Handling

**Before:**
```typescript
try {
  console.log("[v0] Waiting for authenticated session...")
  const session = await waitForSession()
  console.log("[v0] Session confirmed:", session.user.id)
  // ...
}
```

**After:**
```typescript
try {
  console.log("[v0] Waiting for authenticated session...")
  
  // First, try to get the current session directly
  const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
  
  let session
  if (currentSession?.user && !sessionError) {
    console.log("[v0] Session already available:", currentSession.user.id)
    session = currentSession
    clearTimeout(timeoutId)
  } else {
    console.log("[v0] No current session, waiting for session...")
    session = await waitForSession(10000, 500) // Increased timeout and interval
    console.log("[v0] Session confirmed:", session.user.id)
    clearTimeout(timeoutId)
  }
  
  // Validate session user ID
  if (!session?.user?.id) {
    throw new Error("No valid user ID found in session")
  }
  // ...
}
```

### 4. Improved Timeout Logic

**Before:**
```typescript
if (isLoading) {
  setTimeout(() => {
    if (user && !isProcessingAuth) {
      handleAuthSuccess()
    } else if (!user) {
      setShowAuthModal(true)
    } else {
      console.log("[v0] Auth already processing, skipping duplicate call")
    }
  }, 500)
  return
}
```

**After:**
```typescript
if (isLoading && !isAuthenticatedViaSession) {
  setTimeout(() => {
    if ((user || isAuthenticatedViaSession) && !isProcessingAuth) {
      handleAuthSuccess()
    } else if (!user && !isAuthenticatedViaSession && !isProcessingAuth) {
      setShowAuthModal(true)
    } else {
      console.log("[v0] Auth already processing, skipping duplicate call")
    }
  }, 500)
  return
}
```

## Expected Behavior After Fixes

1. **Immediate Detection**: If user is already authenticated via session, proceed immediately
2. **No Infinite Loops**: Proper duplicate call prevention prevents multiple simultaneous processing
3. **Better Session Handling**: Direct session check as fallback when auth context is slow
4. **Improved Timeouts**: Longer timeouts and better interval handling for session detection
5. **Clear Logging**: Enhanced debugging information to track authentication flow

## Testing Scenarios

1. **New User Signup**: User creates account → should proceed to checkout
2. **Existing User Login**: User logs in → should proceed to checkout  
3. **Already Authenticated**: User is already logged in → should proceed immediately
4. **Session Recovery**: User has valid session but context is slow → should detect session and proceed

## Files Modified

- `app/plan-builder/page.tsx` - Main authentication flow fixes
- `CHECKOUT_AUTH_FIXES.md` - This documentation

## Monitoring

To verify the fixes are working:

1. **Check Console Logs**: Look for the new authentication flow messages
2. **Verify No Loops**: Should not see repeated "Auth still loading" messages
3. **Check Session Detection**: Should see "Direct session check" logs
4. **Verify Checkout**: Should successfully redirect to `/checkout` page

The authentication loop should now be resolved, and users should be able to proceed to checkout after creating an account or logging in.
