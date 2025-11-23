/**
 * Create NouriPet Topper Products in Stripe
 *
 * This script creates topper subscription products in Stripe.
 * Run it twice - once for sandbox and once for production.
 *
 * Usage:
 *   # For sandbox (test mode):
 *   STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-topper-products.js
 *
 *   # For production (live mode):
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/create-topper-products.js
 */

const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('ERROR: STRIPE_SECRET_KEY environment variable is required');
  console.log('\nUsage:');
  console.log('  STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-topper-products.js');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

// Determine if we're in test or live mode
const isTestMode = stripeKey.startsWith('sk_test_');
console.log(`\n🔑 Running in ${isTestMode ? 'TEST (sandbox)' : 'LIVE (production)'} mode\n`);

const topperProducts = [
  { name: "Small Topper 25% – Bi-Weekly", size: "Small", topper_level: "25%", price_cents: 650 },
  { name: "Small Topper 50% – Bi-Weekly", size: "Small", topper_level: "50%", price_cents: 1300 },
  { name: "Small Topper 75% – Bi-Weekly", size: "Small", topper_level: "75%", price_cents: 1950 },
  { name: "Medium Topper 25% – Bi-Weekly", size: "Medium", topper_level: "25%", price_cents: 1050 },
  { name: "Medium Topper 50% – Bi-Weekly", size: "Medium", topper_level: "50%", price_cents: 2100 },
  { name: "Medium Topper 75% – Bi-Weekly", size: "Medium", topper_level: "75%", price_cents: 3150 },
  { name: "Large Topper 25% – Bi-Weekly", size: "Large", topper_level: "25%", price_cents: 1550 },
  { name: "Large Topper 50% – Bi-Weekly", size: "Large", topper_level: "50%", price_cents: 3100 },
  { name: "Large Topper 75% – Bi-Weekly", size: "Large", topper_level: "75%", price_cents: 4650 },
  { name: "XL Topper 25% – Bi-Weekly", size: "XL", topper_level: "25%", price_cents: 1950 },
  { name: "XL Topper 50% – Bi-Weekly", size: "XL", topper_level: "50%", price_cents: 3900 },
  { name: "XL Topper 75% – Bi-Weekly", size: "XL", topper_level: "75%", price_cents: 5850 },
];

async function createTopperProducts() {
  const createdProducts = [];

  for (const topper of topperProducts) {
    try {
      console.log(`Creating product: ${topper.name}...`);

      // Create the product
      const product = await stripe.products.create({
        name: topper.name,
        description: `${topper.topper_level} topper subscription for ${topper.size} dogs, billed every 2 weeks`,
        metadata: {
          size: topper.size,
          topper_level: topper.topper_level,
          billing_interval: "bi-weekly",
          product_type: "topper_subscription"
        }
      });

      // Create the recurring price (bi-weekly = every 2 weeks)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: topper.price_cents,
        currency: 'usd',
        recurring: {
          interval: 'week',
          interval_count: 2  // Bi-weekly
        },
        metadata: {
          size: topper.size,
          topper_level: topper.topper_level
        }
      });

      createdProducts.push({
        name: topper.name,
        size: topper.size,
        topper_level: topper.topper_level,
        price_usd: `$${(topper.price_cents / 100).toFixed(2)}`,
        product_id: product.id,
        price_id: price.id
      });

      console.log(`  ✅ Created: ${topper.name}`);
      console.log(`     Product ID: ${product.id}`);
      console.log(`     Price ID: ${price.id}`);
      console.log(`     Price: $${(topper.price_cents / 100).toFixed(2)} every 2 weeks\n`);

    } catch (error) {
      console.error(`  ❌ Error creating ${topper.name}:`, error.message);
    }
  }

  // Output summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY - Copy these price IDs to your code:');
  console.log('='.repeat(80) + '\n');

  // Group by size for easy reading
  const sizes = ['Small', 'Medium', 'Large', 'XL'];
  for (const size of sizes) {
    console.log(`// ${size} Dog Topper Plans`);
    const sizeProducts = createdProducts.filter(p => p.size === size);
    for (const p of sizeProducts) {
      console.log(`"${p.topper_level.replace('%', '')}": "${p.price_id}", // ${p.price_usd}/2 weeks`);
    }
    console.log('');
  }

  // Output as JSON for easy copy/paste
  console.log('\n// Full JSON configuration:');
  console.log('const topperPriceIds = {');
  for (const size of sizes) {
    console.log(`  "${size.toLowerCase()}": {`);
    const sizeProducts = createdProducts.filter(p => p.size === size);
    for (const p of sizeProducts) {
      const level = p.topper_level.replace('%', '');
      console.log(`    "${level}": "${p.price_id}",`);
    }
    console.log('  },');
  }
  console.log('};');

  return createdProducts;
}

// Run the script
createTopperProducts()
  .then(products => {
    console.log(`\n✅ Successfully created ${products.length} topper products in Stripe ${isTestMode ? '(TEST)' : '(LIVE)'}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
