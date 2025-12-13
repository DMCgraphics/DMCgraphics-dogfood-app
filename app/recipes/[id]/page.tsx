import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ShoppingCart, Heart } from "lucide-react"
import Link from "next/link"
import { getRecipeBySlug } from "@/lib/recipes"
import { RecipeIngredientList } from "@/components/recipe-ingredient-list"
import { NutrientTransparencyPanel } from "@/components/recipe/nutrient-transparency-panel"
import { IngredientBreakdown } from "@/components/recipe/ingredient-breakdown"
import { SourcingSustainability } from "@/components/recipe/sourcing-sustainability"
import { getPackPortion } from "@/lib/pack-portioning"

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RecipePageProps {
  params: {
    id: string
  }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipe = await getRecipeBySlug(params.id)

  if (!recipe) {
    notFound()
  }

  const getRecipeImage = (slug: string) => {
    const imageMap: Record<string, string> = {
      "beef-quinoa-harvest": "/images/recipes/beef-quinoa.png",
      "lamb-pumpkin-feast": "/images/recipes/lamb-pumpkin.png",
      "low-fat-chicken-garden-veggie": "/images/recipes/low-fat-chicken-garden-veggie.png",
      "turkey-brown-rice-comfort": "/images/recipes/turkey-brown-rice.png",
    }
    return imageMap[slug] || "/placeholder.svg?height=400&width=600"
  }

  const sampleDailyGrams = 150 // Sample for medium dog
  const packInfo = getPackPortion(sampleDailyGrams)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/recipes" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Recipes
            </Link>
          </Button>
        </div>

        {/* Recipe Hero */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{recipe.aafcoLifeStage}</Badge>
              </div>
              <h1 className="font-manrope text-3xl lg:text-4xl font-bold">
                {recipe.name}
                {recipe.comingSoon && (
                  <span className="ml-2 align-middle rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5">
                    Coming Soon
                  </span>
                )}
              </h1>
              <p className="text-lg text-muted-foreground">
                {recipe.slug === "low-fat-chicken-garden-veggie" ? (
                  <>
                    Specially formulated as a low-fat option for dogs prone to pancreatitis.
                    Protein comes from lean chicken breast and egg whites, with no added oils.
                    Balanced carbs and veggies support digestion and energy. Vacuum sealed packs made with {recipe.sourcing[0]?.split(",")[0] || "premium"} ingredients.
                  </>
                ) : recipe.description ? (
                  <>
                    {recipe.description} Vacuum sealed packs made with {recipe.sourcing[0]?.split(",")[0] || "premium"} ingredients. Nutritionally complete and
                    balanced for {recipe.aafcoLifeStage === "all" ? "all life stages" : recipe.aafcoLifeStage} dogs.
                  </>
                ) : (
                  <>
                    Vacuum sealed packs made with {recipe.sourcing[0]?.split(",")[0] || "premium"} ingredients. Nutritionally complete and
                    balanced for {recipe.aafcoLifeStage === "all" ? "all life stages" : recipe.aafcoLifeStage} dogs.
                  </>
                )}
              </p>            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{recipe.kcalPer100g}</div>
                <div className="text-sm text-muted-foreground">kcal per 100g</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{recipe.protein}%</div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{recipe.fat}%</div>
                <div className="text-sm text-muted-foreground">Fat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{recipe.sustainabilityScore}%</div>
                <div className="text-sm text-muted-foreground">Sustainable</div>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium mb-2">Pack Information (sample 40lb dog):</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Daily amount:</span>
                  <div className="font-medium">
                    {sampleDailyGrams}g ({packInfo.packsPerDay} × {packInfo.packSize}g packs)
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly packs:</span>
                  <div className="font-medium">{packInfo.packsPerMonth} packs</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button asChild size="lg" className="flex-1">
                <Link href="/plan-builder">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Build Your Plan
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <img
              src={getRecipeImage(recipe.slug) || "/placeholder.svg?height=400&width=600"}
              alt={recipe.name}
              className="w-full h-96 object-cover rounded-2xl"
            />
            <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border rounded-xl p-3">
              <div className="text-sm font-medium">Batch Traceable</div>
              <div className="text-xs text-muted-foreground">Farm to bowl transparency</div>
            </div>
          </div>
        </div>

        {/* Allergen and Ingredients Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Contains:</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.allergens.map((allergen) => (
                  <Badge key={allergen} variant="outline" className="capitalize">
                    {allergen}
                  </Badge>
                ))}
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Free from:</div>
                <div className="text-xs text-muted-foreground">
                  Corn, wheat, soy, artificial preservatives
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Ingredients:</h3>
              <RecipeIngredientList
                ingredients={recipe.ingredients}
                premixDetails={recipe.premixDetails}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <NutrientTransparencyPanel recipe={recipe} dailyAmount={150} />
            <IngredientBreakdown recipeId={recipe.slug} />
          </div>

          <div className="space-y-8">
            <SourcingSustainability recipe={recipe} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
