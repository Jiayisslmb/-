'use client';

import { useRef, useEffect } from 'react';
import { useChatbot } from './ChatbotProvider';
import ChatbotMessage from './ChatbotMessage';
import ChatbotInput from './ChatbotInput';

export default function ChatbotPanel() {
  const { messages, isLoading, tokenUsage, send, clearMessages } = useChatbot();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const usagePercent = tokenUsage.max > 0
    ? Math.min(100, Math.round((tokenUsage.estimated / tokenUsage.max) * 100))
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6364FF] flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI 助手</p>
            <p className="text-xs text-gray-400">问答模式</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Token usage indicator */}
          <div className="hidden sm:flex items-center gap-1.5" title={`Token 用量: ${tokenUsage.estimated}/${tokenUsage.max}`}>
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <span className={`text-xs ${usagePercent > 80 ? 'text-red-500' : 'text-gray-400'}`}>
              {usagePercent}%
            </span>
          </div>
          <button
            onClick={clearMessages}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            清空
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg) => (
          <ChatbotMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            isLoading={isLoading && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatbotInput onSend={send} isLoading={isLoading} />
    </div>
  );
}
