'use client';

import { useState, useRef, type KeyboardEvent } from 'react';

interface ChatbotInputProps {
  onSend: (text: string) => void;
  isLoading: boolean;
}

export default function ChatbotInput({ onSend, isLoading }: ChatbotInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-3 flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="询问平台相关问题... (Enter发送)"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6364FF] focus:border-transparent"
        disabled={isLoading}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || isLoading}
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#6364FF] text-white hover:bg-[#5558DD] disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}
