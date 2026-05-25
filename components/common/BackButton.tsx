'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBackButton } from '@/lib/hooks/useNavigation';

interface BackButtonProps {
  className?: string;
  onBack?: () => void;
  fallback?: string;
  confirmMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'primary';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const variantClasses = {
  default: 'text-gray-600 hover:text-blue-600 hover:bg-gray-100',
  ghost: 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
  primary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
};

export default function BackButton({
  className = '',
  onBack,
  fallback,
  confirmMessage,
  size = 'md',
  variant = 'default',
}: BackButtonProps) {
  const { handleBack, canGoBack } = useBackButton({
    onBack,
    fallback,
    confirmMessage,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(canGoBack);
  }, [canGoBack]);

  const handleClick = useCallback(() => {
    handleBack();
  }, [handleBack]);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 
        px-2 py-1.5 rounded-lg
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        active:scale-95
        ${variantClasses[variant]}
        ${className}
      `}
      title="返回"
      aria-label="返回"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    </button>
  );
}
