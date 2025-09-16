"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { MessageCircle, Send, Bot, User, Phone, Mail, Minimize2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ChatMessage {
  id: string
  type: "user" | "bot" | "agent"
  message: string
  timestamp: Date
  isTyping?: boolean
}

export function SupportChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "bot",
      message: `Hi ${user?.name || "there"}! I'm here to help with any questions about your NouriPet experience. How can I assist you today?`,
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      message: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        message: getBotResponse(inputMessage),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)

    console.log("[v0] support_message_sent", { message: inputMessage })
  }

  const getBotResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("order") || lowerMessage.includes("delivery")) {
      return "I can help you track your order! You can view your order status in your dashboard or use our tracking page. Would you like me to connect you with a human agent for more detailed assistance?"
    }
    if (lowerMessage.includes("recipe") || lowerMessage.includes("food")) {
      return "Our recipes are crafted by veterinary nutritionists using fresh, locally-sourced ingredients. You can view detailed nutritional breakdowns for each recipe. Is there a specific recipe you'd like to know more about?"
    }
    if (lowerMessage.includes("subscription") || lowerMessage.includes("billing")) {
      return "I can help with subscription questions! You can manage your subscription, pause deliveries, or update payment methods in your account settings. Need help with something specific?"
    }
    if (lowerMessage.includes("health") || lowerMessage.includes("vet")) {
      return "For health-related questions, I recommend consulting with your veterinarian. However, I can help you understand our nutritional information and how to contact our veterinary nutrition team."
    }

    return "Thanks for your message! I'm here to help with orders, recipes, subscriptions, and general questions. For complex issues, I can connect you with our support team. What would you like to know more about?"
  }

  const handleConnectAgent = () => {
    const agentMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "bot",
      message:
        "I'm connecting you with a human agent. They'll be with you shortly! In the meantime, you can also reach us at support@nouripet.com or (555) 123-4567.",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, agentMessage])
    console.log("[v0] agent_connection_requested")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[600px] p-0 gap-0">
        <Card className="h-full border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">NouriPet Support</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                <Bot className="h-3 w-3 mr-1" />
                AI Assistant
              </Badge>
              <Button variant="outline" size="sm" onClick={handleConnectAgent}>
                Connect to Agent
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col h-full p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.type !== "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {message.type === "user" && (
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
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  (555) 123-4567
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  support@nouripet.com
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
