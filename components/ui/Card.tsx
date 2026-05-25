import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'glass';
  children: React.ReactNode;
}

export default function Card({
  hoverable = false,
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-white rounded-xl border border-gray-200/80 shadow-sm',
    elevated: 'bg-white rounded-2xl shadow-lg border border-gray-100',
    glass: 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50'
  };

  const hoverClasses = hoverable 
    ? 'hover:shadow-xl hover:border-[#6364FF]/30 hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer' 
    : '';

  return (
    <div
      className={`${variantClasses[variant]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
