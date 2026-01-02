import { jsPDF } from "jspdf"
import * as fs from "fs"
import * as path from "path"

/**
 * Generate a beautiful, branded PDF nutrition guide with actual NouriPet logo and imagery
 * Returns base64 encoded PDF string
 */
export function generateNutritionGuidePDF(): string {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // NouriPet brand colors
  const primaryGreen = [39, 101, 25] // #276519
  const brightGreen = [0, 212, 73] // #00d449
  const primaryCyan = [21, 225, 255] // #15e1ff
  const darkColor = [15, 23, 42] // #0f172a
  const mutedColor = [100, 116, 139] // #64748b
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20

  // Load logo and hero image as base64
  let logoBase64 = ""
  let heroImageBase64 = ""

  try {
    const logoPath = path.join(process.cwd(), "public", "nouripet-logo.png")
    const heroPath = path.join(process.cwd(), "public", "hero-puppy-ingredients.png")

    logoBase64 = fs.readFileSync(logoPath).toString("base64")
    heroImageBase64 = fs.readFileSync(heroPath).toString("base64")
  } catch (error) {
    console.error("[PDF] Error loading images:", error)
    // Continue without images if they fail to load
  }

  // Helper functions
  const addHeader = (pageNum: number) => {
    // Header background with gradient effect (simulated with green color)
    doc.setFillColor(39, 101, 25)
    doc.rect(0, 0, pageWidth, 25, "F")

    // Add logo if available
    if (logoBase64) {
      try {
        // Logo dimensions: make it fit nicely in header
        const logoWidth = 40
        const logoHeight = 12
        doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", margin, 6, logoWidth, logoHeight)
      } catch (error) {
        // Fallback to text if image fails
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text("NouriPet", margin, 15)
      }
    } else {
      // Fallback to text logo
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("NouriPet", margin, 15)
    }

    // Page number
    if (pageNum > 1) {
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255)
      doc.text(`Page ${pageNum}`, pageWidth - margin, 15, { align: "right" })
    }
  }

  const addFooter = () => {
    doc.setFontSize(8)
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text(
      "© 2025 NouriPet • support@nouripet.net • (203) 208-6186",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    )
  }

  let yPos = 40

  // PAGE 1: Cover & Introduction
  addHeader(1)

  // Hero dog image on cover page
  yPos = 35
  if (heroImageBase64) {
    try {
      // Add hero image centered at top of page
      const heroWidth = 80
      const heroHeight = 60
      const heroX = (pageWidth - heroWidth) / 2
      doc.addImage(`data:image/png;base64,${heroImageBase64}`, "PNG", heroX, yPos, heroWidth, heroHeight)
      yPos += heroHeight + 10
    } catch (error) {
      console.error("[PDF] Error adding hero image:", error)
      yPos = 50
    }
  } else {
    yPos = 50
  }

  // Title
  doc.setFontSize(28)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.text("Your Free Dog", pageWidth / 2, yPos, { align: "center" })
  yPos += 12
  doc.text("Nutrition Guide", pageWidth / 2, yPos, { align: "center" })

  yPos += 15
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  doc.text("Evidence-based feeding for healthier, happier dogs", pageWidth / 2, yPos, {
    align: "center",
  })

  // Welcome box with green gradient theme
  yPos += 20
  doc.setFillColor(240, 253, 244) // Light green
  doc.rect(margin, yPos, pageWidth - 2 * margin, 40, "F")

  yPos += 8
  doc.setFontSize(11)
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.setFont("helvetica", "bold")
  doc.text("Welcome to better nutrition!", margin + 5, yPos)

  yPos += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
  const welcomeText = [
    "This guide will help you understand what your dog really needs to thrive.",
    "Inside, you'll discover science-backed nutrition tips, portion guidelines,",
    "and how to spot quality ingredients—all explained in plain English.",
  ]
  welcomeText.forEach((line) => {
    doc.text(line, margin + 5, yPos)
    yPos += 6
  })

  // What's Inside box
  yPos += 15
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("What's Inside This Guide:", margin, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const contents = [
    "✓  How to calculate your dog's daily calorie needs",
    "✓  Understanding AAFCO standards and what they mean",
    "✓  Fresh food vs. kibble: the real comparison",
    "✓  Reading ingredient labels like a pro",
    "✓  Portion sizing by weight and activity level",
    "✓  Common nutrition mistakes to avoid",
    "✓  When to consult your veterinarian",
  ]

  contents.forEach((item) => {
    doc.setTextColor(brightGreen[0], brightGreen[1], brightGreen[2])
    doc.text("●", margin + 2, yPos)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(item, margin + 8, yPos)
    yPos += 8
  })

  addFooter()

  // PAGE 2: Understanding Calorie Needs
  doc.addPage()
  addHeader(2)
  yPos = 45

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("1. Understanding Your Dog's Calorie Needs", margin, yPos)

  yPos += 12
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])

  const calorieText = [
    "Every dog is unique. Their calorie needs depend on weight, age, activity level,",
    "and body condition. Here's how to calculate what your dog really needs:",
    "",
    "STEP 1: Calculate Resting Energy Requirement (RER)",
    "Formula: RER = 70 × (body weight in kg)^0.75",
    "",
    "STEP 2: Multiply by Activity Factor",
    "• Inactive/senior dogs: RER × 1.2-1.4",
    "• Normal adult dogs: RER × 1.6-1.8",
    "• Active/working dogs: RER × 2.0-5.0",
    "• Puppies (growing): RER × 2.0-3.0",
    "",
    "Example: A 20kg moderately active adult dog",
    "RER = 70 × (20)^0.75 = 662 calories",
    "Daily needs = 662 × 1.6 = 1,059 calories per day",
  ]

  calorieText.forEach((line) => {
    if (line.startsWith("STEP") || line.startsWith("Example")) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    } else if (line.startsWith("•") || line.startsWith("Formula")) {
      doc.setFont("helvetica", "normal")
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    } else {
      doc.setFont("helvetica", "normal")
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    }
    doc.text(line, margin, yPos)
    yPos += 6
  })

  // Callout box
  yPos += 5
  doc.setFillColor(254, 243, 199) // Yellow tint
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, "F")

  yPos += 8
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(146, 64, 14)
  doc.text("💡 Pro Tip:", margin + 5, yPos)

  yPos += 6
  doc.setFont("helvetica", "normal")
  const tip = [
    "Body condition is just as important as the scale. A lean, muscular dog may need more",
    "calories than an overweight dog of the same size. Check your dog's ribs—you should",
    "be able to feel them easily but not see them prominently.",
  ]
  tip.forEach((line) => {
    doc.text(line, margin + 5, yPos)
    yPos += 5
  })

  addFooter()

  // PAGE 3: AAFCO Standards
  doc.addPage()
  addHeader(3)
  yPos = 45

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("2. Understanding AAFCO Standards", margin, yPos)

  yPos += 12
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])

  const aafcoText = [
    "AAFCO (Association of American Feed Control Officials) sets nutritional standards",
    "for pet food. Here's what you need to know:",
    "",
    "What \"Complete & Balanced\" Really Means:",
    "• Contains all essential nutrients in correct proportions",
    "• Meets minimum requirements for your dog's life stage",
    "• Verified through feeding trials or nutrient analysis",
    "",
    "Life Stage Categories:",
    "• Growth (puppies & pregnant/nursing dogs)",
    "• Adult maintenance",
    "• All life stages",
    "",
    "Key Nutrients AAFCO Regulates:",
    "• Protein (minimum 18% for adults, 22.5% for puppies)",
    "• Fat (minimum 5.5% for adults, 8.5% for puppies)",
    "• Essential vitamins & minerals",
    "• Calcium & phosphorus ratios",
    "",
    "Look for this statement on labels:",
    "\"[Product] is formulated to meet the nutritional levels established by the AAFCO",
    "Dog Food Nutrient Profiles for [life stage]\"",
  ]

  aafcoText.forEach((line) => {
    if (line.includes("What") || line.includes("Life Stage") || line.includes("Key Nutrients") || line.includes("Look for")) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    } else if (line.startsWith("•")) {
      doc.setFont("helvetica", "normal")
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    } else if (line.startsWith("\"")) {
      doc.setFont("helvetica", "italic")
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    } else {
      doc.setFont("helvetica", "normal")
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    }
    doc.text(line, margin, yPos)
    yPos += 6
  })

  addFooter()

  // PAGE 4: Fresh Food vs Kibble
  doc.addPage()
  addHeader(4)
  yPos = 45

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("3. Fresh Food vs. Kibble: The Real Comparison", margin, yPos)

  yPos += 12
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])

  // Comparison table header
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 2, 10, "F")
  doc.rect(margin + (pageWidth - 2 * margin) / 2 + 2, yPos, (pageWidth - 2 * margin) / 2 - 2, 10, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("Fresh Food", margin + 15, yPos + 7)
  doc.text("Kibble", margin + (pageWidth - 2 * margin) / 2 + 15, yPos + 7)

  yPos += 15
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.setFont("helvetica", "normal")

  const comparison = [
    ["Higher moisture (70-80%)", "Low moisture (10%)"],
    ["Minimal processing", "High-heat processing"],
    ["Visible ingredients", "Processed ingredients"],
    ["3x more bioavailable nutrients", "Lower bioavailability"],
    ["Shorter shelf life", "Long shelf life"],
    ["Refrigeration required", "Shelf stable"],
    ["Higher cost per serving", "Lower cost per serving"],
    ["Fresh preparation", "Convenience"],
  ]

  comparison.forEach((row) => {
    doc.setTextColor(brightGreen[0], brightGreen[1], brightGreen[2])
    doc.text("✓", margin + 2, yPos)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(row[0], margin + 8, yPos)

    doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    doc.text("•", margin + (pageWidth - 2 * margin) / 2 + 4, yPos)
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text(row[1], margin + (pageWidth - 2 * margin) / 2 + 10, yPos)

    yPos += 7
  })

  yPos += 5
  doc.setFillColor(240, 249, 255)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, "F")

  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...darkColor)
  doc.text("The Bottom Line:", margin + 5, yPos)

  yPos += 6
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...mutedColor)
  doc.text(
    "Both can be nutritionally complete. Fresh food offers higher digestibility and",
    margin + 5,
    yPos
  )
  yPos += 5
  doc.text("bioavailability, while kibble offers convenience and affordability.", margin + 5, yPos)

  addFooter()

  // PAGE 5: Reading Ingredient Labels
  doc.addPage()
  addHeader(5)
  yPos = 45

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("4. Reading Ingredient Labels Like a Pro", margin, yPos)

  yPos += 12
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])

  const labelText = [
    "Ingredients are listed by weight, from highest to lowest. Here's what to look for:",
    "",
    "What to Look For:",
    "• Named protein sources (chicken, beef, salmon—not \"meat meal\")",
    "• Whole foods you recognize (sweet potato, carrots, blueberries)",
    "• Limited ingredients (shorter lists often mean less processing)",
    "• Named fats (chicken fat, salmon oil—not \"animal fat\")",
    "",
    "Red Flags to Avoid:",
    "• Generic terms (\"meat by-products\", \"animal digest\")",
    "• Artificial colors (Blue 2, Red 40, Yellow 5)",
    "• Chemical preservatives (BHA, BHT, ethoxyquin)",
    "• Excessive fillers (corn, wheat gluten, soy)",
    "• Long lists of synthetic vitamins (may indicate poor ingredient quality)",
    "",
    "Guaranteed Analysis Breakdown:",
    "• Protein: Minimum % - look for 18% or higher for adults",
    "• Fat: Minimum % - quality fats are essential, not evil",
    "• Fiber: Maximum % - helps with digestion",
    "• Moisture: Maximum % - critical for comparing foods",
  ]

  labelText.forEach((line) => {
    if (
      line.includes("What to") ||
      line.includes("Red Flags") ||
      line.includes("Guaranteed")
    ) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    } else if (line.startsWith("•")) {
      doc.setFont("helvetica", "normal")
      if (line.includes("Avoid")) {
        doc.setTextColor(220, 38, 38) // Red for red flags
      } else {
        doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
      }
    } else {
      doc.setFont("helvetica", "normal")
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    }
    doc.text(line, margin, yPos)
    yPos += 6
  })

  addFooter()

  // PAGE 6: Portion Sizing & Common Mistakes
  doc.addPage()
  addHeader(6)
  yPos = 45

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("5. Portion Sizing & Common Mistakes", margin, yPos)

  yPos += 12
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Quick Portion Guide by Weight:", margin, yPos)

  yPos += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])

  const portions = [
    "Small dogs (5-20 lbs): 200-600 calories/day",
    "Medium dogs (21-50 lbs): 600-1,200 calories/day",
    "Large dogs (51-90 lbs): 1,200-2,000 calories/day",
    "XL dogs (91+ lbs): 2,000-3,500 calories/day",
  ]

  portions.forEach((portion) => {
    doc.setTextColor(brightGreen[0], brightGreen[1], brightGreen[2])
    doc.text("•", margin + 2, yPos)
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(portion, margin + 8, yPos)
    yPos += 7
  })

  yPos += 8
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Common Nutrition Mistakes to Avoid:", margin, yPos)

  yPos += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const mistakes = [
    "1. Free feeding: Leaving food out all day can lead to obesity",
    "2. Ignoring treats: Treats should be <10% of daily calories",
    "3. People food additions: Can unbalance nutrition and add calories",
    "4. Not adjusting for activity: Active dogs need more food",
    "5. Switching foods too quickly: Transition over 7-10 days",
    "6. Forgetting to measure: Eyeballing portions leads to overfeeding",
    "7. Skipping vet checkups: Regular weight checks are essential",
  ]

  mistakes.forEach((mistake) => {
    doc.setTextColor(220, 38, 38)
    doc.text("✗", margin + 2, yPos)
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text(mistake, margin + 8, yPos)
    yPos += 7
  })

  yPos += 8
  doc.setFillColor(240, 253, 244) // Light green
  doc.rect(margin, yPos, pageWidth - 2 * margin, 20, "F")

  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.setTextColor(22, 101, 52)
  doc.text("✓ Best Practice:", margin + 5, yPos)

  yPos += 6
  doc.setFont("helvetica", "normal")
  doc.text(
    "Feed measured portions 2x daily (morning and evening). Monitor your dog's body",
    margin + 5,
    yPos
  )
  yPos += 5
  doc.text("condition weekly and adjust portions as needed.", margin + 5, yPos)

  addFooter()

  // PAGE 7: When to Consult Your Vet & Next Steps
  doc.addPage()
  addHeader(7)
  yPos = 45

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("6. When to Consult Your Veterinarian", margin, yPos)

  yPos += 12
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])

  const vetText = [
    "Always consult your vet before making major diet changes, especially if your dog:",
    "",
    "• Has medical conditions (diabetes, kidney disease, allergies)",
    "• Is pregnant or nursing",
    "• Is a growing puppy or senior dog",
    "• Takes medications that interact with food",
    "• Shows signs of nutritional deficiency",
    "• Has sudden weight gain or loss",
    "• Experiences digestive issues",
  ]

  vetText.forEach((line) => {
    if (line.startsWith("•")) {
      doc.setTextColor(brightGreen[0], brightGreen[1], brightGreen[2])
      doc.text("•", margin + 2, yPos)
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
      doc.text(line.substring(1), margin + 8, yPos)
    } else {
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
      doc.text(line, margin, yPos)
    }
    yPos += 6
  })

  // Next Steps section
  yPos += 15
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.text("Ready for Fresh, Personalized Nutrition?", margin, yPos)

  yPos += 10
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])

  const nextSteps = [
    "NouriPet makes fresh food simple:",
    "",
    "1. Tell us about your dog (weight, age, activity level)",
    "2. We calculate exact calorie needs using veterinary formulas",
    "3. Choose from AAFCO-certified recipes",
    "4. Get perfectly portioned, fresh meals delivered every 2 weeks",
    "",
    "Plus, enjoy these benefits:",
    "• Free local delivery (Westchester NY & Fairfield CT)",
    "• 100% satisfaction guarantee",
    "• Cancel or pause anytime—no commitment",
    "• Full ingredient transparency and nutrition data",
  ]

  nextSteps.forEach((line) => {
    if (line.match(/^\d\./)) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
    } else if (line.startsWith("•")) {
      doc.setFont("helvetica", "normal")
      doc.setTextColor(brightGreen[0], brightGreen[1], brightGreen[2])
      doc.text("✓", margin + 2, yPos)
      doc.text(line.substring(1), margin + 8, yPos)
      yPos += 6
      return
    } else if (line.includes("NouriPet") || line.includes("Plus")) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    } else {
      doc.setFont("helvetica", "normal")
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    }
    doc.text(line, margin, yPos)
    yPos += 6
  })

  // Discount callout with green gradient theme
  yPos += 5
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2])
  doc.rect(margin, yPos, pageWidth - 2 * margin, 25, "F")

  yPos += 8
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text("🎁 Special Offer: Use code NOURI15 for 15% off your first month", pageWidth / 2, yPos, {
    align: "center",
  })

  yPos += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Visit nouripet.net/plan-builder to get started today!", pageWidth / 2, yPos, {
    align: "center",
  })

  addFooter()

  // Generate PDF as base64 string
  return doc.output("datauristring").split(",")[1]
}
