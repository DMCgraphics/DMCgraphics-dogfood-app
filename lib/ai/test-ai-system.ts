/**
 * Test AI System - Utility for testing the enhanced AI recommendation system
 *
 * Run this in a browser console or create a test page to verify:
 * - Enhanced scoring algorithm with breakdowns
 * - Confidence calculations
 * - Missing data detection
 * - Edge case flagging
 * - Alternative recommendations
 */

import { generateAIMealRecommendations } from '@/lib/ai-meal-recommendations'
import { calculateConfidence } from '@/lib/ai/confidence-calculator'
import { getConfidenceExplanation, getCacheStats } from '@/lib/ai/llm-service'
import type { MultiDogProfile } from '@/lib/multi-dog-types'

/**
 * Test Profile 1: Complete profile with weight loss goal
 */
export const testProfileWeightLoss: MultiDogProfile = {
  id: 'test-1',
  name: 'Max',
  breed: 'Golden Retriever',
  age: 5,
  ageUnit: 'years',
  weight: 85,
  weightUnit: 'lb',
  activity: 'moderate',
  bodyCondition: 7, // Overweight
  sex: 'male',
  isNeutered: true,
  healthGoals: {
    targetWeight: 75,
    weightGoal: 'lose',
    skinCoat: true,
    joints: true,
  },
  selectedAllergens: ['chicken'],
  portions: {
    dailyCalories: 1200,
    gramsPerDay: 750,
    servingsPerDay: 2,
  },
}

/**
 * Test Profile 2: Minimal data (to test missing data detection)
 */
export const testProfileMinimal: MultiDogProfile = {
  id: 'test-2',
  name: 'Bella',
  age: 3,
  ageUnit: 'years',
  weight: 50,
  weightUnit: 'lb',
  activity: 'moderate',
  weightUnit: 'lb',
  ageUnit: 'years',
}

/**
 * Test Profile 3: Extreme weight change (to test edge cases)
 */
export const testProfileExtreme: MultiDogProfile = {
  id: 'test-3',
  name: 'Rocky',
  breed: 'German Shepherd',
  age: 7,
  ageUnit: 'years',
  weight: 100,
  weightUnit: 'lb',
  activity: 'low',
  bodyCondition: 8,
  healthGoals: {
    targetWeight: 75, // 25% weight loss - extreme!
    weightGoal: 'lose',
  },
  selectedAllergens: ['chicken', 'beef', 'lamb'], // Multiple allergens
}

/**
 * Test Profile 4: Puppy growth
 */
export const testProfilePuppy: MultiDogProfile = {
  id: 'test-4',
  name: 'Luna',
  breed: 'Labrador Retriever',
  age: 8,
  ageUnit: 'months',
  weight: 35,
  weightUnit: 'lb',
  activity: 'high',
  bodyCondition: 5,
  healthGoals: {
    targetWeight: 50,
    weightGoal: 'gain',
  },
}

/**
 * Run comprehensive test suite
 */
export function runAITests() {
  console.log('🧪 Testing Enhanced AI Meal Recommendation System\n')
  console.log('=' .repeat(60))

  // Test 1: Weight Loss Profile
  console.log('\n📊 Test 1: Complete Profile with Weight Loss Goal')
  console.log('-'.repeat(60))
  const results1 = generateAIMealRecommendations([testProfileWeightLoss])
  const rec1 = results1[0]

  console.log('✅ Basic Info:')
  console.log(`   Dog: ${rec1.dogName}`)
  console.log(`   Confidence: ${rec1.confidence}%`)
  console.log(`   Recommended Recipes: ${rec1.recommendedRecipes.join(', ')}`)
  console.log(`   Nutritional Focus: ${rec1.nutritionalFocus.join(', ')}`)

  console.log('\n✅ Confidence Breakdown:')
  if (rec1.confidenceBreakdown) {
    console.log(`   Base Score: ${rec1.confidenceBreakdown.baseScore}`)
    console.log(`   Total Score: ${rec1.confidenceBreakdown.totalScore}`)
    console.log(`   Level: ${rec1.confidenceBreakdown.confidenceLevel}`)
    console.log('\n   Top Adjustments:')
    rec1.confidenceBreakdown.adjustments.forEach((adj, i) => {
      console.log(`   ${i + 1}. ${adj.factor}: +${adj.points} pts (${adj.impact} impact)`)
      console.log(`      ${adj.description}`)
    })
  }

  console.log('\n✅ All Factors Considered:')
  rec1.factorsConsidered.forEach((factor, i) => {
    console.log(`   ${i + 1}. [${factor.category}] ${factor.factor}: +${factor.points} pts`)
  })

  console.log('\n✅ Missing Data:')
  if (rec1.missingData && rec1.missingData.length > 0) {
    rec1.missingData.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item}`)
    })
  } else {
    console.log('   None - profile is complete!')
  }

  console.log('\n✅ Edge Cases:')
  if (rec1.edgeCases && rec1.edgeCases.length > 0) {
    rec1.edgeCases.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item}`)
    })
  } else {
    console.log('   None detected')
  }

  console.log('\n✅ Alternative Recommendations:')
  if (rec1.alternativeRecommendations) {
    rec1.alternativeRecommendations.forEach((alt, i) => {
      console.log(`   ${i + 1}. ${alt.recipeName} (${alt.confidence}% confidence)`)
      console.log(`      Why lower: ${alt.differenceFromTop}`)
    })
  }

  // Test 2: Minimal Profile
  console.log('\n\n📊 Test 2: Minimal Profile (Missing Data Detection)')
  console.log('-'.repeat(60))
  const results2 = generateAIMealRecommendations([testProfileMinimal])
  const rec2 = results2[0]

  console.log('✅ Basic Info:')
  console.log(`   Dog: ${rec2.dogName}`)
  console.log(`   Confidence: ${rec2.confidence}%`)

  console.log('\n✅ Missing Data Detected:')
  if (rec2.missingData && rec2.missingData.length > 0) {
    rec2.missingData.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item}`)
    })
  }

  console.log('\n✅ Factors Considered:')
  console.log(`   Total factors: ${rec2.factorsConsidered.length}`)

  // Test 3: Extreme Weight Change
  console.log('\n\n📊 Test 3: Extreme Weight Change (Edge Case Detection)')
  console.log('-'.repeat(60))
  const results3 = generateAIMealRecommendations([testProfileExtreme])
  const rec3 = results3[0]

  console.log('✅ Basic Info:')
  console.log(`   Dog: ${rec3.dogName}`)
  console.log(`   Confidence: ${rec3.confidence}%`)

  console.log('\n✅ Edge Cases Detected:')
  if (rec3.edgeCases && rec3.edgeCases.length > 0) {
    rec3.edgeCases.forEach((item, i) => {
      console.log(`   ${i + 1}. ⚠️  ${item}`)
    })
  }

  // Test 4: Puppy Growth
  console.log('\n\n📊 Test 4: Puppy Growth Profile')
  console.log('-'.repeat(60))
  const results4 = generateAIMealRecommendations([testProfilePuppy])
  const rec4 = results4[0]

  console.log('✅ Basic Info:')
  console.log(`   Dog: ${rec4.dogName}`)
  console.log(`   Confidence: ${rec4.confidence}%`)

  console.log('\n✅ Top Factors:')
  rec4.factorsConsidered.slice(0, 3).forEach((factor, i) => {
    console.log(`   ${i + 1}. ${factor.factor}: +${factor.points} pts`)
    console.log(`      ${factor.description}`)
  })

  // Test Confidence Calculator
  console.log('\n\n📊 Test 5: Confidence Calculator')
  console.log('-'.repeat(60))
  const scores = [95, 87, 72, 55, 45]
  scores.forEach(score => {
    const result = calculateConfidence(score)
    console.log(`   ${score}% → ${result.emoji} ${result.label} (${result.level})`)
    console.log(`      Color: ${result.color}, Description: ${result.description}`)
  })

  console.log('\n\n' + '='.repeat(60))
  console.log('✅ All tests complete!')
  console.log('=' .repeat(60))

  return {
    weightLoss: rec1,
    minimal: rec2,
    extreme: rec3,
    puppy: rec4,
  }
}

/**
 * Test LLM Service (with templates)
 */
export async function testLLMService() {
  console.log('\n🤖 Testing LLM Service\n')
  console.log('=' .repeat(60))

  try {
    // Test confidence explanation
    console.log('\n📝 Test: Confidence Explanation')
    console.log('-'.repeat(60))
    const explanation = await getConfidenceExplanation(
      87,
      'Max',
      [
        { factor: 'Weight Loss Formula', points: 18, description: 'Lower fat + higher fiber' },
        { factor: 'High Activity Energy', points: 12, description: 'Calorie-dense for active lifestyle' },
      ],
      ['Breed information']
    )
    console.log('Response:', explanation)

    // Check cache stats
    console.log('\n📊 Cache Statistics')
    console.log('-'.repeat(60))
    const stats = getCacheStats()
    console.log(`Cache size: ${stats.size} entries`)
    if (stats.entries.length > 0) {
      console.log('Cached items:')
      stats.entries.forEach((entry, i) => {
        console.log(`  ${i + 1}. Age: ${Math.round(entry.age / 1000)}s, Tokens: ${entry.tokensUsed}`)
      })
    } else {
      console.log('No cached items yet')
    }

    console.log('\n✅ LLM Service test complete!')

  } catch (error) {
    console.error('❌ LLM Service error:', error)
  }
}

/**
 * Quick test - just run this in console
 */
export function quickTest() {
  const results = generateAIMealRecommendations([testProfileWeightLoss])
  const rec = results[0]

  console.log(`
🎯 Quick Test Results for ${rec.dogName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Confidence: ${rec.confidence}% ${calculateConfidence(rec.confidence).emoji}
Level: ${rec.confidenceBreakdown?.confidenceLevel}

Top 3 Factors:
${rec.factorsConsidered.slice(0, 3).map((f, i) =>
  `${i + 1}. ${f.factor} (+${f.points} pts)\n   ${f.description}`
).join('\n')}

Missing Data: ${rec.missingData?.length || 0} items
Edge Cases: ${rec.edgeCases?.length || 0} flagged
Alternatives: ${rec.alternativeRecommendations?.length || 0} options

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)

  return rec
}
