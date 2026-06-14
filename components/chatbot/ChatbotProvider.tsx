'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { sendMessage } from '@/lib/chatbot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: number;
}

interface Conversation {
  id: number;
  title: string;
  model: string;
  updatedAt: string;
}

interface ChatbotContextType {
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  tokenUsage: { estimated: number; max: number };
  conversations: Conversation[];
  activeConversationId: number | null;
  pendingImage: File | null;
  mode: 'auto' | 'fast' | 'deep';
  togglePanel: () => void;
  send: (text: string) => Promise<void>;
  clearMessages: () => void;
  createNewConversation: () => void;
  switchConversation: (id: number) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  setPendingImage: (file: File | null) => void;
  setMode: (mode: 'auto' | 'fast' | 'deep') => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);
const ESTIMATED_MAX_TOKENS = 2048;

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是平台AI助手，专注于解答平台相关问题。你可以上传图片让我识别，我会自动判断使用快速或深度模式。',
  timestamp: Date.now(),
};

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState({ estimated: 0, max: ESTIMATED_MAX_TOKENS });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [mode, setMode] = useState<'auto' | 'fast' | 'deep'>('auto');
  const abortRef = useRef<AbortController | null>(null);

  // Load conversations on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/chatbot/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch(() => {});
  }, []);

  const togglePanel = useCallback(() => setIsOpen(p => !p), []);

  const createNewConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setActiveConversationId(null);
    setPendingImage(null);
    setTokenUsage({ estimated: 0, max: ESTIMATED_MAX_TOKENS });
  }, []);

  const switchConversation = useCallback(async (id: number) => {
    setActiveConversationId(id);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/chatbot/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.map((m: any) => ({
          id: String(m.id),
          role: m.role,
          content: m.content,
          imageUrl: m.imageUrl,
          timestamp: new Date(m.createdAt).getTime(),
        })));
      }
    } catch {}
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/chatbot/conversations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      createNewConversation();
    }
  }, [activeConversationId, createNewConversation]);

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setTokenUsage({ estimated: 0, max: ESTIMATED_MAX_TOKENS });
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() && !pendingImage) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text || '[图片]',
      imageUrl: pendingImage ? URL.createObjectURL(pendingImage) : undefined,
      timestamp: Date.now(),
    };

    // Convert & compress image to base64 (Vercel proxy limit: 4.5MB)
    let imageBase64: string | undefined;
    if (pendingImage) {
      imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          // Skip compression for small images
          if (pendingImage.size < 500 * 1024) {
            resolve(dataUrl);
            return;
          }
          // Compress large images to max 1024px on longest side
          const img = new Image();
          img.onload = () => {
            const maxDim = 1024;
            let w = img.width, h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
              else { w = Math.round(w * maxDim / h); h = maxDim; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(pendingImage);
      });
    }

    setMessages(prev => [...prev, userMsg]);
    setPendingImage(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let fullContent = '';
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      await sendMessage(
        [{ role: 'user', content: text || '[图片]', ...(imageBase64 ? { imageUrl: imageBase64 } : {}) }],
        (chunk) => {
          fullContent += chunk;
          setMessages(prev => prev.map(m =>
            m.id === assistantMsg.id ? { ...m, content: fullContent } : m
          ));
        },
        controller.signal,
        activeConversationId || undefined,
        mode
      );

      // Update token estimate
      setTokenUsage(prev => ({
        ...prev,
        estimated: prev.estimated + Math.ceil((text.length + fullContent.length) * 0.5),
      }));

      // Refresh conversation list
      const token = localStorage.getItem('token');
      if (token) {
        fetch('/api/chatbot/conversations', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(data => { if (Array.isArray(data)) setConversations(data); })
          .catch(() => {});
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: '抱歉，请求出错了：' + (err.message || '未知错误'),
          timestamp: Date.now(),
        }]);
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [pendingImage, activeConversationId, mode]);

  const value: ChatbotContextType = {
    messages, isOpen, isLoading, tokenUsage,
    conversations, activeConversationId,
    pendingImage, mode,
    togglePanel, send, clearMessages,
    createNewConversation, switchConversation, deleteConversation,
    setPendingImage, setMode,
  };

  return React.createElement(ChatbotContext.Provider, { value }, children);
}

export function useChatbot() {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error('useChatbot must be used within ChatbotProvider');
  return ctx;
}
