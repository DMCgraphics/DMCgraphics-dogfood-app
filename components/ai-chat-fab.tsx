"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { MessageCircle, Send, Bot, User, X, Maximize2, Minimize2, ExternalLink, History, Plus, PanelLeftClose, PanelLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getInitialQuickActions, getContextualQuickActions, type QuickAction } from "@/lib/ai/quick-actions"
import { MessageCard, type CardType } from "@/components/ai-chat/message-card"
import { formatMessageContent } from "@/lib/ai/message-formatter"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  cards?: Array<{
    type: CardType
    data: any
  }>
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
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [conversations, setConversations] = useState<Array<{ id: string; title: string; last_message_at: string }>>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [historySheetOpen, setHistorySheetOpen] = useState(false)
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

  // Auto-fullscreen on mobile when opening chat
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        setIsFullscreen(true)
      }
    }
  }, [isOpen])

  // Initialize with welcome message and quick actions when dialog opens
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

      // Show initial quick actions
      const initialActions = getInitialQuickActions(isAuthenticated)
      setQuickActions(initialActions)

      // Mark as animated on first open
      setHasAnimated(true)
    }
  }, [isOpen, isAuthenticated, user?.name])

  // Fetch conversation history when dialog opens (for authenticated users)
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchConversations()
    }
  }, [isOpen, isAuthenticated])

  // Reset conversation when dialog closes (for fresh start on reopen)
  useEffect(() => {
    if (!isOpen) {
      // Clear messages and conversation ID for new conversation on next open
      setMessages([])
      setConversationId(undefined)
      setError(null)
      setHasAnimated(false)
    }
  }, [isOpen])

  const fetchConversations = async () => {
    if (!isAuthenticated) return

    try {
      setLoadingConversations(true)
      const response = await fetch("/api/ai/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversation = async (convId: string) => {
    try {
      setIsTyping(true)
      const response = await fetch(`/api/ai/conversations/${convId}/messages`)
      if (!response.ok) {
        throw new Error("Failed to load conversation")
      }

      const data = await response.json()

      // Convert database messages to ChatMessage format
      const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        cards: msg.metadata?.cards || undefined,
      }))

      setMessages(loadedMessages)
      setConversationId(convId)
      setQuickActions([]) // Clear quick actions for loaded conversation
      setHistorySheetOpen(false) // Close mobile sheet after selection
    } catch (error) {
      console.error("Error loading conversation:", error)
      setError("Failed to load conversation. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }

  const startNewConversation = () => {
    setMessages([])
    setConversationId(undefined)
    setError(null)
    setHistorySheetOpen(false) // Close mobile sheet

    // Show welcome message and initial quick actions
    const welcomeMessage: ChatMessage = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: isAuthenticated
        ? `Hi ${user?.name || "there"}! I'm Nouri, your NouriPet assistant. I can help with your orders, subscriptions, recipes, and nutrition questions. What can I help you with today?`
        : `Hi! I'm Nouri, your NouriPet assistant. Ask me about our recipes, nutrition, or how we work!`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])

    const initialActions = getInitialQuickActions(isAuthenticated)
    setQuickActions(initialActions)
  }

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
          conversationId: conversationId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from AI")
      }

      const data = await response.json()

      // Store conversationId if this is a new conversation
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        cards: data.cards || undefined,
      }

      setMessages((prev) => [...prev, botResponse])

      // Update quick actions based on AI response content
      const contextualActions = getContextualQuickActions(data.answer, isAuthenticated, 3)
      setQuickActions(contextualActions)
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

  const handleQuickActionClick = async (action: QuickAction) => {
    // Set the input to the action's prompt
    setInputMessage(action.prompt)

    // Wait for state to update, then send the message
    setTimeout(async () => {
      if (!action.prompt.trim()) return

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: action.prompt,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputMessage("")
      setIsTyping(true)
      setError(null)

      try {
        const conversationHistory = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

        const response = await fetch("/api/ai/support-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: action.prompt,
            conversationHistory,
            userId: isAuthenticated ? user?.id : undefined,
            currentPage: pathname,
            conversationId: conversationId,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get response from AI")
        }

        const data = await response.json()

        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId)
        }

        const botResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
          cards: data.cards || undefined,
        }

        setMessages((prev) => [...prev, botResponse])

        const contextualActions = getContextualQuickActions(data.answer, isAuthenticated, 3)
        setQuickActions(contextualActions)
      } catch (err) {
        console.error("AI Chat error:", err)
        setError("Sorry, I'm having trouble responding right now. Please try again or contact support@nouripet.net or call (203) 208-6186.")

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
    }, 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={true}>
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
        className={
          isFullscreen
            ? 'p-0 gap-0 flex !fixed !inset-0 !w-screen !h-[100dvh] !max-w-none !rounded-none !border-0 !shadow-none !translate-x-0 !translate-y-0 !top-0 !left-0 !m-0 z-[100]'
            : `p-0 gap-0 flex ${!hasAnimated ? 'animate-in slide-in-from-bottom-2 fade-in duration-300' : ''} sm:max-w-4xl h-[600px] max-h-[90vh] w-full`
        }
      >
        {/* Sidebar - Conversation History (authenticated users only, desktop only) */}
        {isAuthenticated && sidebarOpen && (
          <div className="hidden md:flex flex-col w-64 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {/* Sidebar Header */}
            <div className="p-4 border-b dark:border-gray-700">
              <Button
                onClick={startNewConversation}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loadingConversations ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
                        conversationId === conv.id ? 'bg-gray-200 dark:bg-gray-800' : ''
                      }`}
                    >
                      <div className="font-medium truncate">{conv.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {new Date(conv.last_message_at).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-3 border-b dark:border-gray-700">
            <div className="flex items-center gap-2 flex-1">
              {/* Sidebar Toggle (authenticated users only) */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden md:flex"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Nouri - Pet Nutrition Assistant</h2>
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
            </div>
            <div className="flex gap-1 ml-4">
              {/* Mobile Chat History Sheet */}
              {isAuthenticated && (
                <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:hidden"
                      title="Chat History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh]">
                    <SheetHeader>
                      <SheetTitle>Chat History</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col h-full pt-4">
                      {/* New Chat Button */}
                      <Button
                        onClick={startNewConversation}
                        className="w-full justify-start gap-2 mb-4"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                        New Chat
                      </Button>

                      {/* Conversations List */}
                      <div className="flex-1 overflow-y-auto">
                        {loadingConversations ? (
                          <div className="py-8 text-center text-sm text-gray-500">
                            Loading...
                          </div>
                        ) : conversations.length === 0 ? (
                          <div className="py-8 text-center text-sm text-gray-500">
                            No conversations yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {conversations.map((conv) => (
                              <button
                                key={conv.id}
                                onClick={() => loadConversation(conv.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                                  conversationId === conv.id
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className="font-medium truncate">{conv.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(conv.last_message_at).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden md:flex"
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
                  <div className="max-w-[80%]">
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 shadow-sm"
                      }`}
                    >
                      <div className="text-sm">
                        {formatMessageContent(message.content)}
                      </div>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {message.cards && message.cards.length > 0 && (
                      <div className="space-y-2">
                        {message.cards.map((card, index) => (
                          <MessageCard key={`card-${message.id}-${index}`} type={card.type} data={card.data} />
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 shadow-sm p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Nouri is thinking...</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"
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
            <div className="mb-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">
              {error}
            </div>
          )}

          {/* Quick Action Buttons */}
          {quickActions.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickActionClick(action)}
                    disabled={isTyping}
                    className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/40 dark:hover:to-blue-900/40 transition-all"
                  >
                    <Icon className="h-3 w-3 mr-1.5" />
                    {action.label}
                  </Button>
                )
              })}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
