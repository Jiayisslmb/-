'use client';

import dynamic from 'next/dynamic';

/**
 * ChatbotButton 延迟加载包装器
 *
 * 在 Client Component 中使用 dynamic() + ssr: false，
 * 将 AI 聊天浮动按钮及其面板从首屏 JS Bundle 中移除。
 */
const ChatbotButton = dynamic(() => import('./ChatbotButton'), { ssr: false });

export function ChatbotButtonLoader() {
  return <ChatbotButton />;
}
