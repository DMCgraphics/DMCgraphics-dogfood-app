// lib/allowed-zips.ts
// Five-digit ZIP allowlist. Start here and expand as needed.
// WESTCHESTER COUNTY, NY
export const WESTCHESTER_ZIPS = [
  "10501","10502","10504","10505","10506","10507","10510","10511","10514","10518",
  "10520","10522","10523","10526","10527","10528","10530","10532","10533","10535",
  "10536","10538","10540","10543","10545","10546","10547","10548","10549","10552",
  "10553","10560","10562","10566","10567","10570","10573","10576","10577","10580",
  "10583","10588","10589","10590","10591","10594","10595","10596","10597","10598",
  "10601","10603","10604","10605","10606","10607",
  "10701","10703","10704","10705","10706","10707","10708","10709","10710",
  "10801","10803","10804","10805"
];

// FAIRFIELD COUNTY, CT
export const FAIRFIELD_ZIPS = [
  // Bridgeport/Stratford/Trumbull/Easton/Monroe/Shelton
  "06604","06605","06606","06607","06608","06610","06611","06612","06614","06615",
  // Stamford
  "06901","06902","06903","06905","06906","06907",
  // Norwalk/Rowayton
  "06850","06851","06853","06854","06855","06856","06857","06858","06859","06860",
  // Greenwich/Cos Cob/Old Greenwich/Riverside
  "06807","06830","06831","06836","06870","06878",
  // Darien/New Canaan/Wilton/Weston/Westport/Fairfield
  "06820","06840","06880","06881","06883","06884","06888","06890","06897",
  "06824","06825",
  // Ridgefield/Bethel/Danbury/Brookfield/Newtown
  "06804","06810","06811","06812","06813","06814","06877","06470",
  // Redding/Easton/Georgetown (shared)
  "06875","06896","06829",
  // Shelton
  "06484",
  // New Fairfield/Sherman
  "06812","06784"
];

export const ALLOWED_ZIPS = Array.from(new Set([...WESTCHESTER_ZIPS, ...FAIRFIELD_ZIPS]));

export function normalizeZip(input: string) {
  const match = (input || "").trim().match(/\d{5}/);
  return match ? match[0] : "";
}

export function isAllowedZip(zip: string) { 
  return ALLOWED_ZIPS.includes(normalizeZip(zip)); 
}
