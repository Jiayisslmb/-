'use client';

import { useRef, useEffect, useState } from 'react';
import { useChatbot } from './ChatbotProvider';
import ChatbotMessage from './ChatbotMessage';
import ChatbotInput from './ChatbotInput';

export default function ChatbotPanel() {
  const {
    messages, isLoading, tokenUsage,
    conversations, activeConversationId, mode,
    togglePanel, clearMessages, createNewConversation,
    switchConversation, deleteConversation,
    setMode,
  } = useChatbot();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const usagePercent = tokenUsage.max > 0
    ? Math.min(100, Math.round((tokenUsage.estimated / tokenUsage.max) * 100))
    : 0;

  const modeOptions: { value: 'auto' | 'fast' | 'deep'; label: string }[] = [
    { value: 'auto', label: '自动' },
    { value: 'fast', label: '快速' },
    { value: 'deep', label: '深度' },
  ];

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 shadow-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition shrink-0"
            title={sidebarOpen ? '收起对话列表' : '展开对话列表'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#6364FF] flex items-center justify-center text-white text-sm font-bold">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI 助手</p>
            <p className="text-xs text-gray-400">问答模式</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Token usage indicator */}
          <div className="hidden sm:flex items-center gap-1.5" title={`Token 用量: ${tokenUsage.estimated}/${tokenUsage.max}`}>
            <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Mode toggle pills */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`text-xs px-2 py-1 rounded-md transition ${
                  mode === opt.value
                    ? 'bg-[#6364FF] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={clearMessages}
            className="text-xs text-gray-400 hover:text-gray-600 transition shrink-0"
          >
            清空
          </button>

          {/* Close button */}
          <button
            onClick={togglePanel}
            className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-row flex-1 min-h-0">
        {/* Left sidebar — collapsible */}
        <div className={`${sidebarOpen ? 'w-44' : 'w-0'} border-r border-gray-200 flex flex-col shrink-0 bg-gray-50 transition-all duration-200 overflow-hidden`}>
          <div className="p-2">
            <button
              onClick={createNewConversation}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-gray-300 bg-white hover:bg-[#F0EFFF] hover:border-[#6364FF] text-gray-700 transition text-left"
            >
              + 新对话
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-1 pb-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-xs transition ${
                  activeConversationId === conv.id
                    ? 'bg-[#F0EFFF] text-[#6364FF] font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="truncate flex-1">{conv.title || '未命名对话'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0"
                  title="删除对话"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">暂无对话</p>
            )}
          </div>
        </div>

        {/* Right message area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg) => (
              <ChatbotMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                imageUrl={msg.imageUrl}
                isLoading={isLoading && msg.role === 'assistant' && msg.id === messages[messages.length - 1]?.id}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5">
                  <span className="text-sm text-gray-500 animate-pulse">AI 思考中...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <ChatbotInput />
        </div>
      </div>
    </div>
  );
}
