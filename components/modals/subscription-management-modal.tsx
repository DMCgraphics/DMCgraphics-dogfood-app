"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CreditCard,
  Package,
  Pause,
  Play,
  Plus,
  Settings,
  Trash2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface TopperSubscription {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  dogName: string;
  dogSize: string;
  productType: string;
  amount: number;
  isPaused: boolean;
}

interface SubscriptionManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionManagementModal({
  open,
  onOpenChange,
}: SubscriptionManagementModalProps) {
  const { user, refreshSubscriptionStatus } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [topperSubscriptions, setTopperSubscriptions] = useState<
    TopperSubscription[]
  >([]);
  const [dogsWithoutSubscriptions, setDogsWithoutSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<
    string | null
  >(null);
  const [topperToCancel, setTopperToCancel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isCancellingTopper, setIsCancellingTopper] = useState(false);
  const [topperToModify, setTopperToModify] =
    useState<TopperSubscription | null>(null);
  const [selectedNewLevel, setSelectedNewLevel] = useState<string>("");
  const [isModifyingTopper, setIsModifyingTopper] = useState(false);
  const [isPausingTopper, setIsPausingTopper] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchSubscriptions();
      fetchTopperSubscriptions();
    }
  }, [open, user]);

  const fetchTopperSubscriptions = async () => {
    try {
      const response = await fetch("/api/topper-orders");
      const data = await response.json();

      if (!response.ok) {
        console.error("Error fetching topper subscriptions:", data.error);
        return;
      }

      setTopperSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error("Error fetching topper subscriptions:", error);
    }
  };

  const handleCancelTopperSubscription = async () => {
    if (!topperToCancel) return;

    setIsCancellingTopper(true);
    try {
      const response = await fetch("/api/topper-orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subscription", id: topperToCancel.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel topper subscription");
      }

      // Refresh the list
      await fetchTopperSubscriptions();
      setTopperToCancel(null);
      alert(
        "Topper subscription will be cancelled at the end of the current billing period.",
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCancellingTopper(false);
    }
  };

  const getTopperProductTypeName = (type: string) => {
    switch (type) {
      case "25":
        return "25% Topper Plan";
      case "50":
        return "50% Topper Plan";
      case "75":
        return "75% Topper Plan";
      default:
        return type;
    }
  };

  const handlePauseTopperSubscription = async (subscriptionId: string) => {
    setIsPausingTopper(subscriptionId);
    try {
      const response = await fetch("/api/topper-orders/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause", subscriptionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to pause subscription");
      }

      await fetchTopperSubscriptions();
      alert("Topper subscription paused successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPausingTopper(null);
    }
  };

  const handleResumeTopperSubscription = async (subscriptionId: string) => {
    setIsPausingTopper(subscriptionId);
    try {
      const response = await fetch("/api/topper-orders/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume", subscriptionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resume subscription");
      }

      await fetchTopperSubscriptions();
      alert("Topper subscription resumed successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPausingTopper(null);
    }
  };

  const handleModifyTopperSubscription = async () => {
    if (!topperToModify || !selectedNewLevel) return;

    setIsModifyingTopper(true);
    try {
      const response = await fetch("/api/topper-orders/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "modify",
          subscriptionId: topperToModify.id,
          newLevel: selectedNewLevel,
          dogSize: topperToModify.dogSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to modify subscription");
      }

      await fetchTopperSubscriptions();
      setTopperToModify(null);
      setSelectedNewLevel("");
      alert(
        `Subscription updated to ${selectedNewLevel}% topper plan. Any difference will be prorated.`,
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsModifyingTopper(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      console.log(
        "[v0] Modal - Fetching subscriptions for user:",
        user.id,
        user.email,
      );

      // First, get all subscriptions for the user
      const { data: subscriptionsData, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due", "paused", "canceled"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
        setSubscriptions([]);
        return;
      }

      console.log("[v0] Modal - Raw subscriptions data:", subscriptionsData);
      console.log(
        "[v0] Modal - Number of subscriptions found:",
        subscriptionsData?.length,
      );

      // If no subscriptions found, check for active plans without subscriptions
      if (!subscriptionsData || subscriptionsData.length === 0) {
        const { data: plansData, error: plansError } = await supabase
          .from("plans")
          .select(
            `
            *,
            plan_items (
              *,
              recipes (name)
            )
          `,
          )
          .eq("user_id", user.id)
          .in("status", ["active", "checkout_in_progress"])
          .order("created_at", { ascending: false });

        if (plansError) {
          console.error("Error fetching plans:", plansError);
          setSubscriptions([]);
          return;
        }

        console.log(
          "[v0] Modal - Found plans without subscriptions:",
          plansData,
        );

        // Convert plans to subscription-like format
        const planSubscriptions = [];
        for (const plan of plansData || []) {
          let dogData = null;
          if (plan.dog_id) {
            const { data: dog } = await supabase
              .from("dogs")
              .select("*")
              .eq("id", plan.dog_id)
              .single();
            if (dog) {
              dogData = dog;
            }
          }

          planSubscriptions.push({
            id: plan.id,
            user_id: plan.user_id,
            plan_id: plan.id,
            status: plan.status === "active" ? "active" : "pending",
            created_at: plan.created_at,
            current_period_end: null,
            stripe_subscription_id: null,
            planData: plan,
            dogData,
          });
        }

        setSubscriptions(planSubscriptions);
        await refreshSubscriptionStatus();
        setLoading(false);
        return;
      }

      // Enrich each subscription with plan and dog data
      const enrichedSubscriptions = [];

      for (const subscription of subscriptionsData || []) {
        let planData = null;
        let dogData = null;

        // Get plan data using plan_id from subscription
        if (subscription.plan_id) {
          console.log(
            "[v0] Modal - Fetching plan data for plan_id:",
            subscription.plan_id,
          );

          const { data: plan, error: planError } = await supabase
            .from("plans")
            .select(
              `
              *,
              plan_items (
                *,
                recipes (name)
              )
            `,
            )
            .eq("id", subscription.plan_id)
            .single();

          if (planError) {
            console.error("[v0] Modal - Error fetching plan:", planError);
          }

          if (plan) {
            console.log("[v0] Modal - Plan data fetched:", plan);
            console.log(
              "[v0] Modal - plan_items count:",
              plan.plan_items?.length,
            );
            console.log("[v0] Modal - plan_items details:", plan.plan_items);
            planData = plan;

            // Get dog data using dog_id from plan
            const { data: dog } = await supabase
              .from("dogs")
              .select("*")
              .eq("id", plan.dog_id)
              .single();

            if (dog) {
              dogData = dog;
            }
          }
        } else if (subscription.metadata?.dog_id) {
          // Handle topper subscriptions (no plan_id, but has dog_id in metadata)
          console.log(
            "[v0] Modal - Fetching dog data for topper subscription, dog_id:",
            subscription.metadata.dog_id,
          );

          const { data: dog } = await supabase
            .from("dogs")
            .select("*")
            .eq("id", subscription.metadata.dog_id)
            .single();

          if (dog) {
            dogData = dog;
            console.log("[v0] Modal - Dog data fetched for topper:", dog);
          }
        }

        enrichedSubscriptions.push({
          ...subscription,
          planData,
          dogData,
        });
      }

      console.log(
        "[v0] Modal - Enriched subscriptions:",
        enrichedSubscriptions,
      );

      // Debug logging for plan items
      enrichedSubscriptions.forEach((sub, idx) => {
        console.log(
          `[v0] Subscription ${idx} - plan_items count:`,
          sub.planData?.plan_items?.length,
        );
        console.log(
          `[v0] Subscription ${idx} - plan_items:`,
          sub.planData?.plan_items,
        );
      });

      // Update status to "canceled" if cancel_at_period_end is true
      enrichedSubscriptions.forEach((sub) => {
        if (sub.cancel_at_period_end && sub.status === "active") {
          sub.status = "canceled";
          console.log(
            "[v0] Modal - Subscription marked as canceled due to cancel_at_period_end:",
            sub.id,
          );
        }
      });

      // Filter to show only the most recent subscription per dog to avoid confusion from test data
      const subscriptionsByDog = new Map();
      enrichedSubscriptions.forEach((sub) => {
        // Get dog_id from either plan data or metadata (for topper subscriptions)
        const dogId = sub.planData?.dog_id || sub.metadata?.dog_id;
        if (dogId && !subscriptionsByDog.has(dogId)) {
          subscriptionsByDog.set(dogId, sub);
        }
      });
      const uniqueSubscriptions = Array.from(subscriptionsByDog.values());

      // Filter out topper subscriptions since they have their own dedicated section below
      const nonTopperSubscriptions = uniqueSubscriptions.filter((sub) => {
        // Keep only non-topper subscriptions (those with plan_id or without product_type starting with "topper")
        return sub.plan_id || !sub.metadata?.product_type?.startsWith("topper");
      });

      console.log(
        "[v0] Modal - Showing unique subscriptions (most recent per dog):",
        nonTopperSubscriptions.length,
      );
      console.log(
        "[v0] Modal - Filtered out topper subscriptions:",
        uniqueSubscriptions.length - nonTopperSubscriptions.length,
      );

      setSubscriptions(nonTopperSubscriptions);

      // Fetch all dogs to find those without subscriptions
      const { data: allDogs, error: dogsError } = await supabase
        .from("dogs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!dogsError && allDogs) {
        // Find dogs that don't have subscriptions
        // Include both plan-based subscriptions and topper subscriptions
        const dogsWithSubs = new Set(
          uniqueSubscriptions
            .map((sub) => sub.planData?.dog_id || sub.metadata?.dog_id)
            .filter(Boolean),
        );

        // Also include dogs with topper subscriptions
        topperSubscriptions.forEach((topper) => {
          if (topper.dogId) {
            dogsWithSubs.add(topper.dogId);
          }
        });

        const dogsWithoutSubs = allDogs.filter(
          (dog) => !dogsWithSubs.has(dog.id),
        );
        console.log(
          "[v0] Modal - Dogs without subscriptions:",
          dogsWithoutSubs.length,
        );
        setDogsWithoutSubscriptions(dogsWithoutSubs);
      }

      // Refresh auth context subscription status to ensure consistency
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setSubscriptions([]);
      setDogsWithoutSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSubscription = async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        console.error("[v0] Modal - No subscription ID provided to pause");
        alert("Cannot pause subscription: No subscription ID found");
        return;
      }

      console.log("[v0] Modal - Pausing subscription:", subscriptionId);
      const response = await fetch("/api/subscriptions/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      if (response.ok) {
        console.log("[v0] Modal - Subscription paused successfully");
        await fetchSubscriptions(); // Refresh data
        await refreshSubscriptionStatus(); // Update auth context
      } else {
        const errorText = await response.text();
        console.error("[v0] Modal - Failed to pause subscription:", errorText);
        alert("Failed to pause subscription");
      }
    } catch (error) {
      console.error("Error pausing subscription:", error);
      alert("Failed to pause subscription");
    }
  };

  const handleResumeSubscription = async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        console.error("[v0] Modal - No subscription ID provided to resume");
        alert("Cannot resume subscription: No subscription ID found");
        return;
      }

      console.log("[v0] Modal - Resuming subscription:", subscriptionId);
      const response = await fetch("/api/subscriptions/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      if (response.ok) {
        console.log("[v0] Modal - Subscription resumed successfully");
        await fetchSubscriptions(); // Refresh data
        await refreshSubscriptionStatus(); // Update auth context
      } else {
        const errorText = await response.text();
        console.error("[v0] Modal - Failed to resume subscription:", errorText);
        alert("Failed to resume subscription");
      }
    } catch (error) {
      console.error("Error resuming subscription:", error);
      alert("Failed to resume subscription");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "past_due":
        return "bg-red-100 text-red-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      case "canceled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateNextDelivery = (subscription: any) => {
    // Use current_period_end if available, otherwise calculate from created_at
    if (subscription.current_period_end) {
      const nextDeliveryDate = new Date(subscription.current_period_end);
      return nextDeliveryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else {
      // Fallback to calculating from created_at
      const subscriptionDate = new Date(subscription.created_at);
      const nextDeliveryDate = new Date(subscriptionDate);
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);
      return nextDeliveryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    try {
      console.log("[v0] Canceling subscription:", subscriptionToCancel);

      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionToCancel }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel subscription");
      }

      console.log("[v0] Subscription canceled successfully");

      // Close confirmation dialog
      setShowCancelConfirm(false);
      setSubscriptionToCancel(null);

      // Refresh subscriptions
      await fetchSubscriptions();
      await refreshSubscriptionStatus();

      alert(
        "Subscription canceled successfully. You'll continue to have access until the end of your billing period.",
      );
    } catch (error: any) {
      console.error("[v0] Error canceling subscription:", error);
      alert(`Failed to cancel subscription: ${error.message}`);
      setShowCancelConfirm(false);
      setSubscriptionToCancel(null);
    }
  };

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        console.error("[v0] Modal - No subscription ID provided to reactivate");
        alert("Cannot reactivate subscription: No subscription ID found");
        return;
      }

      console.log("[v0] Modal - Reactivating subscription:", subscriptionId);
      const response = await fetch("/api/subscriptions/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      if (response.ok) {
        console.log("[v0] Modal - Subscription reactivated successfully");
        await fetchSubscriptions(); // Refresh data
        await refreshSubscriptionStatus(); // Update auth context
        alert("Subscription reactivated successfully!");
      } else {
        const errorText = await response.text();
        console.error(
          "[v0] Modal - Failed to reactivate subscription:",
          errorText,
        );
        alert("Failed to reactivate subscription");
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      alert("Failed to reactivate subscription");
    }
  };

  const handleSkipDelivery = async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        console.error(
          "[v0] Modal - No subscription ID provided to skip delivery",
        );
        alert("Cannot skip delivery: No subscription ID found");
        return;
      }

      console.log(
        "[v0] Modal - Skipping next delivery for subscription:",
        subscriptionId,
      );
      const response = await fetch("/api/subscriptions/skip-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("[v0] Modal - Delivery skipped successfully:", result);
        await fetchSubscriptions(); // Refresh data
        await refreshSubscriptionStatus(); // Update auth context

        const resumeDate = new Date(result.resumes_at).toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          },
        );
        alert(
          `Next delivery skipped successfully! Your subscription will resume on ${resumeDate}.`,
        );
      } else {
        const errorText = result.error || "Failed to skip delivery";
        console.error("[v0] Modal - Failed to skip delivery:", errorText);
        alert(`Failed to skip delivery: ${errorText}`);
      }
    } catch (error) {
      console.error("Error skipping delivery:", error);
      alert("Failed to skip delivery. Please try again.");
    }
  };

  const handleModifyPlan = async (subscription: any) => {
    try {
      console.log("[v0] Modifying plan for subscription:", subscription.id);

      // Close the modal
      onOpenChange(false);

      // Navigate to plan builder with query params instead of localStorage
      const params = new URLSearchParams({
        modify: "true",
        subscription_id: subscription.id,
        plan_id: subscription.plan_id,
        stripe_subscription_id: subscription.stripe_subscription_id || "",
      });

      router.push(`/plan-builder?${params.toString()}`);
    } catch (error) {
      console.error("Error preparing to modify plan:", error);
      alert("Failed to load plan for modification. Please try again.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Subscriptions
            </DialogTitle>
            <DialogDescription>
              View and manage your active subscriptions, pause deliveries, or
              modify your plans.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : subscriptions.length === 0 && topperSubscriptions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Active Subscriptions
              </h3>
              <p className="text-muted-foreground mb-4">
                You don't have any active subscriptions yet.
              </p>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {subscriptions.length > 0 && (
                <>
                  <div className="text-center py-4 border-b">
                    <h3 className="text-lg font-semibold">
                      Found {subscriptions.length} subscription
                      {subscriptions.length !== 1 ? "s" : ""}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your active subscriptions below
                    </p>
                  </div>
                  {subscriptions.map((subscription) => (
                    <Card key={subscription.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {subscription.dogData?.name || "Unknown Dog"}
                              <Badge
                                className={getStatusColor(subscription.status)}
                              >
                                {subscription.status}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {subscription.dogData?.breed} •{" "}
                              {subscription.dogData?.weight} lbs
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Stripe ID
                            </div>
                            <div className="font-mono text-xs">
                              {subscription.stripe_subscription_id}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-sm">
                              <Package className="h-4 w-4 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-medium">
                                  {subscription.plan_id
                                    ? "Recipes:"
                                    : "Product:"}
                                </span>
                                <div className="mt-1 space-y-1">
                                  {subscription.planData?.plan_items &&
                                  subscription.planData.plan_items.length >
                                    0 ? (
                                    subscription.planData.plan_items.map(
                                      (item: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="text-muted-foreground"
                                        >
                                          •{" "}
                                          {item.recipes?.name ||
                                            "Unknown recipe"}
                                        </div>
                                      ),
                                    )
                                  ) : subscription.metadata?.product_type ? (
                                    <div className="space-y-1">
                                      <div className="text-muted-foreground">
                                        •{" "}
                                        {subscription.metadata.product_type.toUpperCase()}{" "}
                                        - {subscription.metadata.dog_name}
                                      </div>
                                      {subscription.metadata.recipes &&
                                        (() => {
                                          try {
                                            const recipes = JSON.parse(
                                              subscription.metadata.recipes,
                                            );
                                            return recipes &&
                                              recipes.length > 0 ? (
                                              <div className="ml-4 text-sm text-muted-foreground">
                                                Recipes: {recipes.join(", ")}
                                              </div>
                                            ) : null;
                                          } catch (e) {
                                            return null;
                                          }
                                        })()}
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground">
                                      No items selected
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">
                                Next Delivery:
                              </span>
                              <span>{calculateNextDelivery(subscription)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="h-4 w-4" />
                              <span className="font-medium">Billing:</span>
                              <span>Weekly</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap gap-2">
                          {!subscription.stripe_subscription_id ? (
                            <>
                              <div className="text-sm text-muted-foreground w-full mb-2">
                                No Stripe subscription found
                              </div>
                              {subscription.status === "pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      onOpenChange(false);
                                      router.push("/checkout");
                                    }}
                                  >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Complete Checkout
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleModifyPlan(subscription)
                                    }
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Modify Plan
                                  </Button>
                                </>
                              )}
                            </>
                          ) : subscription.status === "canceled" ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                handleReactivateSubscription(
                                  subscription.stripe_subscription_id,
                                )
                              }
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Resume Subscription
                            </Button>
                          ) : (
                            <>
                              {subscription.status === "active" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handlePauseSubscription(
                                      subscription.stripe_subscription_id,
                                    )
                                  }
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause Subscription
                                </Button>
                              ) : subscription.status === "paused" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleResumeSubscription(
                                      subscription.stripe_subscription_id,
                                    )
                                  }
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume Subscription
                                </Button>
                              ) : null}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSkipDelivery(
                                    subscription.stripe_subscription_id,
                                  )
                                }
                              >
                                <Calendar className="h-4 w-4 mr-2" />
                                Skip Next Delivery
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleModifyPlan(subscription)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Modify Plan
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() => {
                                  setSubscriptionToCancel(
                                    subscription.stripe_subscription_id,
                                  );
                                  setShowCancelConfirm(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {/* Topper Subscriptions */}
              {topperSubscriptions.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Topper Subscriptions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your bi-weekly topper plans
                      </p>
                    </div>
                    {topperSubscriptions.map((topper) => (
                      <Card key={topper.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-primary" />
                                {getTopperProductTypeName(topper.productType)}
                                <Badge
                                  className={
                                    topper.cancelAtPeriodEnd
                                      ? "bg-orange-100 text-orange-800"
                                      : getStatusColor(topper.status)
                                  }
                                >
                                  {topper.cancelAtPeriodEnd
                                    ? "Cancelling"
                                    : topper.status}
                                </Badge>
                              </CardTitle>
                              <CardDescription>
                                For {topper.dogName || "your dog"} • $
                                {(topper.amount / 100).toFixed(2)}/2 weeks
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div className="text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            {topper.isPaused
                              ? "Paused"
                              : `Next billing: ${new Date(topper.currentPeriodEnd).toLocaleDateString()}`}
                          </div>

                          {topper.cancelAtPeriodEnd ? (
                            <div className="text-sm text-orange-600">
                              Subscription ends{" "}
                              {new Date(
                                topper.currentPeriodEnd,
                              ).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {/* Pause/Resume Button */}
                              {topper.isPaused ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleResumeTopperSubscription(topper.id)
                                  }
                                  disabled={isPausingTopper === topper.id}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  {isPausingTopper === topper.id
                                    ? "Resuming..."
                                    : "Resume"}
                                </Button>
                              ) : (
                                topper.status === "active" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handlePauseTopperSubscription(topper.id)
                                    }
                                    disabled={isPausingTopper === topper.id}
                                  >
                                    <Pause className="h-4 w-4 mr-1" />
                                    {isPausingTopper === topper.id
                                      ? "Pausing..."
                                      : "Pause"}
                                  </Button>
                                )
                              )}

                              {/* Modify Button */}
                              {(topper.status === "active" ||
                                topper.isPaused) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setTopperToModify(topper);
                                    setSelectedNewLevel("");
                                  }}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Change Plan
                                </Button>
                              )}

                              {/* Cancel Button */}
                              {(topper.status === "active" ||
                                topper.isPaused) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    setTopperToCancel({
                                      id: topper.id,
                                      name: getTopperProductTypeName(
                                        topper.productType,
                                      ),
                                    })
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Show dogs without subscriptions */}
              {dogsWithoutSubscriptions.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <h3 className="text-lg font-semibold">
                        Dogs Without Subscriptions
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Create a meal plan for these dogs
                      </p>
                    </div>
                    {dogsWithoutSubscriptions.map((dog: any) => (
                      <Card key={dog.id}>
                        <CardHeader>
                          <CardTitle>{dog.name}</CardTitle>
                          <CardDescription>
                            {dog.breed} • {dog.weight}{" "}
                            {dog.weight_unit || "lbs"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => {
                              onOpenChange(false);
                              // Clear saved plan builder state so user starts fresh
                              localStorage.removeItem("nouripet-plan-builder");
                              // Use URL parameter to indicate fresh start (more reliable than localStorage)
                              router.push(
                                `/plan-builder?dog_id=${dog.id}&fresh_start=true`,
                              );
                            }}
                            className="w-full sm:w-auto"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Subscription Plan
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription? You'll continue
              to have access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelConfirm(false);
                setSubscriptionToCancel(null);
              }}
            >
              No, Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Yes, Cancel Subscription
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topper Cancel Confirmation Dialog */}
      <Dialog
        open={!!topperToCancel}
        onOpenChange={(open) => !open && setTopperToCancel(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <XCircle className="h-5 w-5" />
              Cancel Topper Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your{" "}
              <strong>{topperToCancel?.name}</strong> subscription? You'll
              continue to receive toppers until the end of your current billing
              period.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setTopperToCancel(null)}
              disabled={isCancellingTopper}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTopperSubscription}
              disabled={isCancellingTopper}
            >
              {isCancellingTopper ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Topper Modify Dialog */}
      <Dialog
        open={!!topperToModify}
        onOpenChange={(open) => !open && setTopperToModify(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Change Topper Plan
            </DialogTitle>
            <DialogDescription>
              Select a new topper percentage for{" "}
              {topperToModify?.dogName || "your dog"}. Currently on{" "}
              <strong>
                {getTopperProductTypeName(topperToModify?.productType || "")}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {["25", "50", "75"]
              .filter((level) => level !== topperToModify?.productType)
              .map((level) => (
                <div
                  key={level}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedNewLevel === level
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => setSelectedNewLevel(level)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{level}% Topper Plan</div>
                      <div className="text-sm text-muted-foreground">
                        {level === "25" && "Light supplementation"}
                        {level === "50" && "Balanced mix"}
                        {level === "75" && "Maximum fresh food"}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedNewLevel === level
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTopperToModify(null);
                setSelectedNewLevel("");
              }}
              disabled={isModifyingTopper}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModifyTopperSubscription}
              disabled={!selectedNewLevel || isModifyingTopper}
            >
              {isModifyingTopper ? "Updating..." : "Update Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
