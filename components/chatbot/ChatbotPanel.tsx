'use client';

import { useRef, useEffect } from 'react';
import { useChatbot } from './ChatbotProvider';
import ChatbotMessage from './ChatbotMessage';
import ChatbotInput from './ChatbotInput';

export default function ChatbotPanel() {
  const { messages, isLoading, send, clearMessages } = useChatbot();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6364FF] flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI 助手</p>
            <p className="text-xs text-green-500">在线</p>
          </div>
        </div>
        <button
          onClick={clearMessages}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          清空对话
        </button>
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
