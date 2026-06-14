import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Badge({
  variant = 'primary',
  size = 'md',
  children
}: BadgeProps) {
  const variantClasses = {
    primary: 'bg-[var(--mastodon-primary-light)] text-[var(--mastodon-primary)]',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    danger: 'bg-red-100 text-red-700'
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}
