require('dotenv').config({ path: '.env.local.production' });
const Stripe = require('stripe');
const fs = require('fs');

// Use production Stripe key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Production price IDs from stripe-pricing.ts
const productionPrices = [
  // Beef & Quinoa Harvest
  { priceId: "price_1SKqwA0WbfuHe9kAtFwQJJpC", recipe: "Beef & Quinoa Harvest", size: "Small", weight: "5-20 lbs", amount: "$29.00" },
  { priceId: "price_1SKqxh0WbfuHe9kAqrT9zev1", recipe: "Beef & Quinoa Harvest", size: "Medium", weight: "21-50 lbs", amount: "$47.00" },
  { priceId: "price_1SKr010WbfuHe9kA6ici7Itt", recipe: "Beef & Quinoa Harvest", size: "Large", weight: "51-90 lbs", amount: "$69.00" },
  { priceId: "price_1SKr0U0WbfuHe9kAsrwjzjAt", recipe: "Beef & Quinoa Harvest", size: "XL", weight: "91+ lbs", amount: "$87.00" },

  // Lamb & Pumpkin Feast
  { priceId: "price_1SKr0w0WbfuHe9kAa0hxVCHK", recipe: "Lamb & Pumpkin Feast", size: "Small", weight: "5-20 lbs", amount: "$29.00" },
  { priceId: "price_1SKr1T0WbfuHe9kA6LiBOgO3", recipe: "Lamb & Pumpkin Feast", size: "Medium", weight: "21-50 lbs", amount: "$47.00" },
  { priceId: "price_1SKr1q0WbfuHe9kAsCidrsh9", recipe: "Lamb & Pumpkin Feast", size: "Large", weight: "51-90 lbs", amount: "$69.00" },
  { priceId: "price_1SKr2l0WbfuHe9kAAOhmv5qP", recipe: "Lamb & Pumpkin Feast", size: "XL", weight: "91+ lbs", amount: "$87.00" },

  // Chicken & Garden Veggie
  { priceId: "price_1SKr3Y0WbfuHe9kA1wFFHqKw", recipe: "Chicken & Garden Veggie", size: "Small", weight: "5-20 lbs", amount: "$29.00" },
  { priceId: "price_1SKr3x0WbfuHe9kABRfAJ5de", recipe: "Chicken & Garden Veggie", size: "Medium", weight: "21-50 lbs", amount: "$47.00" },
  { priceId: "price_1SKr4a0WbfuHe9kAkiYk2ckP", recipe: "Chicken & Garden Veggie", size: "Large", weight: "51-90 lbs", amount: "$69.00" },
  { priceId: "price_1SKr5Y0WbfuHe9kAn0wsixX6", recipe: "Chicken & Garden Veggie", size: "XL", weight: "91+ lbs", amount: "$87.00" },

  // Turkey & Brown Rice Comfort
  { priceId: "price_1SKr690WbfuHe9kAPmGhPxBD", recipe: "Turkey & Brown Rice Comfort", size: "Small", weight: "5-20 lbs", amount: "$29.00" },
  { priceId: "price_1SKr6o0WbfuHe9kA7xEryQBt", recipe: "Turkey & Brown Rice Comfort", size: "Medium", weight: "21-50 lbs", amount: "$47.00" },
  { priceId: "price_1SKr770WbfuHe9kAZzxskUuo", recipe: "Turkey & Brown Rice Comfort", size: "Large", weight: "51-90 lbs", amount: "$69.00" },
  { priceId: "price_1SKr7r0WbfuHe9kAkBWHICvz", recipe: "Turkey & Brown Rice Comfort", size: "XL", weight: "91+ lbs", amount: "$87.00" },
];

async function fetchProductIds() {
  console.log('Fetching product IDs from Stripe...\n');

  const results = [];

  for (const priceInfo of productionPrices) {
    try {
      const price = await stripe.prices.retrieve(priceInfo.priceId);
      const productId = price.product;

      // Fetch product details to get the name
      const product = await stripe.products.retrieve(productId);

      results.push({
        recipe: priceInfo.recipe,
        size: priceInfo.size,
        weight: priceInfo.weight,
        productId: productId,
        productName: product.name,
        priceId: priceInfo.priceId,
        amount: priceInfo.amount,
        interval: 'week',
      });

      console.log(`✓ ${priceInfo.recipe} - ${priceInfo.size}: ${productId}`);
    } catch (error) {
      console.error(`✗ Error fetching ${priceInfo.priceId}:`, error.message);
      results.push({
        ...priceInfo,
        productId: 'ERROR',
        productName: 'ERROR',
        interval: 'week',
      });
    }
  }

  // Create CSV
  const csv = [
    'Recipe,Size Category,Weight Range,Product ID,Product Name,Price ID,Amount (USD),Interval'
  ];

  results.forEach(r => {
    csv.push(`"${r.recipe}","${r.size}","${r.weight}","${r.productId}","${r.productName}","${r.priceId}","${r.amount}","${r.interval}"`);
  });

  const csvContent = csv.join('\n');
  fs.writeFileSync('stripe-production-products-complete.csv', csvContent);

  console.log('\n✓ CSV file created: stripe-production-products-complete.csv');
  console.log(`Total products: ${results.length}`);
}

fetchProductIds().catch(console.error);
