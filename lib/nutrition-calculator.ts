// Nutritional calculation utilities for NouriPet
export interface DogProfile {
  name?: string
  weight: number
  weightUnit: "lb" | "kg"
  age: number
  ageUnit: "months" | "years"
  sex: "male" | "female"
  breed: string
  activity: "low" | "moderate" | "high"
  bodyCondition: number // 1-9 scale
  isNeutered: boolean
  lifeStage: "puppy" | "adult" | "senior"
}

export interface HealthGoals {
  weightManagement: boolean
  skinCoat: boolean
  joints: boolean
  digestiveHealth: boolean
  notes: string
  stoolScore: number // 1-7 scale
  targetWeight?: number
  weightGoal?: "lose" | "gain" | "maintain"
}

export interface Recipe {
  id: string
  name: string
  kcalPer100g: number
  protein: number // percentage
  fat: number // percentage
  carbs: number // percentage
  fiber: number // percentage
  moisture: number // percentage
  calcium: number // mg per 100g
  phosphorus: number // mg per 100g
  epa: number // mg per 100g
  dha: number // mg per 100g
  allergens: string[]
  aafcoLifeStage: "adult" | "growth" | "all"
  sourcing: string[]
  sustainabilityScore: number
  comingSoon?: boolean
}

export interface AddOn {
  id: string
  name: string
  type: "fish-oil" | "probiotic" | "joint"
  epaPerMl?: number
  dhaPerMl?: number
  cfuPerServing?: number
  glucosaminePerServing?: number
  pricePerMonth: number
}

// --- Canonical calorie math ---
// Convert weight to kg
export function toKg(weight: number, unit: "lb" | "kg"): number {
  return unit === "lb" ? weight * 0.45359237 : weight
}

// Resting Energy Requirement
export function calculateRER(weightKg: number): number {
  // RER = 70 * (kg^0.75)
  return 70 * Math.pow(weightKg, 0.75)
}

// Daily Energy Requirement (adult maintenance baseline)
export function calculateDERFromProfile(profile: DogProfile): number {
  const kg = toKg(profile.weight, profile.weightUnit)
  const rer = calculateRER(kg)

  // Baseline factors:
  // - Adult, neutered, moderate activity: 1.6 × RER
  // - Adult, intact: 1.8 × RER (optionally)
  // - Low activity: 1.3–1.4 × RER
  // - High activity: 1.8–2.0 × RER
  let factor = 1.6 // default: adult, neutered, moderate

  // Activity adjustments
  if (profile.activity === "low") factor = 1.35
  if (profile.activity === "high") factor = 1.9

  // Life stage
  if (profile.lifeStage === "puppy") {
    // (Simplified) younger puppies need much more than adults
    factor = profile.age < 4 ? 3.0 : profile.age < 12 ? 2.0 : 1.8
  } else if (profile.lifeStage === "senior") {
    // Seniors might trend a touch lower
    factor = Math.max(1.3, factor - 0.1)
  }

  // Optional: intact status bumps factor slightly
  if (!profile.isNeutered && profile.lifeStage === "adult") {
    factor = Math.max(factor, 1.8)
  }

  // Body condition nudges
  if (profile.bodyCondition <= 3) factor *= 1.1 // underweight
  if (profile.bodyCondition >= 7) factor *= 0.9 // overweight

  return rer * factor
}

// Given DER and recipe density, compute grams/day
export function calculateDailyGrams(derKcal: number, kcalPer100g: number): number {
  return (derKcal / kcalPer100g) * 100
}

// Legacy function for backward compatibility
export function convertToKg(weight: number, unit: "lb" | "kg"): number {
  return toKg(weight, unit)
}

// Legacy function for backward compatibility
export function calculateDER(rer: number, profile: DogProfile): number {
  return calculateDERFromProfile(profile)
}

// Calculate EPA+DHA target (rough guideline: ~90mg per 10lb body weight)
export function calculateEPADHATarget(weightKg: number): number {
  const weightLb = weightKg * 2.20462
  return (weightLb / 10) * 90
}

// Mock data
export const mockRecipes: Recipe[] = [
  {
    id: "beef-quinoa-harvest",
    name: "Beef & Quinoa Harvest",
    kcalPer100g: 175,
    protein: 48,
    fat: 16,
    carbs: 22,
    fiber: 7,
    moisture: 7,
    calcium: 1150,
    phosphorus: 880,
    epa: 180,
    dha: 120,
    allergens: ["beef"],
    aafcoLifeStage: "adult",
    sourcing: [
      "Grass-fed beef sourced through Mosner Family Brands",
      "Connecticut Valley Grains - Middletown, CT",
      "Premium Oils Processing - Stamford, CT",
    ],
    sustainabilityScore: 90,
  },
  {
    id: "lamb-pumpkin-feast",
    name: "Lamb & Pumpkin Feast",
    kcalPer100g: 170,
    protein: 46,
    fat: 15,
    carbs: 24,
    fiber: 8,
    moisture: 7,
    calcium: 1150,
    phosphorus: 850,
    epa: 150,
    dha: 100,
    allergens: ["lamb"],
    aafcoLifeStage: "adult",
    sourcing: [
      "Pasture-raised lamb sourced through Mosner Family Brands",
      "Connecticut Valley Grains (Quinoa) - CT",
      "Local Pumpkin Growers - Fairfield County, CT",
    ],
    sustainabilityScore: 91,
  },
  {
    id: "low-fat-chicken-garden-veggie",
    name: "Low-Fat Chicken & Garden Veggie",
    kcalPer100g: 165,
    protein: 45,
    fat: 15,
    carbs: 25,
    fiber: 8,
    moisture: 7,
    calcium: 1200,
    phosphorus: 900,
    epa: 50,
    dha: 80,
    allergens: ["chicken", "egg"],
    aafcoLifeStage: "all",
    sourcing: [
      "Responsibly raised poultry sourced through Mosner Family Brands",
      "Hudson Valley Organic - Rhinebeck, NY",
    ],
    sustainabilityScore: 92,
  },
  {
    id: "turkey-brown-rice-comfort",
    name: "Turkey & Brown Rice Comfort",
    kcalPer100g: 168,
    protein: 47,
    fat: 14,
    carbs: 26,
    fiber: 7,
    moisture: 6,
    calcium: 1180,
    phosphorus: 870,
    epa: 160,
    dha: 110,
    allergens: ["turkey"],
    aafcoLifeStage: "adult",
    sourcing: [
      "Lean turkey sourced through Mosner Family Brands",
      "Connecticut Valley Grains - Middletown, CT",
      "Premium Oils Processing - Stamford, CT",
    ],
    sustainabilityScore: 89,
  },
]

export const mockAddOns: AddOn[] = [
  {
    id: "probiotic",
    name: "Digestive Health Probiotic",
    type: "probiotic",
    cfuPerServing: 2000000000, // 2 billion CFU
    pricePerMonth: 19.99,
  },
  {
    id: "joint-blend",
    name: "Joint Support Blend",
    type: "joint",
    glucosaminePerServing: 500,
    pricePerMonth: 29.99,
  },
]

export const commonAllergens = [
  "chicken",
  "beef",
  "turkey",
  "lamb",
  "fish",
  "eggs",
  "dairy",
  "wheat",
  "corn",
  "soy",
  "rice",
  "potatoes",
]

export const dogBreeds = [
  "Mixed Breed",
  "Affenpinscher",
  "Afghan Hound",
  "Airedale Terrier",
  "Akbash",
  "Akita",
  "Alaskan Malamute",
  "American Bulldog",
  "American Eskimo Dog",
  "American Foxhound",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "Anatolian Shepherd",
  "Australian Cattle Dog",
  "Australian Shepherd",
  "Australian Terrier",
  "Basenji",
  "Basset Hound",
  "Beagle",
  "Bearded Collie",
  "Bernese Mountain Dog",
  "Bichon Frise",
  "Black and Tan Coonhound",
  "Bloodhound",
  "Border Collie",
  "Border Terrier",
  "Boston Terrier",
  "Bouvier des Flandres",
  "Boxer",
  "Briard",
  "Brittany",
  "Brussels Griffon",
  "Bull Terrier",
  "Bulldog",
  "Bullmastiff",
  "Cairn Terrier",
  "Cane Corso",
  "Cardigan Welsh Corgi",
  "Cavalier King Charles Spaniel",
  "Chesapeake Bay Retriever",
  "Chihuahua",
  "Chinese Crested",
  "Chinese Shar-Pei",
  "Chow Chow",
  "Cocker Spaniel",
  "Collie",
  "Coonhound",
  "Corgi",
  "Dachshund",
  "Dalmatian",
  "Doberman Pinscher",
  "English Bulldog",
  "English Cocker Spaniel",
  "English Setter",
  "English Springer Spaniel",
  "Fox Terrier",
  "French Bulldog",
  "German Shepherd",
  "German Shorthaired Pointer",
  "German Wirehaired Pointer",
  "Giant Schnauzer",
  "Golden Retriever",
  "Great Dane",
  "Great Pyrenees",
  "Greyhound",
  "Havanese",
  "Irish Setter",
  "Irish Wolfhound",
  "Italian Greyhound",
  "Jack Russell Terrier",
  "Japanese Chin",
  "Keeshond",
  "Kerry Blue Terrier",
  "Labrador Retriever",
  "Lakeland Terrier",
  "Lhasa Apso",
  "Maltese",
  "Manchester Terrier",
  "Mastiff",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Newfoundland",
  "Norfolk Terrier",
  "Norwegian Elkhound",
  "Norwich Terrier",
  "Old English Sheepdog",
  "Papillon",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Pointer",
  "Pomeranian",
  "Poodle",
  "Portuguese Water Dog",
  "Pug",
  "Rhodesian Ridgeback",
  "Rottweiler",
  "Saint Bernard",
  "Saluki",
  "Samoyed",
  "Schipperke",
  "Scottish Terrier",
  "Sealyham Terrier",
  "Shetland Sheepdog",
  "Shih Tzu",
  "Siberian Husky",
  "Silky Terrier",
  "Skye Terrier",
  "Smooth Fox Terrier",
  "Soft Coated Wheaten Terrier",
  "Staffordshire Bull Terrier",
  "Standard Schnauzer",
  "Vizsla",
  "Weimaraner",
  "Welsh Springer Spaniel",
  "Welsh Terrier",
  "West Highland White Terrier",
  "Whippet",
  "Wire Fox Terrier",
  "Yorkshire Terrier",
  "Other",
]
