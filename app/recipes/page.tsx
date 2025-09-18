import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Leaf, ArrowRight } from "lucide-react"
import Link from "next/link"
import { mockRecipes } from "@/lib/nutrition-calculator"

export default function RecipesPage() {
  const getRecipeImage = (recipeId: string) => {
    const imageMap: Record<string, string> = {
      "beef-quinoa-harvest": "/images/recipes/beef-quinoa.jpg",
      "lamb-pumpkin-feast": "/images/recipes/lamb-pumpkin.png",
      "low-fat-chicken-garden-veggie": "/images/recipes/low-fat-chicken-garden-veggie.jpg",
      "turkey-brown-rice-comfort": "/images/recipes/turkey-brown-rice.jpg",
    }
    return imageMap[recipeId] || "/placeholder.svg?height=300&width=400"
  }

  const sortedRecipes = [...mockRecipes].sort((a, b) => {
    if (a.comingSoon && !b.comingSoon) return 1
    if (!a.comingSoon && b.comingSoon) return -1
    return 0
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Page Header */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="font-manrope text-3xl lg:text-4xl font-bold">Our Recipe Collection</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every recipe is nutritionally complete, AAFCO approved, and made with ingredients you can trace back to the
            farm.
          </p>
        </div>

        {/* Recipes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {sortedRecipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={getRecipeImage(recipe.id) || "/placeholder.svg"}
                  alt={recipe.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                    {recipe.aafcoLifeStage}
                  </Badge>
                </div>
                {recipe.comingSoon && (
                  <span className="absolute top-2 right-2 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1">
                    Coming Soon
                  </span>
                )}
                {!recipe.comingSoon && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1">
                    <Leaf className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">{recipe.sustainabilityScore}%</span>
                  </div>
                )}
              </div>

              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-manrope text-xl font-bold">{recipe.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {recipe.kcalPer100g} kcal per 100g • Vacuum sealed packs
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <div className="font-bold text-primary">{recipe.protein}%</div>
                    <div className="text-xs text-muted-foreground">Protein</div>
                  </div>
                  <div>
                    <div className="font-bold text-primary">{recipe.fat}%</div>
                    <div className="text-xs text-muted-foreground">Fat</div>
                  </div>
                  <div>
                    <div className="font-bold text-primary">{recipe.carbs}%</div>
                    <div className="text-xs text-muted-foreground">Carbs</div>
                  </div>
                  <div>
                    <div className="font-bold text-primary">{recipe.fiber}%</div>
                    <div className="text-xs text-muted-foreground">Fiber</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Contains:</div>
                  <div className="flex flex-wrap gap-1">
                    {recipe.allergens.map((allergen) => (
                      <Badge key={allergen} variant="outline" className="text-xs capitalize">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Sourced from:</div>
                  <div className="text-xs text-muted-foreground">{recipe.sourcing[0]}</div>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/recipes/${recipe.id}`} className="flex items-center gap-2">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-16 bg-muted/30 rounded-3xl">
          <h2 className="font-manrope text-2xl lg:text-3xl font-bold">Ready to find the perfect recipe?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Our meal plan builder will recommend the best recipe based on your dog's specific needs, allergies, and
            preferences.
          </p>
          <Button asChild size="lg">
            <Link href="/plan-builder">Build Your Dog's Plan</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
