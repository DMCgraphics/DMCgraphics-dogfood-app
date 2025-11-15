// Script to delete broken/incomplete plans
// This will delete Matza's plan (0 items) and Benito's plan (no subscription)

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local.production' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteBrokenPlans() {
  const brokenPlans = [
    { id: '3d9c2de5-6828-4558-bee1-b07884174f9d', dogName: 'Matza', reason: 'No items, $0 total' },
    { id: 'e16e661b-2db0-4afb-bac1-d41fac07767d', dogName: 'Benito Woofilini', reason: 'No subscription, never completed checkout' }
  ];

  console.log('Deleting broken/incomplete plans...\n');

  for (const plan of brokenPlans) {
    console.log(`Deleting plan for ${plan.dogName} (${plan.id})`);
    console.log(`Reason: ${plan.reason}`);

    try {
      // Delete plan_items first (if any)
      const { error: itemsError } = await supabase
        .from('plan_items')
        .delete()
        .eq('plan_id', plan.id);

      if (itemsError) {
        console.error(`Failed to delete plan_items:`, itemsError);
      } else {
        console.log('✓ Plan items deleted');
      }

      // Delete the plan
      const { error: planError } = await supabase
        .from('plans')
        .delete()
        .eq('id', plan.id);

      if (planError) {
        console.error(`Failed to delete plan:`, planError);
      } else {
        console.log(`✅ Plan for ${plan.dogName} deleted successfully\n`);
      }
    } catch (error) {
      console.error(`Error deleting plan for ${plan.dogName}:`, error);
    }
  }

  console.log('\nDone! User can now create new plans for these dogs.');
}

deleteBrokenPlans();
