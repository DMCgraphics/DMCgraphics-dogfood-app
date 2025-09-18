# Real Recommendations System Setup Guide

## Overview
The dashboard now has a real recommendations system that analyzes your dog's health data and provides personalized suggestions. This replaces the hard-coded recommendations with dynamic, data-driven insights.

## What's Been Implemented

### 1. Database Tables
- `weight_logs` - Stores weight tracking data
- `stool_logs` - Stores stool quality scores (1-5 scale)
- Both tables have proper RLS policies and indexes

### 2. Recommendations Engine (`lib/recommendations-engine.ts`)
A deterministic rules engine that analyzes:
- Weight trends over 30 days
- Stool consistency over 14 days  
- Dog age, breed size, and medical conditions
- Current nutrition plan data

### 3. API Endpoint (`/api/dogs/[id]/recommendations`)
Fetches dog data, weight logs, stool logs, and current plan to generate recommendations.

### 4. Dashboard Integration
- Uses SWR for real-time data fetching
- Recommendations update automatically when data changes
- Action buttons navigate to relevant plan builder steps

## Setup Instructions

### Step 1: Create Database Tables
Run this SQL in your Supabase SQL Editor:

```sql
-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stool_logs table
CREATE TABLE IF NOT EXISTS stool_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INT CHECK (score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stool_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "sel own weight" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own weight" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own weight" ON weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own weight" ON weight_logs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "sel own stool" ON stool_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own stool" ON stool_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own stool" ON stool_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "del own stool" ON stool_logs FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weight_logs_dog_date ON weight_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_stool_logs_dog_date ON stool_logs(dog_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_stool_logs_user_id ON stool_logs(user_id);
```

### Step 2: Add Sample Data (Optional)
To test the recommendations system, run:

```bash
node scripts/add-sample-data.js
```

This will add:
- 30 days of weight logs with a weight gain trend
- 14 days of stool logs with some firm stools
- A sample nutrition plan

### Step 3: Test the System
1. Go to your dashboard
2. Select a dog
3. You should see real recommendations based on the data

## Recommendation Rules

The system currently implements these rules:

### Weight-Based Recommendations
- **Portion Down**: If weight ↑ ≥5% over 30 days → suggest reducing portions
- **Portion Up**: If weight ↓ ≥5% over 30 days → suggest increasing portions
- **Vet Advisory**: If weight change >10% in 30 days → suggest vet check

### Stool-Based Recommendations  
- **Firm Stools**: If median stool ≤2 → suggest more fiber/moisture
- **Soft Stools**: If median stool ≥4 → suggest lower fat or soluble fiber

### Age-Based Recommendations
- **Joint Support**: If age ≥4 (or ≥3 for large breeds) → suggest joint supplement

### Data Quality Recommendations
- **Log Nudge**: If no recent weight/stool logs → suggest logging data

## Action Buttons

Each recommendation has an action button that:
- **Portion adjustments** → Navigate to plan builder portion step
- **Recipe changes** → Navigate to plan builder recipe step  
- **Supplements** → Navigate to plan builder supplements step
- **Vet advisory** → Show vet contact options
- **Log nudge** → Scroll to weight/stool tracking sections

## Customization

### Adding New Rules
Edit `lib/recommendations-engine.ts` to add new recommendation rules:

```typescript
// Example: Activity level mismatch
if (dog.activity_level === "high" && kcalPerDay < 1000) {
  recs.push({
    id: "activity-mismatch",
    type: "portion",
    title: "Consider increasing portions for high activity",
    description: "High activity level may require more calories.",
    action: "Adjust portions",
    priority: "low",
    reason: "High activity level with current calorie intake.",
  })
}
```

### Modifying Action Buttons
Update the `handleTakeAction` function in `app/dashboard/page.tsx` to customize what happens when users click action buttons.

## Data Sources

The recommendations system uses:
- **Dog profile**: Age, breed, weight, medical conditions
- **Weight logs**: Last 90 days of weight tracking
- **Stool logs**: Last 14 days of stool quality scores
- **Nutrition plans**: Current recipe, calories, meal frequency

## Performance

- Recommendations are cached and refresh every 30 seconds
- Database queries are optimized with proper indexes
- SWR handles client-side caching and revalidation

## Next Steps

1. **Add more rules** based on veterinary guidelines
2. **Integrate with existing weight/stool tracking** components
3. **Add recommendation dismissal** functionality
4. **Implement recommendation history** tracking
5. **Add seasonal/weather-based recommendations**

The system is designed to be easily extensible and maintainable. All rules are transparent and auditable, making it easy to adjust based on veterinary feedback or user needs.
