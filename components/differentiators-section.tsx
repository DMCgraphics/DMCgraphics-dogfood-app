import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Microscope, Heart, Leaf, Target } from "lucide-react"

const differentiators = [
  {
    icon: Microscope,
    title: "Nutritional Transparency",
    description:
      'Every ingredient percentage shown. AAFCO compliance visualized. No mystery meat or vague "chicken meal".',
    badge: "Science-First",
  },
  {
    icon: Target,
    title: "Deep Personalization",
    description:
      "Calculated portions based on your dog's exact weight, activity, and health goals. Not one-size-fits-all.",
    badge: "Tailored",
  },
  {
    icon: Heart,
    title: "Wellness Ecosystem",
    description:
      "Track weight, stool quality, and energy. Get vet-approved recommendations as your dog's needs change.",
    badge: "Holistic",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description:
      "Single-origin meats, carbon-neutral shipping, and recyclable packaging. Good for dogs, good for Earth.",
    badge: "Eco-Friendly",
  },
]

export function DifferentiatorsSection() {
  return (
    <section className="section-padding bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold">Why NouriPet is Different</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We believe pet parents deserve to know exactly what they're feeding their dogs—and why it matters.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {differentiators.map((item, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
