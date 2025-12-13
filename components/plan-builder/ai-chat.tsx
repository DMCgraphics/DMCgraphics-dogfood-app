"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MultiDogProfile, AIRecommendation } from "@/lib/multi-dog-types"

interface AIChatProps {
  dogProfile: MultiDogProfile
  recommendation: AIRecommendation
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AIChat({ dogProfile, recommendation }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)

    // Add user message immediately
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }]
    setMessages(newMessages)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dogProfile,
          recommendation,
          messages: newMessages,
          question: userMessage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages([...newMessages, { role: "assistant", content: data.answer }])
      } else {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: "I'm having trouble answering that right now. Please try asking another question!",
          },
        ])
      }
    } catch (error) {
      console.error("[AI Chat] Error:", error)
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I'm having trouble answering that right now. Please try asking another question!",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="w-full justify-start text-sm gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Ask questions about this recommendation
      </Button>
    )
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Ask me anything about {dogProfile.name}'s nutrition
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="h-auto p-1">
            <span className="text-xs">Close</span>
          </Button>
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 max-w-[85%] text-sm",
                    message.role === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-purple-900/30 text-gray-900 dark:text-gray-100"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${dogProfile.name}'s nutrition...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground italic">
          I'm here to answer questions about ingredients, portion sizes, and nutrition for {dogProfile.name}!
        </p>
      </CardContent>
    </Card>
  )
}
