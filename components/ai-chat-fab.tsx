"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { MessageCircle, Send, Bot, User, X, Maximize2, Minimize2, ExternalLink } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// Parse markdown links and convert to JSX
function parseMarkdownLinks(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Add the link
    const linkText = match[1]
    const linkUrl = match[2]
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium inline-flex items-center gap-1"
      >
        {linkText}
        <ExternalLink className="h-3 w-3" />
      </a>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function AIChatFAB() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Position FAB higher on plan builder to avoid footer overlap
  const isPlanBuilder = pathname === "/plan-builder"
  const fabBottomClass = isPlanBuilder ? "bottom-24" : "bottom-6"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message when dialog opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome-1",
        role: "assistant",
        content: isAuthenticated
          ? `Hi ${user?.name || "there"}! I'm Nouri, your NouriPet assistant. I can help with your orders, subscriptions, recipes, and nutrition questions. What can I help you with today?`
          : `Hi! I'm Nouri, your NouriPet assistant. Ask me about our recipes, nutrition, or how we work!`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, isAuthenticated, user?.name])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)
    setError(null)

    try {
      // Build conversation history for API
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch("/api/ai/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: inputMessage,
          conversationHistory,
          userId: isAuthenticated ? user?.id : undefined,
          currentPage: pathname,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from AI")
      }

      const data = await response.json()

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
    } catch (err) {
      console.error("AI Chat error:", err)
      setError("Sorry, I'm having trouble responding right now. Please try again or contact support@nouripet.net or call (203) 208-6186.")

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment or reach out to our support team at support@nouripet.net or call (203) 208-6186 for immediate assistance.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className={`fixed ${fabBottomClass} right-6 rounded-full h-14 w-14 shadow-lg z-50`}
          aria-label="Open AI chat assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className={`p-0 gap-0 flex flex-col ${
          isFullscreen
            ? 'w-full h-[100dvh] max-w-none max-h-none !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-none m-0'
            : 'sm:max-w-md h-[600px] max-h-[90vh]'
        }`}
      >
        <div className="flex items-center justify-between p-6 pb-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Nouri - AI Assistant</h2>
            <div className="flex gap-2 mt-2">
              <Badge className="text-xs bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700">
                <Bot className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              {isAuthenticated && (
                <Badge variant="outline" className="text-xs">
                  Logged in as {user?.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {parseMarkdownLinks(message.content)}
                    </div>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t flex-shrink-0">
          {error && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Ask about recipes, orders, or nutrition..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
              aria-label="Chat message input"
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
