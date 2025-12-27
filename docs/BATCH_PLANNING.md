# NouriPet Batch Planning System

## Overview

The Batch Planning system automatically calculates ingredient requirements for upcoming production batches based on active customer subscriptions. It pulls real-time data from your subscription database and generates detailed shopping lists scaled to your actual needs.

## Accessing Batch Planning

1. Log into the Admin portal
2. Navigate to **Operations → Batch Planning** in the sidebar
3. The system will default to the next Thursday (typical cook day)

## Features

### Automatic Calculation
- **Real-time Data**: Pulls from active subscriptions in your database
- **Smart Scaling**: Calculates exact batch quantities needed (50 lb batches)
- **12oz Pack Sizing**: Converts all quantities to 12oz packs
- **10% Buffer**: Includes waste/testing buffer automatically

### Recipe Breakdown
For each recipe, you'll see:
- Total grams needed
- Number of 12oz packs
- Scale factor (multiplier of base batch)
- Number of 50 lb batches to make

### Shopping List
Consolidated ingredients organized by category:
- 🥩 **Proteins**: All meat, organ meats, and eggs
- 🥬 **Vegetables & Fruits**: Frozen veggies, pumpkin, apples
- 🌾 **Grains**: Quinoa, brown rice (cooked weights)
- 🧴 **Oils**: Cod liver oil
- 💊 **Animix Premix**: All vitamin/mineral components

### Timeline Tracking
- **Order By Date**: Automatically set to 2 weeks before cook
- **Delivery By Date**: Set to 2 days before cook
- **Cook Date**: Selectable via calendar

## Using the System

### View a Batch Plan

1. **Select Date**: Click the calendar button to choose your cook date
2. **Review Requirements**: Check the recipe breakdown and totals
3. **View Shopping List**: Scroll down to see consolidated ingredients

### Save a Batch Plan

1. Add any special notes in the Notes section
2. Click **Save Plan** to store in database
3. Saved plans can be retrieved later for reference

### Export Options

- **Print**: Click Print button for a physical copy
- **Export CSV**: Download ingredient list as spreadsheet
  - Includes: Ingredient name, grams, pounds, kilograms, category

## Recipe Base Batches

The system uses these base batch sizes (all 50 lbs):

### Beef & Quinoa Harvest
- Base: 22,696g (50 lbs)
- kcal/kg: 1,146

### Lamb & Pumpkin Feast
- Base: 22,694g (50 lbs)
- kcal/kg: 1,206

### Chicken & Garden Veggie
- Base: 22,700g (50 lbs)
- kcal/kg: 1,100

### Turkey & Brown Rice Comfort
- Base: 22,700g (50 lbs)
- kcal/kg: 1,150

## Caloric Calculation Method

The batch planning system uses the **FEDIAF formula** to calculate each dog's nutritional needs:

### Daily Energy Requirements (FEDIAF)

**Formula**: ME = K × BW(kg)^0.75

Where K varies by activity level:
- **Low activity**: K = 95
- **Moderate activity**: K = 110
- **High activity**: K = 130

### Example Calculation (12oz packs)

**Lulu** - 24 lb (10.886 kg), Moderate activity, Lamb & Pumpkin (1,300 kcal/kg)

1. **Daily calories needed**:
   - 110 × (10.886)^0.75 = 659 kcal/day

2. **Daily food required**:
   - 659 ÷ 1,300 = 0.507 kg/day
   - = 507 g/day
   - = 17.9 oz/day

3. **Biweekly totals (14 days)**:
   - 507g × 14 = 7,098g total
   - = 15.6 lbs every 2 weeks

4. **Converted to 12oz packs**:
   - 7,098g ÷ 340g = 21 packs (biweekly)
   - Daily: ~1.5 packs/day

### Recipe Caloric Densities

Based on James's 50lb batch formulations:
- **Beef & Quinoa Harvest**: 1,146 kcal/kg (114.6 kcal/100g)
- **Lamb & Pumpkin Feast**: 1,206 kcal/kg (120.6 kcal/100g)
- **Chicken & Garden Veggie**: 1,100 kcal/kg (110 kcal/100g)
- **Turkey & Brown Rice Comfort**: 1,150 kcal/kg (115 kcal/100g)

## Important Notes

### Ingredient Weights
- **Grains**: Quinoa and brown rice weights are for **COOKED** amounts
- **Oils**: Weights approximate volume (1g ≈ 1ml)
- **All ingredients**: Include 10% buffer for waste/testing

### Animix Premix
All recipes share the same premix components:
- Calcium Carbonate 38%
- Kelp, Rockweed
- Dicalcium Phosphate
- Sodium Chloride
- Beta Glucans + MOS
- Magnesium Proteinate 10%
- Zinc Proteinate 15%
- Vitamin E 700D
- Manganese Proteinate 15%
- Thiamine Mononitrate B1

Combine these according to your recipe specifications before adding to batches.

### Pack Size
- All calculations now use **12oz (340g)** packs
- Previous variable sizing has been standardized

## Workflow Example

For a cook on **Thursday, January 8, 2025**:

1. **Dec 25, 2024**: Order ingredients (2 weeks before)
2. **Jan 6, 2025**: Ingredients delivered (2 days before)
3. **Jan 8, 2025**: Cook day
4. Pack into 12oz containers immediately after cooking

## Updating Recipe Data

Recipe base batch data is stored in:
```
/lib/batch-planning-config.ts
```

To update:
1. Edit the `RECIPE_BASE_BATCHES` object
2. Update ingredient amounts (in grams)
3. Save file - changes take effect immediately

## Technical Details

### API Endpoint
```
GET /api/admin/batch-planning?date=2025-01-08
POST /api/admin/batch-planning
```

### Database Table
Plans are saved to `batch_schedules` table:
- batch_date
- recipes_planned (jsonb)
- status (upcoming/in_progress/completed/cancelled)
- notes

### Calculation Logic
1. Query active subscriptions from database
2. Sum grams needed per recipe
3. Apply 10% waste buffer
4. Calculate batches (rounded up to whole batches)
5. Multiply base recipe ingredients by batch count
6. Consolidate across all recipes

## Troubleshooting

### No subscriptions showing
- Check that subscriptions have `status = 'active'` or `'purchased'`
- Verify `plan_items` table has recipe associations

### Incorrect ingredient amounts
- Verify recipe base batch data in config file
- Check that ingredient names match exactly

### Missing recipes
- Ensure recipe slug matches between database and config file
- Check `is_active = true` in recipes table

## Future Enhancements

Potential additions:
- Inventory integration
- Automatic vendor ordering
- Batch production tracking
- Cost analysis
- Historical batch comparison

---

**Last Updated**: December 27, 2024
