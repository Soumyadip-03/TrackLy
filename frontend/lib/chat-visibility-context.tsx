"use client"

import React, { createContext, useContext } from "react"

const ChatVisibilityContext = createContext<{ hideChatBox: boolean }>({ hideChatBox: false })

export function ChatVisibilityProvider({ children }: { children: React.ReactNode }) {
  return (
    <ChatVisibilityContext.Provider value={{ hideChatBox: false }}>
      {children}
    </ChatVisibilityContext.Provider>
  )
}

export function useChatVisibility() {
  return useContext(ChatVisibilityContext)
}
