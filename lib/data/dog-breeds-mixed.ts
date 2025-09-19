// lib/data/dog-breeds-mixed.ts
export type BreedOption = { value: string; label: string };
export type BreedAlias = { alias: string; canonical: string };

export const MIXED_AND_DESIGNER_BREEDS: BreedOption[] = [
  // --- Poodle mixes (most common) ---
  { value: "Cavapoo", label: "Cavapoo (Cavalier x Poodle)" },
  { value: "Cockapoo", label: "Cockapoo (Cocker Spaniel x Poodle)" },
  { value: "Goldendoodle", label: "Goldendoodle (Golden Retriever x Poodle)" },
  { value: "Labradoodle", label: "Labradoodle (Labrador x Poodle)" },
  { value: "Aussiedoodle", label: "Aussiedoodle (Australian Shepherd x Poodle)" },
  { value: "Bernedoodle", label: "Bernedoodle (Bernese Mountain Dog x Poodle)" },
  { value: "Sheepadoodle", label: "Sheepadoodle (Old English Sheepdog x Poodle)" },
  { value: "Maltipoo", label: "Maltipoo (Maltese x Poodle)" },
  { value: "Schnoodle", label: "Schnoodle (Schnauzer x Poodle)" },
  { value: "Yorkipoo", label: "Yorkipoo (Yorkshire Terrier x Poodle)" },
  { value: "Whoodle", label: "Whoodle (Soft Coated Wheaten Terrier x Poodle)" },
  { value: "Huskydoodle", label: "Huskydoodle (Siberian Husky x Poodle)" },
  { value: "Pyredoodle", label: "Pyredoodle (Great Pyrenees x Poodle)" },
  { value: "Boxerdoodle", label: "Boxerdoodle (Boxer x Poodle)" },
  { value: "Dalmadoodle", label: "Dalmadoodle (Dalmatian x Poodle)" },
  { value: "Bordoodle", label: "Bordoodle (Border Collie x Poodle)" },
  { value: "Springerdoodle", label: "Springerdoodle (Springer Spaniel x Poodle)" },
  { value: "Poochon", label: "Poochon (Bichon Frisé x Poodle)" },
  { value: "Shih-Poo", label: "Shih-Poo (Shih Tzu x Poodle)" },
  { value: "Chipoo", label: "Chipoo (Chihuahua x Poodle)" },
  { value: "Pomapoo", label: "Pomapoo (Pomeranian x Poodle)" },
  { value: "Corgipoo", label: "Corgipoo (Corgi x Poodle)" },

  // --- "Doodle" variants / doubles ---
  { value: "Double Doodle", label: "Double Doodle (Goldendoodle x Labradoodle)" },
  { value: "Mini Goldendoodle", label: "Mini Goldendoodle" },
  { value: "Mini Labradoodle", label: "Mini Labradoodle" },
  { value: "Mini Bernedoodle", label: "Mini Bernedoodle" },

  // --- Other very common designer crosses ---
  { value: "Puggle", label: "Puggle (Pug x Beagle)" },
  { value: "Morkie", label: "Morkie (Maltese x Yorkshire Terrier)" },
  { value: "Pomsky", label: "Pomsky (Pomeranian x Husky)" },
  { value: "Chug", label: "Chug (Chihuahua x Pug)" },
  { value: "Jug", label: "Jug (Jack Russell x Pug)" },
  { value: "Cavachon", label: "Cavachon (Cavalier x Bichon Frisé)" },
  { value: "Cavapom", label: "Cavapom (Cavalier x Pomeranian)" },
  { value: "Cavador", label: "Cavador (Cavalier x Labrador)" },
  { value: "Chiweenie", label: "Chiweenie (Chihuahua x Dachshund)" },
  { value: "Dorkie", label: "Dorkie (Dachshund x Yorkie)" },
  { value: "Doxle", label: "Doxle (Dachshund x Beagle)" },
  { value: "Pitsky", label: "Pitsky (Pit Bull x Husky)" },
  { value: "Pitador", label: "Pitador / Labrabull (Pit Bull x Labrador)" },
  { value: "Shepsky", label: "Shepsky (German Shepherd x Husky)" },
  { value: "Goberian", label: "Goberian (Golden Retriever x Husky)" },
  { value: "German Sheprador", label: "German Sheprador (GSD x Labrador)" },
  { value: "Beagador", label: "Beagador (Beagle x Labrador)" },
  { value: "Boxador", label: "Boxador (Boxer x Labrador)" },
  { value: "Bullmatian", label: "Bullmatian (Bulldog x Dalmatian)" },
  { value: "Bullboxer", label: "Bullboxer (Boxer x Bulldog)" },
  { value: "Frenchton", label: "Frenchton (French Bulldog x Boston Terrier)" },
  { value: "Pekapoo", label: "Pekapoo (Pekingese x Poodle)" },
  { value: "Jackapoo", label: "Jackapoo (Jack Russell x Poodle)" },
  { value: "Corgi Husky", label: "Horgi / Siborgi (Corgi x Husky)" },
  { value: "Corgi German Shepherd", label: "Corman Shepherd (Corgi x GSD)" },
  { value: "Cocker Spaniel Beagle", label: "Bocker (Beagle x Cocker Spaniel)" },

  // --- Landrace / village types & common shelter labels ---
  { value: "Potcake", label: "Potcake (Caribbean Island Dog)" },
  { value: "Indian Pariah Dog", label: "Indian Pariah / INDog" },
  { value: "Bali Dog", label: "Bali Dog" },
  { value: "Thai Ridgeback Mix", label: "Thai Ridgeback Mix" },
  { value: "Korean Village Dog", label: "Korean Village Dog" },
  { value: "African Village Dog", label: "African Village Dog" },
  { value: "Street Dog (Mixed)", label: "Street Dog (Mixed)" },
  { value: "Mixed Breed (Small)", label: "Mixed Breed (Small)" },
  { value: "Mixed Breed (Medium)", label: "Mixed Breed (Medium)" },
  { value: "Mixed Breed (Large)", label: "Mixed Breed (Large)" },
];

export const BREED_ALIASES: BreedAlias[] = [
  // canonicalization & common spellings
  { alias: "cava poo", canonical: "Cavapoo" },
  { alias: "cava-poo", canonical: "Cavapoo" },
  { alias: "cavoodle", canonical: "Cavapoo" },

  { alias: "cocka poo", canonical: "Cockapoo" },
  { alias: "cocka-poo", canonical: "Cockapoo" },

  { alias: "golden doodle", canonical: "Goldendoodle" },
  { alias: "golden-doodle", canonical: "Goldendoodle" },
  { alias: "mini golden doodle", canonical: "Mini Goldendoodle" },

  { alias: "labra doodle", canonical: "Labradoodle" },
  { alias: "labra-doodle", canonical: "Labradoodle" },
  { alias: "mini labradoodle", canonical: "Mini Labradoodle" },

  { alias: "berne doodle", canonical: "Bernedoodle" },
  { alias: "berne-doodle", canonical: "Bernedoodle" },
  { alias: "mini bernedoodle", canonical: "Mini Bernedoodle" },

  { alias: "sheepa doodle", canonical: "Sheepadoodle" },
  { alias: "sheepa-doodle", canonical: "Sheepadoodle" },

  { alias: "poo chon", canonical: "Poochon" },
  { alias: "bichpoo", canonical: "Poochon" },

  { alias: "shi poo", canonical: "Shih-Poo" },
  { alias: "shipoo", canonical: "Shih-Poo" },

  { alias: "whoodle", canonical: "Whoodle" },

  { alias: "pom sky", canonical: "Pomsky" },

  { alias: "german shepherd husky", canonical: "Shepsky" },
  { alias: "gsd husky", canonical: "Shepsky" },

  { alias: "german shepherd lab", canonical: "German Sheprador" },
  { alias: "gsd lab", canonical: "German Sheprador" },

  { alias: "lab pit", canonical: "Pitador" },
  { alias: "labrabull", canonical: "Pitador" },

  { alias: "golden retriever husky", canonical: "Goberian" },

  { alias: "horgi", canonical: "Corgi Husky" },
  { alias: "siborgi", canonical: "Corgi Husky" },

  { alias: "bichon poodle", canonical: "Poochon" },

  { alias: "island dog", canonical: "Potcake" },
  { alias: "pot cake", canonical: "Potcake" },

  { alias: "street dog", canonical: "Street Dog (Mixed)" },
  { alias: "mutt", canonical: "Mixed Breed (Medium)" },
];

export function canonicalizeBreed(input: string): string {
  const t = input.trim().toLowerCase();
  const hit = BREED_ALIASES.find(a => a.alias.toLowerCase() === t);
  return hit ? hit.canonical : input.trim();
}
