const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSampleData() {
  try {
    console.log('Adding sample data for testing recommendations...')
    
    // First, get the first user and their first dog
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('No users found. Please create a user account first.')
      return
    }
    
    const userId = users[0].id
    console.log('Using user ID:', userId)
    
    // Get the first dog for this user
    const { data: dogs, error: dogsError } = await supabase
      .from('dogs')
      .select('id, name')
      .eq('user_id', userId)
      .limit(1)
    
    if (dogsError) {
      console.error('Error fetching dogs:', dogsError)
      return
    }
    
    if (!dogs || dogs.length === 0) {
      console.log('No dogs found for user. Please add a dog first.')
      return
    }
    
    const dogId = dogs[0].id
    const dogName = dogs[0].name
    console.log('Using dog:', dogName, 'ID:', dogId)
    
    // Add sample weight logs (last 30 days with weight gain trend)
    const weightLogs = []
    const baseWeight = 18 // Starting weight in lbs
    const today = new Date()
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Simulate weight gain trend (+0.1 lbs every 3 days)
      const weightGain = Math.floor(i / 3) * 0.1
      const weight = baseWeight + weightGain
      
      weightLogs.push({
        user_id: userId,
        dog_id: dogId,
        date: date.toISOString().split('T')[0],
        weight: weight,
        notes: `Sample weight log for ${dogName}`
      })
    }
    
    console.log('Adding weight logs...')
    const { error: weightError } = await supabase
      .from('weight_logs')
      .insert(weightLogs)
    
    if (weightError) {
      console.error('Error adding weight logs:', weightError)
    } else {
      console.log('✅ Added', weightLogs.length, 'weight logs')
    }
    
    // Add sample stool logs (last 14 days with some firm stools)
    const stoolLogs = []
    const stoolScores = [2, 2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 2, 4, 3] // Mix of firm (2) and normal (3-4)
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      stoolLogs.push({
        user_id: userId,
        dog_id: dogId,
        date: date.toISOString().split('T')[0],
        score: stoolScores[i],
        notes: `Sample stool log for ${dogName}`
      })
    }
    
    console.log('Adding stool logs...')
    const { error: stoolError } = await supabase
      .from('stool_logs')
      .insert(stoolLogs)
    
    if (stoolError) {
      console.error('Error adding stool logs:', stoolError)
    } else {
      console.log('✅ Added', stoolLogs.length, 'stool logs')
    }
    
    // Add a sample plan
    const samplePlan = {
      user_id: userId,
      dog_id: dogId,
      status: 'active',
      plan_data: {
        weightGoal: 'maintain',
        kcalPerDay: 800,
        mealsPerDay: 2,
        recipe: 'Beef + Quinoa Harvest'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Adding sample plan...')
    const { error: planError } = await supabase
      .from('plans')
      .upsert(samplePlan, { onConflict: 'user_id,dog_id' })
    
    if (planError) {
      console.error('Error adding plan:', planError)
    } else {
      console.log('✅ Added sample plan')
    }
    
    console.log('🎉 Sample data added successfully!')
    console.log('You should now see recommendations on the dashboard for:', dogName)
    
  } catch (error) {
    console.error('Error adding sample data:', error)
  }
}

addSampleData()
