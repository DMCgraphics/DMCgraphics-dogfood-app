const Stripe = require('stripe');
const fs = require('fs');
const dotenv = require('dotenv');

// Load test key
const testEnv = dotenv.config({ path: '.env.local.test' });
const testKey = testEnv.parsed?.STRIPE_SECRET_KEY;

// Load production key (need to use override to replace the test key)
const prodEnv = dotenv.config({ path: '.env.local.production' });
const prodKey = prodEnv.parsed?.STRIPE_SECRET_KEY;

console.log('Test key prefix:', testKey?.substring(0, 10) + '...');
console.log('Prod key prefix:', prodKey?.substring(0, 10) + '...');

async function fetchBiweeklyProducts(stripe, mode) {
  console.log(`\nFetching ${mode} mode 2-week interval products...\n`);

  const products = [];

  // Fetch all prices
  const prices = await stripe.prices.list({
    limit: 100,
    active: true,
    type: 'recurring'
  });

  console.log(`Found ${prices.data.length} active recurring prices`);

  // Filter for 2-week interval prices
  for (const price of prices.data) {
    if (price.recurring &&
        price.recurring.interval === 'week' &&
        price.recurring.interval_count === 2) {

      // Fetch the product details
      const product = await stripe.products.retrieve(price.product);

      products.push({
        mode: mode,
        productId: product.id,
        productName: product.name,
        priceId: price.id,
        amountCents: price.unit_amount,
        amountUSD: `$${(price.unit_amount / 100).toFixed(2)}`,
        interval: price.recurring.interval,
        intervalCount: price.recurring.interval_count,
        active: price.active,
        metadata: product.metadata || {}
      });

      console.log(`✓ ${product.name}: ${price.id} - $${(price.unit_amount / 100).toFixed(2)}`);
    }
  }

  return products;
}

async function main() {
  console.log('='.repeat(80));
  console.log('Fetching 2-Week Interval Products from Stripe');
  console.log('='.repeat(80));

  // Fetch from test mode
  const stripeTest = new Stripe(testKey);
  const testProducts = await fetchBiweeklyProducts(stripeTest, 'TEST');

  // Fetch from production mode
  const stripeProd = new Stripe(prodKey);
  const prodProducts = await fetchBiweeklyProducts(stripeProd, 'PRODUCTION');

  // Create CSV for all products
  const allProducts = [...testProducts, ...prodProducts];

  const csv = [
    'Mode,Recipe/Product Name,Size,Weight Range,Product ID,Price ID,Amount (USD),Amount (Cents),Interval,Interval Count'
  ];

  allProducts.forEach(p => {
    // Try to parse size from product name OR from price amount
    let size = '';
    let weightRange = '';

    if (p.productName.includes('Small')) {
      size = 'Small';
      weightRange = '5-20 lbs';
    } else if (p.productName.includes('Medium')) {
      size = 'Medium';
      weightRange = '21-50 lbs';
    } else if (p.productName.includes('Large') && !p.productName.includes('XL')) {
      size = 'Large';
      weightRange = '51-90 lbs';
    } else if (p.productName.includes('XL') || p.productName.includes('Extra Large')) {
      size = 'XL';
      weightRange = '91+ lbs';
    } else {
      // Detect size from price amount (for products with multiple prices)
      switch(p.amountCents) {
        case 5800:
          size = 'Small';
          weightRange = '5-20 lbs';
          break;
        case 9400:
          size = 'Medium';
          weightRange = '21-50 lbs';
          break;
        case 13800:
          size = 'Large';
          weightRange = '51-90 lbs';
          break;
        case 17400:
          size = 'XL';
          weightRange = '91+ lbs';
          break;
        default:
          size = 'Custom';
          weightRange = 'varies';
      }
    }

    csv.push(`"${p.mode}","${p.productName}","${size}","${weightRange}","${p.productId}","${p.priceId}","${p.amountUSD}",${p.amountCents},"${p.interval}",${p.intervalCount}`);
  });

  const csvContent = csv.join('\n');
  fs.writeFileSync('stripe-biweekly-products.csv', csvContent);

  console.log('\n' + '='.repeat(80));
  console.log(`✓ CSV file created: stripe-biweekly-products.csv`);
  console.log(`Total 2-week interval products found:`);
  console.log(`  - TEST mode: ${testProducts.length}`);
  console.log(`  - PRODUCTION mode: ${prodProducts.length}`);
  console.log('='.repeat(80));

  // Create TypeScript format for easy copy-paste into stripe-pricing.ts
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('TypeScript Format for stripe-pricing.ts');
  console.log('='.repeat(80));

  const groupByRecipe = (products) => {
    const grouped = {};
    products.forEach(p => {
      // Extract recipe name (before the size)
      let recipeName = p.productName;
      if (recipeName.includes(' – ')) {
        recipeName = recipeName.split(' – ')[0];
      }

      // Convert to slug format
      const recipeSlug = recipeName.toLowerCase()
        .replace(/&/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      if (!grouped[recipeSlug]) {
        grouped[recipeSlug] = {
          name: recipeName,
          prices: []
        };
      }

      // Add size info based on price for products without it in the name
      let displayName = p.productName;
      if (!displayName.includes('Small') && !displayName.includes('Medium') &&
          !displayName.includes('Large') && !displayName.includes('XL')) {
        // Detect size from price
        let sizeLabel = '';
        switch(p.amountCents) {
          case 5800: sizeLabel = ' – Small (5–20 lbs)'; break;
          case 9400: sizeLabel = ' – Medium (21–50 lbs)'; break;
          case 13800: sizeLabel = ' – Large (51–90 lbs)'; break;
          case 17400: sizeLabel = ' – XL (91+ lbs)'; break;
        }
        displayName += sizeLabel + ' (Every Two Weeks)';
      }

      grouped[recipeSlug].prices.push({
        ...p,
        displayName
      });
    });

    // Sort prices by amount for consistent ordering
    Object.values(grouped).forEach(group => {
      group.prices.sort((a, b) => a.amountCents - b.amountCents);
    });

    return grouped;
  };

  // Production format
  if (prodProducts.length > 0) {
    console.log('\n// PRODUCTION - 2-week interval pricing:');
    console.log('const STRIPE_PRICING_PRODUCTION_BIWEEKLY: Record<string, StripePricing[]> = {');

    const prodGrouped = groupByRecipe(prodProducts);
    Object.entries(prodGrouped).forEach(([slug, data], index, arr) => {
      console.log(`  "${slug}": [`);
      data.prices.forEach((p, i) => {
        console.log(`    {`);
        console.log(`      priceId: "${p.priceId}",`);
        console.log(`      productName: "${p.displayName || p.productName}",`);
        console.log(`      amountCents: ${p.amountCents},`);
        console.log(`      interval: "week",`);
        console.log(`      intervalCount: 2,`);
        console.log(`    }${i < data.prices.length - 1 ? ',' : ''}`);
      });
      console.log(`  }${index < arr.length - 1 ? ',' : ''}`);
    });
    console.log('}');
  }

  // Test format
  if (testProducts.length > 0) {
    console.log('\n// TEST - 2-week interval pricing:');
    console.log('const STRIPE_PRICING_TEST_BIWEEKLY: Record<string, StripePricing[]> = {');

    const testGrouped = groupByRecipe(testProducts);
    Object.entries(testGrouped).forEach(([slug, data], index, arr) => {
      console.log(`  "${slug}": [`);
      data.prices.forEach((p, i) => {
        console.log(`    {`);
        console.log(`      priceId: "${p.priceId}",`);
        console.log(`      productName: "${p.displayName || p.productName}",`);
        console.log(`      amountCents: ${p.amountCents},`);
        console.log(`      interval: "week",`);
        console.log(`      intervalCount: 2,`);
        console.log(`    }${i < data.prices.length - 1 ? ',' : ''}`);
      });
      console.log(`  }${index < arr.length - 1 ? ',' : ''}`);
    });
    console.log('}');
  }

  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
