# AI-Enhanced Plan Builder Components

## Phase 2: Enhanced UI Components - Complete! ✨

This directory contains all the AI-powered UI components that bring transparency, engagement, and trust to the meal recommendation experience.

## Components Overview

### 1. **AIInlineHelper** (`ai-inline-helper.tsx`)

Small, contextual AI tips that appear next to relevant inputs throughout the plan builder.

**Features:**
- Sparkles icon + "AI Tip" label
- Collapsible (remembers dismissal via localStorage)
- Multiple variants (default, info, warning, success)
- Auto-dismissed and remembered per-user

**Usage:**
```tsx
import { AIInlineHelper, BodyConditionHelper, WeightGoalHelper } from './ai-inline-helper'

// Generic inline helper
<AIInlineHelper
  id="tip-body-condition"
  message="A body condition of 7/9 suggests Max would benefit from weight management."
  variant="warning"
/>

// Preset helpers for common use cases
<BodyConditionHelper bodyCondition={7} dogName="Max" />
<WeightGoalHelper
  dogName="Max"
  currentWeight={85}
  targetWeight={75}
  weightUnit="lb"
  goal="lose"
/>
<AllergenImpactHelper
  dogName="Max"
  selectedAllergens={["chicken"]}
  availableRecipes={4}
  totalRecipes={8}
/>
<ServingSizeHelper
  dogName="Max"
  dailyCalories={1200}
  gramsPerDay={750}
  mealsPerDay={2}
/>
```

**Where to Use:**
- Step 1: Body condition guidance
- Step 2: Weight goal validation
- Step 3: Allergen impact
- Step 5: Serving size explanation

---

### 2. **ConfidenceVisualization** (`confidence-visualization.tsx`)

Beautiful, interactive confidence breakdown showing exactly how AI calculated recommendations.

**Features:**
- Animated progress bar with color-coded confidence levels
- Top contributing factors (expandable)
- Full breakdown dialog with all scoring details
- Factors grouped by category (age, activity, weight, health, breed, etc.)

**Usage:**
```tsx
import { ConfidenceVisualization, ConfidenceBadge, ConfidenceProgressBar } from './confidence-visualization'

// Full visualization (used in AI recommendation card)
<ConfidenceVisualization
  confidence={87}
  confidenceBreakdown={recommendation.confidenceBreakdown}
  factorsConsidered={recommendation.factorsConsidered}
/>

// Compact badge for inline use
<ConfidenceBadge confidence={87} />

// Simple progress bar
<ConfidenceProgressBar confidence={87} />
```

**Confidence Levels:**
- **Very High** (85%+): 🟢 Emerald - "Excellent match based on comprehensive profile data"
- **High** (70-84%): 🔵 Blue - "Strong match with good profile information"
- **Moderate** (55-69%): 🟡 Amber - "Good recommendation, but more data could help refine"
- **Needs More Info** (<55%): ⚫ Slate - "Limited data available - add more details"

---

### 3. **Enhanced AIRecommendationCard** (`ai-recommendation-card.tsx`)

Fully upgraded recommendation card with transparency and engagement features.

**New Features:**
- ✅ Edge case warnings (extreme weight goals, multiple allergens)
- ✅ Confidence visualization with detailed breakdown
- ✅ "Why This Recommendation" section with LLM explanation (when enabled)
- ✅ Missing data notices ("Could Improve Confidence")
- ✅ Alternative recommendations (expandable, shows 2-3 other options)
- ✅ Enhanced recipe cards with more nutritional info

**Usage:**
```tsx
import { AIRecommendationCard } from './ai-recommendation-card'

<AIRecommendationCard
  recommendation={aiRecommendation}
  onSelectRecipe={(recipeId) => handleSelectRecipe(recipeId)}
  selectedRecipe={selectedRecipeId}
/>
```

**What Users See:**
1. **Confidence Score**: Big, clear percentage with visual progress bar
2. **Edge Case Warnings**: Amber alerts for important considerations
3. **Why Explanation**: Science-based reasoning in conversational language
4. **Missing Data**: Suggestions for improving confidence
5. **Top Factors**: What contributed most to this recommendation
6. **Alternatives**: Other viable options with explanations

---

### 4. **AILiveFeedback** (`ai-live-feedback.tsx`)

Real-time AI insights that update as users adjust inputs (debounced for performance).

**Features:**
- Debounced updates (500ms default, configurable)
- Different feedback types (body-condition, weight-goal, activity, general)
- "AI thinking" animation
- Auto-generated insights based on current data

**Usage:**
```tsx
import { AILiveFeedback, LiveConfidenceIndicator } from './ai-live-feedback'

// In Step 1 (next to body condition slider)
<AILiveFeedback
  dogProfile={dogProfile}
  feedbackType="body-condition"
  debounceMs={500}
/>

// In Step 2 (weight goal section)
<AILiveFeedback
  dogProfile={dogProfile}
  feedbackType="weight-goal"
/>

// Live confidence indicator (shows improvement as user adds data)
<LiveConfidenceIndicator dogProfile={dogProfile} />
```

**Feedback Types:**
- `body-condition`: Adjusts based on score (underweight, ideal, overweight)
- `weight-goal`: Validates goal and provides timeline
- `activity`: Recommends recipe type based on activity level
- `general`: Shows overall AI confidence and suggestions

---

### 5. **AIStepGuidance** (`ai-step-guidance.tsx`)

Step-by-step wizard guidance showing progress and encouragement.

**Features:**
- Per-step personalized messages
- Progress emojis
- Dynamic content based on entered data
- Progress breadcrumbs showing completed steps
- Profile completeness indicator

**Usage:**
```tsx
import { AIStepGuidance, AIProgressBreadcrumbs, AIEncouragement } from './ai-step-guidance'

// Add to wizard layout above each step
<AIStepGuidance
  step={currentStep}
  dogProfile={dogProfile}
/>

// Progress breadcrumbs (shows which steps are complete)
<AIProgressBreadcrumbs
  currentStep={4}
  completedSteps={[1, 2, 3]}
/>

// Encouragement message (shows profile completeness)
<AIEncouragement dogProfile={dogProfile} />
```

**Step Messages:**
- **Step 1**: "Let's build {dogName}'s nutrition profile!"
- **Step 2**: "Great! {dogName} is 5 years old and weighs 85 lb. Now let's set health goals..."
- **Step 3**: "Perfect! With {dogName}'s lose weight goal, I'll filter out ingredients they're sensitive to."
- **Step 4**: "Based on everything you've told me, here are my top recommendations!"
- **Step 5**: "Excellent choice! Now I'll calculate perfect portion sizes..."
- **Step 6**: "Almost done! Let's add any extras to {dogName}'s plan."

---

### 6. **Loading States** (`ai-loading-skeleton.tsx`)

Professional loading states for AI operations.

**Components:**
- `AIRecommendationSkeleton`: Full card skeleton with pulsing animation
- `AIThinking`: Inline "AI is thinking..." indicator
- `ConfidenceBreakdownSkeleton`: Skeleton for confidence section
- `FactorListSkeleton`: Skeleton for factor grid
- `AlternativeRecommendationsSkeleton`: Skeleton for alternatives
- `ShimmerEffect`: Reusable shimmer animation
- `PulsingDots`: Three pulsing dots

**Usage:**
```tsx
import {
  AIRecommendationSkeleton,
  AIThinking,
  ConfidenceBreakdownSkeleton
} from './ai-loading-skeleton'

// While loading AI recommendations
{isLoadingAI ? (
  <AIRecommendationSkeleton />
) : (
  <AIRecommendationCard ... />
)}

// Inline thinking indicator
<AIThinking message="Calculating portions..." />

// In sections
{isLoading ? <ConfidenceBreakdownSkeleton /> : <ConfidenceVisualization ... />}
```

---

## Integration Examples

### Example 1: Enhanced Step 2 (Health Goals)

```tsx
import { Step2HealthGoals } from './step-2-health-goals'
import { AILiveFeedback } from './ai-live-feedback'
import { WeightGoalHelper } from './ai-inline-helper'

export function EnhancedStep2({ dogProfile, onUpdate }) {
  return (
    <div className="space-y-6">
      <Step2HealthGoals ... />

      {/* AI live feedback for weight goal */}
      {dogProfile.healthGoals?.weightGoal && (
        <AILiveFeedback
          dogProfile={dogProfile}
          feedbackType="weight-goal"
        />
      )}

      {/* Inline helper for validation */}
      {dogProfile.healthGoals?.targetWeight && (
        <WeightGoalHelper
          dogName={dogProfile.name}
          currentWeight={dogProfile.weight}
          targetWeight={dogProfile.healthGoals.targetWeight}
          weightUnit={dogProfile.weightUnit}
          goal={dogProfile.healthGoals.weightGoal}
        />
      )}
    </div>
  )
}
```

### Example 2: Enhanced Recipe Selection (Step 4)

```tsx
import { AIRecommendationCard } from './ai-recommendation-card'
import { generateAIMealRecommendations } from '@/lib/ai-meal-recommendations'
import { AIRecommendationSkeleton } from './ai-loading-skeleton'

export function EnhancedStep4({ dogProfile, onSelectRecipe, selectedRecipe }) {
  const [isGenerating, setIsGenerating] = useState(true)
  const [recommendation, setRecommendation] = useState(null)

  useEffect(() => {
    setIsGenerating(true)

    // Generate AI recommendations
    const recommendations = generateAIMealRecommendations([dogProfile])

    setRecommendation(recommendations[0])
    setIsGenerating(false)
  }, [dogProfile])

  return (
    <div>
      {isGenerating ? (
        <AIRecommendationSkeleton />
      ) : (
        <AIRecommendationCard
          recommendation={recommendation}
          onSelectRecipe={onSelectRecipe}
          selectedRecipe={selectedRecipe}
        />
      )}
    </div>
  )
}
```

### Example 3: Enhanced Wizard Layout

```tsx
import { WizardLayout } from './wizard-layout'
import { AIStepGuidance, AIProgressBreadcrumbs } from './ai-step-guidance'

export function EnhancedWizard({ currentStep, dogProfile, completedSteps }) {
  return (
    <div className="space-y-6">
      {/* Progress breadcrumbs */}
      <AIProgressBreadcrumbs
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step guidance */}
      <AIStepGuidance
        step={currentStep}
        dogProfile={dogProfile}
      />

      {/* Step content */}
      <WizardLayout step={currentStep} ... />
    </div>
  )
}
```

---

## Styling & Theming

All components use:
- **Tailwind CSS** for styling
- **shadcn/ui** components as base
- **Consistent color scheme**:
  - Primary: Blue (`blue-600`)
  - Success: Emerald (`emerald-600`)
  - Warning: Amber (`amber-600`)
  - Error: Red (`red-600`)
  - AI accent: Indigo (`indigo-600`)

**Gradient backgrounds:**
- AI cards: `from-blue-50 to-indigo-50`
- Success: `from-emerald-50 to-teal-50`
- Warning: `from-amber-50 to-orange-50`

---

## Performance Considerations

1. **Debouncing**: AILiveFeedback debounces by 500ms (configurable)
2. **Lazy Loading**: Use skeletons while generating recommendations
3. **Memoization**: Consider memoizing recommendation generation
4. **LocalStorage**: Dismissed helpers are remembered (prevents re-showing)
5. **Optimistic Updates**: Never block user input

---

## Accessibility

All components include:
- ✅ Proper ARIA labels
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader friendly text
- ✅ Sufficient color contrast

---

## Testing

Test the components:

```bash
# Visit the test page
http://localhost:3000/test-ai

# Or test in plan builder
http://localhost:3000/plan-builder/create
```

---

## Next Steps (Phase 3)

- [ ] Add transparency dashboard
- [ ] Create confidence explanation modal
- [ ] Add science citations
- [ ] Implement "What If" scenarios
- [ ] Build multi-dog AI guide

---

## Support

Questions? Check:
- `/lib/ai/README.md` - Foundation documentation
- `/Users/dylancohen/.claude/plans/fizzy-watching-robin.md` - Full implementation plan
- Test page: `http://localhost:3000/test-ai`

Phase 2 Status: **COMPLETE** ✨
