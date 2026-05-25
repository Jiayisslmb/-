'use client';

import { useChatbot } from './ChatbotProvider';
import ChatbotPanel from './ChatbotPanel';

export default function ChatbotButton() {
  const { isOpen, togglePanel } = useChatbot();

  return (
    <>
      {/* Floating button */}
      <button
        onClick={togglePanel}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#6364FF] text-white shadow-lg hover:bg-[#5558DD] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : ''
        }`}
        title="AI 助手"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Close button overlay */}
          <button
            onClick={togglePanel}
            className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 flex items-center justify-center text-sm"
          >
            ✕
          </button>
          <ChatbotPanel />
        </div>
      )}
    </>
  );
}
