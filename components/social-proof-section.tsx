import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const reviews = [
  {
    name: "Sarah Chen",
    role: "Golden Retriever Mom",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    review:
      "Finally, a dog food company that shows their work! The nutrition transparency gives me confidence I'm feeding Max the best.",
    dogName: "Max",
  },
  {
    name: "Dr. Michael Rodriguez",
    role: "Veterinarian",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    review:
      "I recommend NouriPet to clients who want science-backed nutrition. The AAFCO compliance visualization is brilliant.",
    dogName: "Professional",
  },
  {
    name: "Jennifer Park",
    role: "German Shepherd Mom",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    review:
      "Luna's coat has never looked better. The personalized portions and add-on recommendations made all the difference.",
    dogName: "Luna",
  },
]

export function SocialProofSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-manrope text-3xl lg:text-4xl font-bold">Trusted by Pet Parents & Vets</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of pet parents who've made the switch to transparent nutrition.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-sm leading-relaxed">"{review.review}"</p>

                <div className="flex items-center gap-3 pt-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.name} />
                    <AvatarFallback>
                      {review.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{review.name}</div>
                    <div className="text-xs text-muted-foreground">{review.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-card border rounded-full px-6 py-3">
            <div className="flex -space-x-2">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u1732343973_realistic_happy_dog_looking_face_forward_--v_7_345e72b3-9c36-476d-b173-2a261bb99e56_0-iFnSHZsmgFhBfVXkuedPTnQaE9oLnC.png"
                alt="Happy dog"
                className="w-8 h-8 rounded-full border-2 border-background object-cover"
              />
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u1732343973_realistic_happy_dog_looking_face_forward_--v_7_345e72b3-9c36-476d-b173-2a261bb99e56_1-ROFRS2CznRBDqSYLj0kqePpK9Hthxa.png"
                alt="Happy dog"
                className="w-8 h-8 rounded-full border-2 border-background object-cover"
              />
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u1732343973_realistic_happy_dog_looking_face_forward_--v_7_345e72b3-9c36-476d-b173-2a261bb99e56_2-qHn9KF9Et6GGRYeYwx4PUc1K95J4bZ.png"
                alt="Happy dog"
                className="w-8 h-8 rounded-full border-2 border-background object-cover"
              />
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/u1732343973_realistic_happy_dog_looking_face_forward_--v_7_345e72b3-9c36-476d-b173-2a261bb99e56_3-SeUfCddWjhui0eZEAkBwcRbFX9Ocvy.png"
                alt="Happy dog"
                className="w-8 h-8 rounded-full border-2 border-background object-cover"
              />
            </div>
            <div className="text-sm">
              <span className="font-semibold">10,000+</span> happy dogs and counting
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
