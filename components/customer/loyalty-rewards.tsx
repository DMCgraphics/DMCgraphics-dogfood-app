"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Gift, Star, Trophy, Users, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Reward {
  id: string
  title: string
  description: string
  pointsCost: number
  type: "discount" | "free-item" | "upgrade"
  isAvailable: boolean
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  isUnlocked: boolean
  unlockedDate?: Date
}

export function LoyaltyRewards() {
  const { user } = useAuth()
  const [currentPoints] = useState(1250)
  const [tierProgress] = useState(65) // Progress to next tier
  const [currentTier] = useState("Gold")

  const rewards: Reward[] = [
    {
      id: "1",
      title: "10% Off Next Order",
      description: "Save on your next delivery",
      pointsCost: 500,
      type: "discount",
      isAvailable: true,
    },
    {
      id: "2",
      title: "Free Probiotic Supplement",
      description: "Add a free supplement to your order",
      pointsCost: 750,
      type: "free-item",
      isAvailable: true,
    },
    {
      id: "3",
      title: "Recipe Upgrade",
      description: "Try a premium recipe for free",
      pointsCost: 1000,
      type: "upgrade",
      isAvailable: true,
    },
    {
      id: "4",
      title: "Free Delivery Month",
      description: "Free shipping for 30 days",
      pointsCost: 1500,
      type: "upgrade",
      isAvailable: false,
    },
  ]

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Order",
      description: "Completed your first NouriPet order",
      icon: "🎉",
      isUnlocked: true,
      unlockedDate: new Date("2024-11-01"),
    },
    {
      id: "2",
      title: "Loyal Customer",
      description: "5 consecutive monthly deliveries",
      icon: "⭐",
      isUnlocked: true,
      unlockedDate: new Date("2024-12-01"),
    },
    {
      id: "3",
      title: "Health Tracker",
      description: "Logged 30 days of weight tracking",
      icon: "📊",
      isUnlocked: false,
    },
    {
      id: "4",
      title: "Community Helper",
      description: "Left 5 helpful recipe reviews",
      icon: "🤝",
      isUnlocked: false,
    },
  ]

  const handleRedeemReward = (rewardId: string, pointsCost: number) => {
    if (currentPoints >= pointsCost) {
      console.log("[v0] reward_redeemed", { rewardId, pointsCost })
      alert(`Reward redeemed! You'll see this applied to your next order.`)
    }
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "discount":
        return <Gift className="h-4 w-4" />
      case "free-item":
        return <Star className="h-4 w-4" />
      case "upgrade":
        return <Trophy className="h-4 w-4" />
      default:
        return <Gift className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            NouriPet Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-primary">{currentPoints.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Available Points</div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {currentTier} Member
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Platinum</span>
              <span>{tierProgress}%</span>
            </div>
            <Progress value={tierProgress} className="h-2" />
            <div className="text-xs text-muted-foreground">Earn 350 more points to reach Platinum tier</div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">+50</div>
              <div className="text-xs text-muted-foreground">Per Order</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">+25</div>
              <div className="text-xs text-muted-foreground">Per Review</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">+100</div>
              <div className="text-xs text-muted-foreground">Per Referral</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Available Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id} className={!reward.isAvailable ? "opacity-50" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getRewardIcon(reward.type)}
                      <h4 className="font-semibold">{reward.title}</h4>
                    </div>
                    <Badge variant="outline">{reward.pointsCost} pts</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!reward.isAvailable || currentPoints < reward.pointsCost}
                    onClick={() => handleRedeemReward(reward.id, reward.pointsCost)}
                  >
                    {currentPoints < reward.pointsCost ? "Not Enough Points" : "Redeem"}
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  achievement.isUnlocked ? "bg-primary/5 border-primary/20" : "bg-muted/30"
                }`}
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className={`font-medium ${achievement.isUnlocked ? "" : "text-muted-foreground"}`}>
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.isUnlocked && achievement.unlockedDate && (
                    <p className="text-xs text-primary">Unlocked {achievement.unlockedDate.toLocaleDateString()}</p>
                  )}
                </div>
                {achievement.isUnlocked && <Trophy className="h-4 w-4 text-amber-500" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Refer Friends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6 bg-primary/5 rounded-lg">
            <h3 className="font-semibold mb-2">Give $20, Get $20</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Share NouriPet with friends and you both save on your next order
            </p>
            <Button>Share Your Code: NOURIPET{user?.id?.slice(-4) || "1234"}</Button>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            You've referred 2 friends and earned 200 bonus points!
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
