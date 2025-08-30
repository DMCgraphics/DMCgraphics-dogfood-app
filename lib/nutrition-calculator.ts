// Nutritional calculation utilities for NouriPet
export interface DogProfile {
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

// Calculate Resting Energy Requirement (RER)
export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75)
}

// Calculate Daily Energy Requirement (DER)
export function calculateDER(rer: number, profile: DogProfile): number {
  let factor = 1.4 // default moderate activity

  if (profile.activity === "low") factor = 1.2
  if (profile.activity === "high") factor = 1.6

  // Adjust for life stage
  if (profile.lifeStage === "puppy") {
    if (profile.age < 4) factor = 3.0
    else if (profile.age < 12) factor = 2.0
    else factor = 1.8
  }

  // Adjust for body condition
  if (profile.bodyCondition <= 3) factor *= 1.1 // underweight
  if (profile.bodyCondition >= 7) factor *= 0.9 // overweight

  // Adjust for neutering status
  if (profile.isNeutered) factor *= 0.95

  return rer * factor
}

// Convert weight to kg
export function convertToKg(weight: number, unit: "lb" | "kg"): number {
  return unit === "lb" ? weight * 0.453592 : weight
}

// Calculate daily food amount in grams
export function calculateDailyGrams(der: number, kcalPer100g: number): number {
  return (der / kcalPer100g) * 100
}

// Calculate EPA+DHA target (rough guideline: ~90mg per 10lb body weight)
export function calculateEPADHATarget(weightKg: number): number {
  const weightLb = weightKg * 2.20462
  return (weightLb / 10) * 90
}

// Mock data
export const mockRecipes: Recipe[] = [
  {
    id: "chicken-greens",
    name: "Chicken & Greens",
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
    allergens: ["chicken"],
    aafcoLifeStage: "all",
    sourcing: [
      "Responsibly raised poultry sourced through Mosner Family Brands",
      "Hudson Valley Organic - Rhinebeck, NY",
    ],
    sustainabilityScore: 92,
    comingSoon: true,
  },
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
    id: "lamb-pumpkin-quinoa",
    name: "Lamb & Pumpkin Quinoa",
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
