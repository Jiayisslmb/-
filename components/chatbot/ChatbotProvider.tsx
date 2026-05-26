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
  tokenUsage: { estimated: number; max: number };
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
  content: '你好！我是平台AI助手，专注于解答去中心化社交平台相关问题。请问有什么想了解的？',
  timestamp: Date.now(),
};

// Token optimization constants
const MAX_CONTEXT_MESSAGES = 10;
const MAX_USER_MESSAGE_LENGTH = 500;
const MAX_ASSISTANT_MESSAGE_LENGTH = 1000;
const ESTIMATED_MAX_TOKENS = 2048;

const ACKNOWLEDGEMENT_PATTERNS = /^(谢谢|好的|嗯|OK|知道了|明白了|了解了|收到)[\s!！。.,，]*$/i;

const OFF_TOPIC_PATTERNS = [
  '写代码', '编程', '帮我写', '生成代码', 'debug', '写个', '代码',
  '讲个笑话', '笑话', '段子', '搞笑',
  '天气', '天气预报', '今天天气',
  '推荐电影', '好看的电影', '看电影', '追剧',
  '做饭', '菜谱', '怎么做菜', '食谱',
  '游戏', '玩游戏', '打游戏', 'LOL', '王者',
  '股票', '炒股', '基金', '理财',
  '新闻', '时事', '政治',
];

const GREETING_PATTERNS = /^(你好|hi|hello|嗨|早上好|下午好|晚上好|在吗|在不|嗨喽)[\s!！。.,，]*$/i;

function estimateTokens(text: string): number {
  return Math.ceil(text.length * 0.5);
}

function truncateMessageContent(content: string, role: 'user' | 'assistant'): string {
  const maxLen = role === 'user' ? MAX_USER_MESSAGE_LENGTH : MAX_ASSISTANT_MESSAGE_LENGTH;
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen) + '...';
}

function isPlatformQuestion(text: string, previousMessages?: { role: string; content: string }[]): boolean {
  const lowerText = text.toLowerCase();

  // Allow greetings without platform keywords
  if (GREETING_PATTERNS.test(text.trim())) return true;

  // Block off-topic intents
  if (OFF_TOPIC_PATTERNS.some(p => lowerText.includes(p.toLowerCase()))) return false;

  // Co-reference check: if user references something from a previous AI response
  if (previousMessages && previousMessages.length > 0) {
    const lastAssistantMsg = [...previousMessages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg) {
      const aiContent = lastAssistantMsg.content;
      const userWords = lowerText.split(/\s+/).filter(w => w.length > 1);
      const coRefCount = userWords.filter(w => aiContent.includes(w)).length;
      if (coRefCount >= 3) return true;
    }
  }

  const platformKeywords = [
    '平台', '功能', '使用', '怎么', '如何', '什么', '帮助',
    '去中心化', 'IPFS', 'P2P', '区块链', '加密', '隐私',
    '圈子', '动态', '文章', '私信', '关注', '粉丝', '收藏',
    '设置', '个人', '主页', '搜索', '热门', '话题',
    '注册', '登录', '密码', '账号', '安全',
    '社交', '内容', '发布', '评论', '点赞', '转发',
    '钱包', '交易', 'NFT', '智能合约',
    '问题', '错误', '报错', 'bug', '故障',
  ];

  return platformKeywords.some(keyword => lowerText.includes(keyword));
}

function pruneContextMessages(
  messages: { role: 'user' | 'assistant'; content: string }[],
  currentQuestion: string,
): { role: 'user' | 'assistant'; content: string }[] {
  if (messages.length <= 4) return messages;

  const result: { role: 'user' | 'assistant'; content: string }[] = [];

  // Always keep the most recent 2 messages
  const recent = messages.slice(-2);
  const older = messages.slice(0, -2);

  // For older messages, keep only those relevant to current question
  const questionWords = new Set(currentQuestion.toLowerCase().split(/\s+/).filter(w => w.length > 1));

  for (const msg of older) {
    // Drop pure acknowledgements
    if (ACKNOWLEDGEMENT_PATTERNS.test(msg.content.trim())) continue;

    // Keep if shares keywords with current question or if it's a recent exchange
    const msgWords = msg.content.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const sharedWords = msgWords.filter(w => questionWords.has(w));
    if (sharedWords.length >= 2) {
      result.push(msg);
    }
  }

  result.push(...recent);

  // Cap at MAX_CONTEXT_MESSAGES
  return result.slice(-MAX_CONTEXT_MESSAGES);
}

function getNonPlatformResponse(): string {
  return '抱歉，我是平台专属助手，仅能回答与去中心化社交平台相关的问题。你可以询问我关于平台功能、使用方法、技术原理等方面的问题。';
}

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState({ estimated: 0, max: ESTIMATED_MAX_TOKENS });
  const abortRef = useRef<AbortController | null>(null);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setTokenUsage({ estimated: 0, max: ESTIMATED_MAX_TOKENS });
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmedText = text.trim();

    if (!isPlatformQuestion(trimmedText, messages)) {
      const rejectMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: getNonPlatformResponse(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: trimmedText.slice(0, MAX_USER_MESSAGE_LENGTH),
          timestamp: Date.now(),
        },
        rejectMsg,
      ]);
      return;
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: truncateMessageContent(trimmedText, 'user'),
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

    // Build context with smart pruning
    const rawContext = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: truncateMessageContent(m.content, m.role),
      }));
    const contextMessages = pruneContextMessages(rawContext, trimmedText);

    // Estimate token usage
    const totalChars = contextMessages.reduce((sum, m) => sum + m.content.length, 0);
    setTokenUsage({ estimated: Math.ceil(totalChars * 0.5), max: ESTIMATED_MAX_TOKENS });

    try {
      let streamedContent = '';
      await sendMessage(
        contextMessages,
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

      // Update token estimate after response
      const responseTokens = estimateTokens(streamedContent) + Math.ceil(totalChars * 0.5);
      setTokenUsage({ estimated: responseTokens, max: ESTIMATED_MAX_TOKENS });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errorText = err instanceof Error ? err.message : '请求失败，请稍后重试';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, content: `请求失败: ${errorText}` } : m,
        ),
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  return (
    <ChatbotContext.Provider value={{ messages, isOpen, isLoading, tokenUsage, togglePanel, send, clearMessages }}>
      {children}
    </ChatbotContext.Provider>
  );
}
