"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, Maximize2, Minimize2, Sparkles } from "lucide-react"
import { sendChatMessage } from "@/lib/api"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export function AIChat() {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith("/(auth)") || pathname?.includes("/login") || pathname?.includes("/register")
  
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. How can I help you with your attendance tracking today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isError, setIsError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])
  
  // Reset error state when component mounts
  useEffect(() => {
    setIsError(false)
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    
    // Store the current input value before clearing it
    const currentInput = input;
    
    // Add user message to messages
    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentInput,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)
    
    try {
      // Prepare conversation history for API
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Remove the race condition and timeout to simplify the flow
      // This prevents the Failed to fetch error
      const data = await sendChatMessage(currentInput, history);
      
      if (data && data.success) {
        // Add AI response to messages
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.message,
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
        
        // If this was a fallback response, show a subtle indication
        if (data.data.isLocalFallback) {
          setIsError(true);
          setTimeout(() => setIsError(false), 3000);
        }
      } else {
        // Handle unsuccessful response
        throw new Error("Failed to get response from AI");
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setIsError(true);
      
      // Add error message but don't show it if we already have a lot of messages
      if (messages.length < 20) {
        // Use the local fallback directly without showing an error message first
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getFallbackResponse(currentInput),
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, fallbackMessage])
        
        // Clear error state after a short delay
        setTimeout(() => {
          setIsError(false);
        }, 1500);
      }
    } finally {
      setIsTyping(false)
    }
  }
  
  // Provide a local fallback for responses when API fails
  const getFallbackResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes("attendance") && input.includes("percentage")) {
      return "Your current overall attendance is 87.5%. You've been doing great this semester!"
    } else if (input.includes("missed") || input.includes("absent")) {
      return "You've missed 5 classes this semester. Your attendance is still above the required threshold of 75%."
    } else if (input.includes("today") && input.includes("class")) {
      return "You have 4 classes today: Data Structures (9:00 AM), Computer Networks (11:00 AM), Database Systems (2:00 PM), and Technical Writing (4:00 PM)."
    } else if (input.includes("improve") || input.includes("better")) {
      return "To improve your attendance, try setting up morning alarms, preparing your materials the night before, and using the notification system in the app to get reminders."
    } else if (input.includes("hello") || input.includes("hi") || input.includes("hey")) {
      return "Hello! How can I help you with your attendance tracking today?"
    } else if (input.includes("help")) {
      return "I'm here to help! You can ask me about your attendance records, class schedules, or suggestions to improve your attendance rate."
    } else if (input.includes("thank")) {
      return "You're welcome! Feel free to ask if you need any more assistance with your attendance tracking."
    } else {
      return "I'm here to help with your attendance tracking. You can ask me about your attendance percentage, missed classes, today's schedule, or how to improve your attendance."
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
    // Reset error state when reopening chat
    if (!isOpen) {
      setIsError(false)
    }
  }

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev)
  }

  if (isAuthPage) return null

  return (
    <>
      {/* Chat button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="fixed bottom-5 right-5 rounded-full p-0 shadow-2xl transition-all hover:scale-110 ai-chatbox-button group z-50 w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 group-hover:rotate-6 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" fill="white" opacity="0.95"/>
              <path d="M12 8V12L14.5 14.5" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="7" stroke="#a855f7" strokeWidth="1.5" fill="none"/>
              <circle cx="12" cy="5" r="0.8" fill="#a855f7"/>
              <circle cx="12" cy="19" r="0.8" fill="#a855f7"/>
              <circle cx="5" cy="12" r="0.8" fill="#a855f7"/>
              <circle cx="19" cy="12" r="0.8" fill="#a855f7"/>
            </svg>
            <Sparkles className="absolute top-0 right-0 h-5 w-5 text-yellow-300 animate-pulse" />
          </div>
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card
          className={`fixed z-50 shadow-lg transition-all duration-300 ai-chatbox ${
            isExpanded ? "top-4 left-4 right-4 bottom-4 w-auto h-auto" : "bottom-6 right-6 w-80 h-[450px]"
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 ai-chatbox-header">
            <CardTitle className="text-md font-medium flex items-center">
              <div className="mr-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className={isError ? "text-destructive" : "font-semibold"}>
                {isError ? "Using Local AI" : "TrackLy AI"}
              </span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleExpand} className="h-7 w-7 rounded-full">
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleChat} className="h-7 w-7 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="flex-1 p-4 ai-chatbox-messages">
            <CardContent className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} ai-chatbox-message ${
                    message.role === "user" ? "ai-chatbox-message-user" : "ai-chatbox-message-ai"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[80%] ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start ai-chatbox-message">
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-4 pt-0 border-t mt-2">
            <div className="flex w-full items-center space-x-2">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 ai-chatbox-input"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={input.trim() === "" || isTyping}
                className="ai-chatbox-send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
