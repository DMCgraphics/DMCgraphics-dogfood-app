# Data Validation Guide

This guide explains how to ensure all required data is present when creating users and their associated data, preventing the "Database error deleting user" issue.

## 🎯 **Problem Solved**

The previous issue was caused by incomplete data during user creation, specifically:
- Plans with missing `stripe_session_id` or `stripe_subscription_id`
- Dogs with missing `weight_kg` calculations
- Incomplete checkout data that prevented CASCADE DELETE from working

## 🛠️ **Solution Components**

### 1. **Data Validation Library** (`lib/data-validation.ts`)
- Validates all data before database insertion
- Ensures required fields are present and valid
- Calculates missing fields automatically (e.g., `weight_kg`)

### 2. **Safe Data Creation Functions** (`lib/safe-data-creation.ts`)
- Wrapper functions that use validation before database operations
- Prevents incomplete data from being created
- Provides clear error messages for validation failures

### 3. **Database Constraints** (`scripts/add-data-integrity-constraints.sql`)
- Database-level constraints to prevent invalid data
- Automatic triggers for field calculations
- Validation functions for data completeness

### 4. **Data Integrity Validation** (`scripts/validate-data-integrity.js`)
- Script to check existing data for issues
- Can fix common problems automatically
- Validates data before user deletion

## 📋 **Implementation Steps**

### Step 1: Add Database Constraints

Execute the SQL script in your Supabase dashboard:

```sql
-- Run this in Supabase SQL Editor
\i scripts/add-data-integrity-constraints.sql
```

This adds:
- ✅ Validation constraints for all tables
- ✅ Automatic field calculations (weight_kg, total_cents)
- ✅ Data completeness validation functions

### Step 2: Update Your Code

Replace direct database inserts with safe creation functions:

#### Before (❌ Problematic):
```typescript
// This can create incomplete data
const { data: dog, error } = await supabase
  .from('dogs')
  .insert({
    user_id: userId,
    name: dogName,
    weight: weight,
    weight_unit: 'lb'
    // Missing weight_kg calculation!
  })
```

#### After (✅ Safe):
```typescript
import { createDogSafely } from '@/lib/safe-data-creation'

// This ensures all required fields are present
const dog = await createDogSafely(userId, {
  name: dogName,
  weight: weight,
  weight_unit: 'lb'
  // weight_kg is automatically calculated!
})
```

### Step 3: Update Plan Builder

In your plan builder components, use the safe creation functions:

```typescript
import { createUserSetupSafely, updatePlanSafely } from '@/lib/safe-data-creation'

// For new user setup
const { dog, plan } = await createUserSetupSafely(userId, {
  name: dogName,
  breed: dogBreed,
  weight: dogWeight,
  weight_unit: 'lb'
})

// For plan updates
await updatePlanSafely(planId, {
  status: 'checkout',
  stripe_session_id: sessionId,
  total_cents: totalAmount
})
```

### Step 4: Validate Before Deletion

Before deleting users, validate their data:

```typescript
import { validateUserDataForDeletion } from '@/lib/safe-data-creation'

const { canDelete, issues } = await validateUserDataForDeletion(userId)

if (!canDelete) {
  console.log('Cannot delete user due to:', issues)
  // Handle incomplete data
} else {
  // Safe to delete
  await supabase.auth.admin.deleteUser(userId)
}
```

## 🔧 **Validation Rules**

### Dogs Table
- ✅ `name` must not be empty
- ✅ `weight` must be positive
- ✅ `weight_unit` must be 'lb' or 'kg'
- ✅ `weight_kg` is automatically calculated
- ✅ `age` must be 0-30 years

### Plans Table
- ✅ `status` must be valid enum value
- ✅ `subtotal_cents` must be non-negative
- ✅ `total_cents` must be non-negative
- ✅ `total_cents` must be >= (subtotal_cents - discount_cents)
- ✅ `current_step` must be 0-10

### Plan Items Table
- ✅ `qty` must be positive
- ✅ `size_g` must be positive
- ✅ `billing_interval` must be valid enum

### Subscriptions Table
- ✅ `status` must be valid enum value
- ✅ `billing_cycle` must be valid enum
- ✅ `price_monthly` must be non-negative

### Orders Table
- ✅ `status` must not be empty
- ✅ `total_cents` must be non-negative

## 🧪 **Testing**

### Validate Existing Data
```bash
node scripts/validate-data-integrity.js
```

### Fix Common Issues
```bash
node scripts/validate-data-integrity.js --fix
```

### Test User Deletion
```bash
node scripts/verify-user-deletion-constraints.js
```

## 🚨 **Error Handling**

The validation system provides clear error messages:

```typescript
try {
  await createDogSafely(userId, dogData)
} catch (error) {
  if (error instanceof SafeDataCreationError) {
    console.log('Validation failed:', error.message)
    // Handle validation error
  } else {
    console.log('Database error:', error.message)
    // Handle database error
  }
}
```

## 📊 **Monitoring**

### Check Data Integrity
```typescript
// In your admin dashboard
const { canDelete, issues } = await validateUserDataForDeletion(userId)
if (issues.length > 0) {
  // Show issues to admin
  console.log('Data issues:', issues)
}
```

### Database Function
```sql
-- Check user data completeness
SELECT * FROM validate_user_data_completeness('user-uuid-here');
```

## 🎉 **Benefits**

1. **Prevents Incomplete Data**: All required fields are validated before insertion
2. **Automatic Calculations**: Missing fields are calculated automatically
3. **Clear Error Messages**: Validation failures provide specific error details
4. **Database Constraints**: Multiple layers of validation (code + database)
5. **Easy Monitoring**: Tools to check data integrity
6. **Safe Deletion**: Users can be deleted without constraint violations

## 🔄 **Migration**

If you have existing incomplete data:

1. Run the validation script to identify issues
2. Use the fix option to correct common problems
3. Update your code to use the safe creation functions
4. Add database constraints to prevent future issues

## 📝 **Best Practices**

1. **Always use safe creation functions** instead of direct database inserts
2. **Validate data before deletion** to prevent constraint violations
3. **Run integrity checks regularly** to catch issues early
4. **Use the validation library** for all user-related data creation
5. **Monitor error logs** for validation failures

This system ensures that all user data is complete and valid, preventing the cascade delete issues that were causing user deletion failures.
