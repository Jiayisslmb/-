'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { useChatbot } from './ChatbotProvider';

export default function ChatbotInput() {
  const { send, isLoading, pendingImage, setPendingImage } = useChatbot();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingImage) || isLoading) return;
    send(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingImage(file);
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canSend = (text.trim().length > 0 || !!pendingImage) && !isLoading;

  return (
    <div className="border-t border-gray-200 p-3 flex flex-col gap-2">
      {/* Image preview */}
      {pendingImage && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <img
              src={URL.createObjectURL(pendingImage)}
              alt="Preview"
              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
            />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-700 transition"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <span className="text-xs text-gray-400 truncate max-w-[120px]">{pendingImage.name}</span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#6364FF] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="上传图片"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Text input */}
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

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[#6364FF] text-white hover:bg-[#5558DD] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
