# SEO Improvement Plan for NouriPet
**Analysis Date:** December 23, 2025
**Data Period:** November 23 - December 22, 2025 (30 days)

---

## Business Context

**Location:** Stamford, CT
**Target Geography:** Stamford / Fairfield County / Westchester County / Connecticut
**Business Model:** Local fresh dog food delivery service

**Primary Goals:**
1. Subscription signups
2. Local delivery signups
3. Email capture

**Secondary Goals:**
1. Event attendance/signups
2. Educational content engagement
3. Brand trust building
4. SEO traffic growth

**Ideal Customer Profile:**
- Decent household income ($75k+)
- Dog is a picky eater (frustrated with kibble rejection)
- Values convenience of local delivery
- Willing to pay premium for fresh, quality food
- Likely demographic: suburban families, young professionals with dogs

---

## Executive Summary

### Current Performance
- **Total Clicks:** 16 (from Google Search)
- **Total Impressions:** 97
- **Average CTR:** 16.49%
- **Average Position:** 5.5
- **Active Users (GA4):** 133 on homepage
- **Top Converting Page:** Plan Builder (28 users, 372s avg engagement)

### Key Findings
1. ✅ **Strong Brand Presence:** "nouripet" ranks #1 with 58% CTR
2. ⚠️ **Low Organic Visibility:** Only 16 total clicks from search in 30 days
3. ⚠️ **Zero Clicks on High-Intent Pages:** Plan Builder, Recipes, Shop have 0 clicks despite impressions
4. ⚠️ **Missing Long-Tail Keywords:** Only 4 queries tracked, indicating poor keyword coverage
5. ⚠️ **Broken/Duplicate Pages:** `/about` vs `/about-us` showing separately

---

## Critical Issues to Address

### 1. **Low Search Visibility**
**Problem:** Only 97 total impressions across all keywords in 30 days
**Impact:** Missing potential customers actively searching for fresh dog food

**Root Causes:**
- Minimal content pages (only 8 pages indexed)
- Lack of blog/educational content
- Missing local SEO optimization (despite being local-only delivery)
- No long-tail keyword targeting

### 2. **Poor CTR on Non-Brand Pages**
**Problem:** Homepage has 16.88% CTR, /about has 5.08%, all others 0%
**Impact:** Not capturing users who find you in search results

**Root Causes:**
- Missing or generic meta descriptions
- Weak title tags that don't match search intent
- No schema markup to enhance search listings

### 3. **High-Value Pages Getting Zero Traffic**
**Problem:** `/plan-builder`, `/recipes`, `/shop` have impressions but 0 clicks
**Impact:** Missing direct-intent customers ready to buy

---

## Proposed SEO Strategy

### Phase 1: Foundation & Technical SEO (Week 1-2)

#### A. Fix Technical Issues
**Priority: HIGH**

1. **Resolve Duplicate Pages**
   - [ ] 301 redirect `/about-us` to `/about` (or vice versa)
   - [ ] Update internal links to use canonical URL
   - [ ] Add canonical tags to all pages

2. **Implement Schema Markup**
   - [ ] LocalBusiness schema on homepage
   - [ ] Product schema on recipe pages
   - [ ] Recipe schema on recipe detail pages
   - [ ] Organization schema for brand identity
   - [ ] BreadcrumbList schema for navigation

3. **Optimize Meta Tags**
   ```
   Homepage:
   Title: "Fresh Dog Food Delivery Stamford CT & Fairfield County | NouriPet"
   Description: "Local fresh dog food delivery in Stamford & Fairfield County. Perfect for picky eaters! Vet-formulated, AAFCO-compliant recipes. Same-day delivery available. Start your subscription today!"

   Plan Builder:
   Title: "Custom Dog Meal Plan for Picky Eaters | Free Calculator - NouriPet"
   Description: "Finally, fresh food your picky dog will love! Get personalized recommendations in 2 minutes. AI-powered nutrition based on your dog's needs. Try risk-free in Stamford CT!"

   Recipes:
   Title: "Fresh Dog Food Recipes for Picky Eaters | Human-Grade - NouriPet"
   Description: "Vet-formulated fresh dog food recipes that picky eaters love. Human-grade ingredients, full transparency. Beef, Lamb, Chicken & more. Delivered fresh in Fairfield County!"

   Shop:
   Title: "Subscribe to Fresh Dog Food Delivery CT | NouriPet Subscriptions"
   Description: "Convenient fresh dog food subscriptions in Stamford & Fairfield County. Same-day local delivery. Perfect for picky eaters. Pause, skip, or cancel anytime!"
   ```

4. **Add Sitemap.xml & Robots.txt**
   - [ ] Generate dynamic sitemap including all recipes
   - [ ] Submit to Google Search Console
   - [ ] Add robots.txt with sitemap reference

5. **Implement Open Graph & Twitter Cards**
   - [ ] Add OG tags for better social sharing
   - [ ] Include recipe images for rich previews

**Files to Create/Modify:**
- `/app/layout.tsx` - Add global schema
- `/app/page.tsx` - Homepage meta tags
- `/app/plan-builder/page.tsx` - Plan builder meta
- `/app/recipes/page.tsx` - Recipes meta
- `/app/recipes/[slug]/page.tsx` - Recipe detail meta + schema
- `/app/sitemap.ts` - Dynamic sitemap
- `/public/robots.txt` - Robots file

#### B. Page Speed Optimization
**Current Issue:** No Core Web Vitals data in report

- [ ] Run Lighthouse audit
- [ ] Optimize hero video on homepage (lazy load, smaller format)
- [ ] Implement image optimization (Next.js Image component)
- [ ] Add preloading for critical assets
- [ ] Review and minimize JavaScript bundle size

---

### Phase 2: Content Strategy (Week 2-4)

#### A. Create SEO-Optimized Blog
**Goal:** Target long-tail keywords and establish authority

**High-Priority Blog Posts:**
1. **"Fresh Dog Food for Picky Eaters: Complete Guide [2025]"** ⭐ PRIORITY #1
   - Target: "dog food for picky eaters" (12,100 searches/mo)
   - Address main customer pain point
   - Include success stories and tips
   - CTA: Email sign-up for free picky eater guide

2. **"Why Your Dog Won't Eat Kibble (And What to Do About It)"** ⭐ PRIORITY #2
   - Target: "dog won't eat kibble" (8,100 searches/mo)
   - Position fresh food as solution
   - CTA: Try sample pack, subscribe

3. **"Fresh Dog Food Delivery in Stamford CT & Fairfield County"** ⭐ PRIORITY #3
   - Target local searches
   - Highlight convenience and same-day delivery
   - Include delivery areas map
   - CTA: Check if we deliver to your area (email capture)

4. "How Much Fresh Dog Food to Feed Your Dog: Complete Calculator Guide"
   - Target: "how much fresh dog food to feed" (1,300 searches/mo)
   - Include interactive calculator
   - CTA: Get personalized plan

5. "Fresh Dog Food vs Kibble: Why Picky Dogs Prefer Fresh"
   - Target: "fresh dog food vs kibble" (880 searches/mo)
   - Focus on palatability for picky eaters
   - CTA: Subscribe to trial plan

6. "Best Fresh Dog Food for [Breed] in Connecticut [2025]"
   - Create for: Golden Retrievers, Labs, German Shepherds, French Bulldogs
   - Target: "best dog food for golden retriever" (14,800 searches/mo)
   - Add local angle (available in CT)

7. "Dog Food for Sensitive Stomachs: Fresh vs Processed"
   - Target: "dog food for sensitive stomach" (33,100 searches/mo)
   - Position as solution for digestive issues
   - CTA: Email capture for feeding guide

8. "Local Dog Events in Fairfield County CT [Monthly Guide]"
   - Build community engagement
   - Target local event searches
   - Promote NouriPet event attendance
   - CTA: Subscribe to event newsletter

9. "Homemade Dog Food Recipes: Veterinary Nutritionist Approved"
   - Target: "homemade dog food recipes" (60,500 searches/mo)
   - Position subscription as convenient alternative
   - CTA: "Too busy? Let us do it for you"

**Blog Structure:**
```
/blog/
  /nutrition/
  /recipes/
  /guides/
  /local/westchester/
```

#### B. Expand Recipe Pages
**Current:** 1 recipe page getting impressions (Beef Quinoa Harvest)

- [ ] Create comprehensive recipe pages for all offerings
- [ ] Add "Why This Recipe" section targeting health conditions
- [ ] Include comparison tables (vs kibble, vs other fresh foods)
- [ ] Add customer reviews/testimonials
- [ ] Create recipe-specific FAQs

**Recipe Page SEO Elements:**
```
Title Pattern: "[Protein] Dog Food Recipe | [Key Benefit] - NouriPet"
Example: "Fresh Lamb & Pumpkin Dog Food | Weight Management - NouriPet"

Sections to Include:
- Nutritional breakdown table
- Ingredient sourcing details
- Health benefits by dog profile
- Feeding guide
- Customer reviews
- Related recipes
- FAQ section
```

#### C. Local SEO Content
**Goal:** Dominate Stamford, Fairfield County & Westchester searches

**Location Pages to Create:**
- [ ] /delivery/stamford-ct (primary market)
- [ ] /delivery/fairfield-county-ct
- [ ] /delivery/westchester-county-ny
- [ ] /delivery/norwalk-ct
- [ ] /delivery/darien-ct
- [ ] /delivery/greenwich-ct
- [ ] /delivery/new-canaan-ct
- [ ] /delivery/westport-ct

**Each Location Page Should Include:**
- Delivery areas/zip codes
- Same-day delivery availability
- Local testimonials
- "Check if we deliver to you" email capture form
- Local dog parks and pet resources
- Community event calendar

**Local SEO Tactics:**
- [ ] Add "Areas We Serve" interactive map on homepage
- [ ] Create Google Business Profile (Category: Pet Food & Supplies)
  - Add all delivery zones
  - Post weekly updates (recipes, events, testimonials)
  - Collect customer reviews (incentivize with discount)
  - Add local photos (Stamford locations, deliveries)

- [ ] Get listed in local directories:
  - Yelp (Pet Services - Stamford, CT)
  - Nextdoor Business (Fairfield County)
  - Stamford Chamber of Commerce
  - Fairfield County business directories
  - Pet-specific directories (BringFido, Rover, etc.)
  - Connecticut pet blogs and publications

- [ ] Local Link Building:
  - Partner with Stamford/Fairfield County dog trainers
  - Sponsor local dog events (Woofstock, charity walks)
  - Collaborate with CT pet rescues and shelters
  - Get featured in CT Insider, Stamford Advocate, Fairfield County Magazine

---

### Phase 3: Keyword Targeting & Optimization (Week 3-5)

#### A. Primary Keyword Opportunities

**High Commercial Intent (Target First):**
| Keyword | Monthly Searches | Difficulty | Priority |
|---------|-----------------|------------|----------|
| dog food for sensitive stomach | 33,100 | Medium | ⭐ HIGHEST |
| dog food for picky eaters | 12,100 | Medium | ⭐ HIGHEST |
| fresh dog food delivery | 8,100 | Medium | HIGH |
| dog won't eat kibble | 8,100 | Low | HIGH |
| best food for picky dogs | 6,600 | Low | HIGH |
| fresh dog food near me | 6,600 | Medium | HIGH |
| best fresh dog food | 5,400 | Medium | HIGH |
| dog food for picky dogs | 4,400 | Low | HIGH |
| fresh pet dog food alternative | 3,600 | Low | HIGH |
| personalized dog food | 1,900 | Low | HIGH |
| custom dog food | 2,400 | Medium | HIGH |
| dog meal delivery | 1,600 | Medium | MEDIUM |
| fresh dog food subscription | 1,300 | Low | HIGH |

**Local Keywords (Critical for Local Business):**
| Keyword | Estimated Searches | Priority |
|---------|-------------------|----------|
| dog food delivery stamford ct | 20-50 | ⭐ HIGHEST |
| dog food delivery fairfield county | 20-50 | ⭐ HIGHEST |
| fresh dog food connecticut | 100-200 | HIGH |
| dog food delivery westchester ny | 50-100 | HIGH |
| pet food delivery near me | 5,400 | HIGH |
| dog food delivery ct | 100-200 | HIGH |
| fresh dog food stamford | 10-30 | MEDIUM |

**Informational (Blog Content):**
| Keyword | Monthly Searches | Priority |
|---------|-----------------|----------|
| how much to feed dog | 22,200 | HIGH |
| dog nutrition calculator | 14,800 | HIGH |
| best dog food for [breed] | 100k+ combined | HIGH |
| homemade dog food recipes | 60,500 | MEDIUM |
| aafco dog food | 2,900 | MEDIUM |

#### B. On-Page Optimization Checklist

**For Each Major Page:**
- [ ] Primary keyword in H1
- [ ] Primary keyword in first 100 words
- [ ] Secondary keywords in H2/H3 headings
- [ ] Keyword in URL slug
- [ ] Internal linking to related pages
- [ ] External links to authoritative sources (AAFCO, veterinary sites)
- [ ] Alt text on all images with descriptive keywords
- [ ] 1,500+ words for pillar content pages

---

### Phase 4: Link Building & Authority (Week 4-8)

#### A. Local Link Building
1. **Pet Organizations & Rescues**
   - Partner with local shelters (donation program)
   - Sponsor adoption events
   - Get featured on shelter websites

2. **Local News & Media**
   - Pitch to Westchester Magazine
   - Local news: "Local Startup Brings Fresh Dog Food Revolution"
   - Pet-focused local publications

3. **Veterinary Partnerships**
   - Partner with local vets
   - Get listed on vet websites
   - Create co-marketing content

#### B. Industry Link Building
1. **Pet Industry Publications**
   - Guest post on DogFoodAdvisor, AllAboutDogs, etc.
   - Provide expert quotes for journalists (HARO)

2. **Nutritionist/Vet Authority**
   - Publish whitepapers on dog nutrition
   - Create downloadable nutrition guides
   - Host webinars with your vet nutritionist

#### C. Digital PR
1. **Create Linkable Assets**
   - Interactive Dog Nutrition Calculator (embed code for other sites)
   - Annual "State of Fresh Dog Food" report
   - Ingredient Sourcing Transparency Database

2. **Newsworthy Angles**
   - "First AI-Powered Dog Food Personalization in Westchester"
   - Sustainability story (local ingredients, eco-friendly packaging)
   - Customer success stories (health transformations)

---

### Phase 5: Conversion Rate Optimization (Ongoing)

**Goal:** Improve CTR from search results

#### A. Search Result Optimization
1. **Title Tag Testing**
   - Test emotional triggers: "Your Dog Deserves Fresh"
   - Test numbers: "5-Minute Custom Dog Meal Plan"
   - Test urgency: "Same-Day Delivery Available"

2. **Meta Description Formulas**
   - Problem + Solution + CTA
   - Social Proof + Benefit + CTA
   - Question + Answer + CTA

3. **Rich Snippets**
   - Recipe cards with star ratings
   - FAQ schema on all pages
   - HowTo schema for feeding guides
   - Review snippets (aggregate rating)

#### B. Landing Page Optimization
1. **Plan Builder Improvements**
   - Add testimonials above fold ("My picky eater finally eats!")
   - Show "As seen in" media badges
   - Add trust signals (vet-formulated, AAFCO, local delivery)
   - Progress bar to reduce abandonment
   - Email capture at start: "Save your plan and get picky eater tips"
   - Subscription-focused CTAs throughout

2. **Recipe Pages**
   - Add "Perfect for picky eaters" and "Gentle on sensitive stomachs" callouts
   - Include comparison tables (vs kibble)
   - Sample meal photos
   - Customer testimonials (focus on eating issues solved)
   - Vet endorsements
   - Email capture: "Get free feeding guide for [recipe name]"

3. **Email Capture Strategy** ⭐ PRIMARY GOAL
   - **Homepage:** Pop-up after 30 seconds - "Is your dog a picky eater? Get our free guide!"
   - **Exit Intent:** "Check if we deliver to your area" (zip code capture)
   - **Blog Posts:** Content upgrade - "Download complete picky eater guide"
   - **Plan Builder:** Save plan progress (requires email)
   - **Recipe Pages:** "Get recipe sample menu" email gate
   - **Events Page:** "Subscribe to local dog event calendar"

   **Lead Magnets to Create:**
   - Free Picky Eater Guide PDF
   - Sensitive Stomach Feeding Chart
   - Fresh Food Transition Guide
   - Local Dog Events Calendar
   - Free Trial Sample Pack offer (with email)

4. **Subscription Conversion Optimization**
   - Highlight convenience ("Never worry about running out")
   - Show cost savings vs one-time purchase
   - Add social proof (# of local subscribers)
   - Emphasize flexibility (pause, skip, cancel)
   - Offer trial period (first week discounted)
   - Add urgency ("Limited delivery slots in [city]")

---

## Implementation Timeline

### Month 1: Foundation
**Week 1-2:**
- ✅ Fix technical SEO issues
- ✅ Implement schema markup
- ✅ Optimize meta tags for top 5 pages
- ✅ Create sitemap & submit to GSC
- ✅ Set up Google Business Profile

**Week 3-4:**
- ✅ Launch blog section
- ✅ Publish first 3 high-priority blog posts
- ✅ Optimize all recipe pages
- ✅ Create local landing pages

### Month 2: Content Expansion
**Week 5-6:**
- ✅ Publish 4 more blog posts
- ✅ Create breed-specific guides
- ✅ Build interactive calculator
- ✅ Start local link building outreach

**Week 7-8:**
- ✅ Launch linkable assets
- ✅ Begin PR outreach
- ✅ Partner with 3 local organizations
- ✅ Optimize for featured snippets

### Month 3: Scale & Refine
**Week 9-12:**
- ✅ Publish 2 blog posts per week
- ✅ Expand to 20+ recipe pages
- ✅ Continue link building
- ✅ Monitor rankings & adjust strategy

---

## Key Performance Indicators (KPIs)

### Month 1 Goals:
**Traffic:**
- [ ] Increase organic impressions to 500+
- [ ] Achieve 50+ organic clicks
- [ ] 10+ clicks on Plan Builder from SEO

**Conversions (Primary Goals):**
- [ ] 25+ email captures from SEO traffic
- [ ] 5+ subscription signups from organic search
- [ ] 10+ local delivery signups

**SEO Rankings:**
- [ ] Rank in top 10 for "dog food delivery stamford ct"
- [ ] Rank in top 20 for "dog food for picky eaters"
- [ ] Get 5+ backlinks from local sites

### Month 3 Goals:
**Traffic:**
- [ ] 2,000+ organic impressions per month
- [ ] 100+ organic clicks per month
- [ ] 20+ Plan Builder sessions from SEO

**Conversions (Primary Goals):**
- [ ] 100+ email captures from SEO traffic
- [ ] 20+ subscription signups from organic
- [ ] 30+ local delivery signups

**SEO Rankings:**
- [ ] Rank #1 for "dog food delivery stamford ct"
- [ ] Rank in top 5 for "fresh dog food fairfield county"
- [ ] 20+ ranking keywords in top 10
- [ ] 15+ quality backlinks

### Month 6 Goals:
**Traffic:**
- [ ] 10,000+ organic impressions per month
- [ ] 500+ organic clicks per month
- [ ] 100+ Plan Builder sessions from SEO

**Conversions (Primary Goals):**
- [ ] 300+ email captures from SEO traffic
- [ ] 50+ subscription signups from organic
- [ ] 100+ local delivery signups
- [ ] 10+ event signups from SEO

**SEO Rankings:**
- [ ] Rank #1 for all local keywords
- [ ] Rank in top 5 for "dog food for picky eaters"
- [ ] Rank in top 5 for "dog food for sensitive stomach"
- [ ] 50+ ranking keywords in top 10
- [ ] 50+ backlinks from DA 30+ sites

**Revenue Attribution:**
- [ ] Track $10,000+ in subscription revenue from organic search
- [ ] Calculate customer acquisition cost (CAC) from SEO
- [ ] Measure lifetime value (LTV) of SEO-acquired subscribers

---

## Quick Wins (Implement This Week)

### 1. Fix Homepage Meta Tags
**Current:** Likely generic or missing
**New:**
```html
<title>Fresh Dog Food Delivery Stamford CT | Perfect for Picky Eaters - NouriPet</title>
<meta name="description" content="Fresh dog food for picky eaters & sensitive stomachs. Local delivery in Stamford & Fairfield County. Vet-formulated, same-day delivery. Start your subscription today!" />
```

### 2. Add LocalBusiness Schema to Homepage
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "NouriPet",
  "description": "Fresh dog food delivery service in Stamford CT and Fairfield County. Perfect for picky eaters and sensitive stomachs.",
  "url": "https://www.nouripet.net",
  "telephone": "(203) 208-6186",
  "email": "support@nouripet.net",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Stamford",
    "addressRegion": "CT",
    "postalCode": "06901",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "41.0534",
    "longitude": "-73.5387"
  },
  "areaServed": [
    {
      "@type": "City",
      "name": "Stamford",
      "containedIn": "CT"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Fairfield County",
      "containedIn": "CT"
    },
    {
      "@type": "AdministrativeArea",
      "name": "Westchester County",
      "containedIn": "NY"
    }
  ],
  "servesCuisine": "Pet Food",
  "priceRange": "$$",
  "paymentAccepted": "Credit Card, Debit Card",
  "openingHours": "Mo-Fr 09:00-18:00"
}
```

### 3. Create Google Business Profile
- Category: Pet Food & Supplies
- Service Area: List all delivery zip codes
- Add photos of products
- Post first update

### 4. Fix /about-us Duplicate
- Decide on canonical URL
- Implement 301 redirect
- Update all internal links

### 5. Add FAQ Schema to Homepage
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How is fresh dog food better than kibble?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Fresh dog food retains more nutrients..."
      }
    }
    // Add 5-10 FAQs
  ]
}
```

---

## Tools & Resources Needed

### SEO Tools:
- Google Search Console (already set up)
- Google Analytics 4 (already set up)
- **Recommended additions:**
  - Ahrefs or Semrush (keyword research & backlink monitoring)
  - Screaming Frog (technical audits)
  - Google PageSpeed Insights (performance)

### Content Creation:
- Copywriter with pet industry experience
- Photographer for recipe shots
- Graphic designer for infographics

### Development:
- Next.js developer (implement schema, meta tags)
- Time estimate: 20-30 hours for Phase 1

---

## Budget Recommendations

### Minimum (DIY Approach): $500/month
- Ahrefs/Semrush: $99/month
- Content writer (2 posts/month): $400
- Link outreach: Time investment

### Recommended: $2,000-3,000/month
- SEO tools: $200/month
- Content creation: $1,500/month (4-6 posts)
- Link building: $500/month
- Development: $500/month (ongoing optimization)

### Aggressive Growth: $5,000+/month
- Full content team
- Professional link building agency
- Paid promotion of content
- Conversion optimization testing

---

## Competitive Analysis

### Competitors to Monitor:
1. **The Farmer's Dog** - Major player, study their content strategy
2. **Ollie** - Strong blog, local SEO
3. **Nom Nom** - Excellent educational content
4. **Spot & Tango** - Good recipe page optimization
5. **Fresh Pet** (retail competitor)

### Competitive Advantages to Emphasize:
- ✅ **Perfect for picky eaters** - highly palatable fresh food
- ✅ **Gentle on sensitive stomachs** - fresh, easily digestible ingredients
- ✅ **Convenient local delivery** - same-day delivery in Stamford/Fairfield County
- ✅ AI-powered personalization (unique differentiator)
- ✅ Complete transparency (ingredients, sourcing)
- ✅ Vet nutritionist formulated
- ✅ AAFCO compliance
- ✅ Flexible subscriptions (pause, skip, cancel anytime)
- ✅ No long-term commitment required

---

## Risk Mitigation

### Potential Challenges:
1. **Limited Local Market** - Focus on dominating local SEO first
2. **Competitive Industry** - Differentiate with transparency & personalization
3. **Resource Constraints** - Start with quick wins, scale gradually
4. **Google Algorithm Changes** - Focus on quality content, not tricks

---

## Next Steps

1. **Review & Approve Plan** - Stakeholder alignment
2. **Prioritize Phases** - Budget & resource allocation
3. **Assign Owners** - Who implements what
4. **Set Up Tracking** - Weekly SEO dashboard
5. **Begin Phase 1** - Technical foundation first

**Estimated Time to See Results:**
- Quick wins (better CTR): 2-4 weeks
- Ranking improvements: 2-3 months
- Significant traffic increase: 4-6 months
- Authority establishment: 6-12 months

---

## Questions for Stakeholders

1. **Budget:** What is the monthly budget for SEO efforts? (Recommended: $2,000-3,000 to start)

2. **Resources:** Do you have in-house resources for content creation, or should we budget for writers?

3. **Partnerships:** Are there any local partnerships already in place (vets, trainers, rescues, events)?

4. **Delivery Areas:** What are the specific delivery zip codes in Stamford, Fairfield County, and Westchester? (Critical for local SEO)

5. **Content Assets:**
   - Do you have high-quality product photos for recipe pages?
   - Can we get photos of actual deliveries/customers in Stamford?
   - Any before/after stories of picky eaters/sensitive stomach success?

6. **Social Proof:**
   - Do you have customer testimonials specifically about picky eaters or sensitive stomachs?
   - Can we incentivize reviews (discount for Google review)?
   - Average customer rating?

7. **Events:** What local events do you currently attend or plan to sponsor?

8. **Email Marketing:** Is there an email marketing tool set up to nurture captured leads?

9. **Conversion Tracking:** Is GA4 properly tracking email signups and subscription conversions?

10. **Competitive Intel:** Who do you consider your main local competitors?

11. **Sample Program:** Do you currently offer trial/sample packs for new customers?

12. **Geographic Priority:** Which areas should we prioritize? (Stamford > Fairfield County > Westchester?)

---

**Document Owner:** Dylan Cohen
**Last Updated:** December 23, 2025
**Next Review:** January 15, 2026
