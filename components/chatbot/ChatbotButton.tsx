'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useChatbot } from './ChatbotProvider';
import { useAuth } from '@/lib/auth';
import ChatbotPanel from './ChatbotPanel';

interface Position {
  x: number;
  y: number;
}

export default function ChatbotButton() {
  const { isAuthenticated } = useAuth();
  const { isOpen, togglePanel } = useChatbot();

  // 未登录不显示 AI 助手
  if (!isAuthenticated) return null;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number; dragging: boolean }>({
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    dragging: false,
  });

  const [position, setPosition] = useState<Position>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: position.x,
      startTop: position.y,
      dragging: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.dragging = true;
        setIsDragging(true);
      }

      if (dragRef.current.dragging) {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const btnW = 56;
        const btnH = 56;

        const newX = Math.max(0, Math.min(viewportW - btnW, dragRef.current.startLeft - dx));
        const newY = Math.max(0, Math.min(viewportH - btnH, dragRef.current.startTop - dy));

        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setTimeout(() => setIsDragging(false), 100);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startLeft: position.x,
      startTop: position.y,
      dragging: false,
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragRef.current.dragging = true;
        setIsDragging(true);
      }

      if (dragRef.current.dragging) {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const btnW = 56;
        const btnH = 56;

        const newX = Math.max(0, Math.min(viewportW - btnW, dragRef.current.startLeft - dx));
        const newY = Math.max(0, Math.min(viewportH - btnH, dragRef.current.startTop - dy));

        setPosition({ x: newX, y: newY });
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      setTimeout(() => setIsDragging(false), 100);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  }, [position]);

  const handleClick = useCallback(() => {
    if (!dragRef.current.dragging) {
      togglePanel();
    }
  }, [togglePanel]);

  return (
    <>
      {/* Draggable floating button */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
        className={`fixed z-50 w-14 h-14 rounded-full bg-[#6364FF] text-white shadow-lg hover:bg-[#5558DD] hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center select-none ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : ''
        } ${isDragging ? '!scale-110 shadow-2xl cursor-grabbing' : 'cursor-grab'}`}
        title="AI 助手 (可拖拽移动)"
      >
        <svg className="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          <ChatbotPanel />
        </div>
      )}
    </>
  );
}
