'use client';

import { ChatbotProvider } from './ChatbotProvider';
import ChatbotButton from './ChatbotButton';

/**
 * Chatbot 动态加载包装器
 *
 * 将 ChatbotProvider + ChatbotButton 组合为一个组件，
 * 配合 next/dynamic 实现延迟加载，从首屏 JS Bundle 中移除。
 */
export default function ChatbotWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChatbotProvider>
      {children}
      <ChatbotButton />
    </ChatbotProvider>
  );
}
