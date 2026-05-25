'use client';

import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { sendMessage } from '@/lib/chatbot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatbotContextType {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  togglePanel: () => void;
  send: (text: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error('useChatbot must be used within ChatbotProvider');
  return ctx;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是平台AI助手，可以帮你了解去中心化社交平台的功能和使用方法。请问有什么想了解的？',
  timestamp: Date.now(),
};

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  const send = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      let streamedContent = '';
      await sendMessage(
        apiMessages,
        (chunk) => {
          streamedContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, content: streamedContent } : m,
            ),
          );
        },
        controller.signal,
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorText = err instanceof Error ? err.message : '请求失败，请稍后重试';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `❌ ${errorText}` } : m,
        ),
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  return (
    <ChatbotContext.Provider value={{ messages, isOpen, isLoading, togglePanel, send, clearMessages }}>
      {children}
    </ChatbotContext.Provider>
  );
}
