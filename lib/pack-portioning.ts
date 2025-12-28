// Map daily grams → pack size + number of packs per day
export function getPackPortion(dailyGrams: number) {
  // Use 12oz (340g) packs to match batch planning
  // 12 oz * 28.3495 g/oz = 340.194g ≈ 340g
  const packSize = 340 // grams per 12oz pack

  const packsPerDay = Math.ceil(dailyGrams / packSize)
  const packsPerMonth = packsPerDay * 30

  return {
    packSize: packSize, // grams per pack (12 oz)
    packsPerDay,
    packsPerMonth,
    gramsPerDay: dailyGrams,
  }
}
