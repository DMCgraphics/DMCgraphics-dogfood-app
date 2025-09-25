// lib/data/dog-breeds.ts
import { dogBreeds } from "@/lib/nutrition-calculator";
import { MIXED_AND_DESIGNER_BREEDS, type BreedOption } from "./dog-breeds-mixed";

// Convert the existing dogBreeds array to BreedOption format
export const AKC_BREEDS: BreedOption[] = dogBreeds?.map(breed => ({
  value: breed.toLowerCase().replace(/\s+/g, "-"),
  label: breed,
})) || [];

// Merge AKC breeds with mixed/designer breeds and deduplicate
export const ALL_BREEDS: BreedOption[] = [
  ...AKC_BREEDS,
  ...MIXED_AND_DESIGNER_BREEDS,
].filter((breed, index, arr) => 
  arr.findIndex(b => b.value === breed.value) === index
);

// Debug logging
console.log('ALL_BREEDS loaded:', ALL_BREEDS.length, 'breeds');
console.log('AKC_BREEDS:', AKC_BREEDS.length, 'breeds');
console.log('MIXED_AND_DESIGNER_BREEDS:', MIXED_AND_DESIGNER_BREEDS.length, 'breeds');

// Re-export for convenience
export { MIXED_AND_DESIGNER_BREEDS };
export type { BreedOption } from "./dog-breeds-mixed";
