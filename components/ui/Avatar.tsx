import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  className?: string;
}

export default function Avatar({ src, alt = '用户头像', size = 'md', name = 'User', className = '' }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-sm ${className}`}
      />
    );
  }

  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#6364FF] to-[#8B83FF] text-white flex items-center justify-center font-bold shadow-sm ${className}`}>
      {initial}
    </div>
  );
}
