# Zipcode Validation Implementation

This document describes the complete zipcode validation system implemented for the checkout process, restricting delivery to Westchester County, NY and Fairfield County, CT.

## Overview

The zipcode validation system provides multiple layers of validation:
1. **Frontend validation** - Real-time user feedback in the ZipGate component
2. **Backend validation** - Server-side validation in checkout APIs
3. **Database validation** - Database constraints and stored zipcode records

## Files Created/Modified

### Database Schema
- `scripts/create-zipcode-validation-schema.sql` - Creates the database schema for zipcode validation
- `scripts/run-zipcode-validation-setup.js` - Script to set up the database schema

### API Endpoints
- `app/api/validate-zipcode/route.ts` - Dedicated zipcode validation endpoint
- `app/api/checkout/session/route.ts` - Updated to store validated zipcode
- `app/api/checkout/route.ts` - Updated to validate and store zipcode

### Testing
- `scripts/test-zipcode-validation.js` - Comprehensive test suite for zipcode validation

## Database Schema

### `allowed_zipcodes` Table
```sql
CREATE TABLE allowed_zipcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zipcode VARCHAR(5) NOT NULL UNIQUE,
  county VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `plans` Table Updates
```sql
ALTER TABLE plans ADD COLUMN delivery_zipcode VARCHAR(5);
ALTER TABLE plans ADD CONSTRAINT plans_delivery_zipcode_allowed 
    CHECK (delivery_zipcode IS NULL OR delivery_zipcode IN (
        SELECT zipcode FROM allowed_zipcodes
    ));
```

## Zipcode Coverage

### Westchester County, NY (69 zipcodes)
- **105xx series**: Armonk, Bedford, Chappaqua, Katonah, Mount Kisco, etc.
- **106xx series**: White Plains, Scarsdale, etc.
- **107xx series**: Yonkers, Hastings-on-Hudson, etc.
- **108xx series**: New Rochelle, etc.

### Fairfield County, CT (56 zipcodes)
- **066xx series**: Bridgeport, Stratford, Trumbull, etc.
- **068xx series**: Norwalk, Greenwich, Darien, Wilton, etc.
- **069xx series**: Stamford, etc.
- **064xx series**: Shelton, etc.
- **067xx series**: New Fairfield, Sherman, etc.

**Total: 125 allowed zipcodes**

## API Endpoints

### POST /api/validate-zipcode
Validates a single zipcode.

**Request:**
```json
{
  "zipcode": "06902"
}
```

**Response:**
```json
{
  "valid": true,
  "zipcode": "06902",
  "message": "Delivery available to this area"
}
```

### GET /api/validate-zipcode?zipcode=06902
Validates a zipcode via query parameter.

### POST /api/checkout/session
Updated to validate zipcode and store it in the database.

**Request:**
```json
{
  "zip": "06902",
  "lineItems": [...],
  "email": "user@example.com"
}
```

## Frontend Integration

The existing `ZipGate` component already provides:
- Real-time zipcode validation
- User-friendly error messages
- Integration with checkout flow

## Setup Instructions

### 1. Run Database Setup
```bash
node scripts/run-zipcode-validation-setup.js
```

### 2. Test the Implementation
```bash
node scripts/test-zipcode-validation.js
```

### 3. Verify in Application
1. Navigate to checkout page
2. Enter valid zipcode (e.g., "06902") - should allow checkout
3. Enter invalid zipcode (e.g., "10001") - should show error message

## Validation Logic

### Zipcode Normalization
The `normalizeZip()` function:
- Trims whitespace
- Extracts the first 5-digit sequence
- Handles zipcode extensions (e.g., "10501-1234" → "10501")
- Returns empty string for invalid input

### Validation Flow
1. User enters zipcode in ZipGate component
2. Frontend validates using `isAllowedZip()`
3. On checkout, backend validates again
4. Valid zipcode is stored in `plans.delivery_zipcode`
5. Database constraint ensures only allowed zipcodes are accepted

## Error Messages

- **Valid zipcode**: "Delivery available to this area"
- **Invalid zipcode**: "We currently deliver only to Westchester County, NY and Fairfield County, CT."

## Security Considerations

1. **Multiple validation layers** prevent bypassing client-side validation
2. **Database constraints** ensure data integrity
3. **Server-side validation** in all checkout APIs
4. **Row Level Security** on allowed_zipcodes table

## Monitoring and Maintenance

### Adding New Zipcodes
1. Update `lib/allowed-zips.ts` with new zipcodes
2. Run database setup script to update `allowed_zipcodes` table
3. Test with new zipcodes

### Monitoring
- Check `plans.delivery_zipcode` field for delivery area analytics
- Monitor checkout failures due to zipcode validation
- Track user feedback on delivery area restrictions

## Testing

The test suite covers:
- ✅ Valid Westchester County zipcodes
- ✅ Valid Fairfield County zipcodes  
- ✅ Invalid zipcodes from other areas
- ✅ Edge cases (extensions, whitespace, invalid input)
- ✅ Normalization function behavior
- ✅ Coverage statistics

Run tests with:
```bash
node scripts/test-zipcode-validation.js
```

## Future Enhancements

1. **Dynamic zipcode management** - Admin interface to add/remove zipcodes
2. **Geographic expansion** - Easy addition of new counties/states
3. **Delivery zone analytics** - Track demand by zipcode
4. **Partial delivery** - Different service levels by area
5. **Address validation** - Integration with USPS API for address verification

## Troubleshooting

### Common Issues

1. **Database constraint errors**
   - Ensure `allowed_zipcodes` table is populated
   - Check that zipcode is in the allowlist

2. **API validation failures**
   - Verify `lib/allowed-zips.ts` is up to date
   - Check that zipcode normalization is working correctly

3. **Frontend validation not working**
   - Ensure ZipGate component is using latest validation functions
   - Check browser console for JavaScript errors

### Debug Commands

```bash
# Test zipcode validation
node scripts/test-zipcode-validation.js

# Check database setup
node scripts/run-zipcode-validation-setup.js

# Verify API endpoints
curl -X POST http://localhost:3000/api/validate-zipcode \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "06902"}'
```
