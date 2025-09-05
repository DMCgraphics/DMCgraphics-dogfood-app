// Map daily grams → pack size + number of packs per day
export function getPackPortion(dailyGrams: number) {
  // Define your standard pack sizes
  const packSizes = [200, 300, 400, 500] // grams

  // Find the closest pack size that minimizes leftover waste
  let bestPack = packSizes[0]
  let bestRatio = Number.POSITIVE_INFINITY

  for (const size of packSizes) {
    const packsPerDay = Math.ceil(dailyGrams / size)
    const total = packsPerDay * size
    const leftover = total - dailyGrams
    const ratio = leftover / size
    if (ratio < bestRatio) {
      bestRatio = ratio
      bestPack = size
    }
  }

  const packsPerDay = Math.ceil(dailyGrams / bestPack)
  const packsPerMonth = packsPerDay * 30

  return {
    packSize: bestPack, // grams per pack
    packsPerDay,
    packsPerMonth,
    gramsPerDay: dailyGrams,
  }
}
