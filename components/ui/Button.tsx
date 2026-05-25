import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'bg-[#6364FF] hover:bg-[#5558DD] text-white shadow-sm hover:shadow-md active:scale-95',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 hover:text-black',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-95',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md active:scale-95',
    ghost: 'bg-transparent hover:bg-[#F0EFFF] text-[#6364FF] hover:text-[#5558DD]'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-5 py-2.5 text-base rounded-lg',
    lg: 'px-7 py-3.5 text-lg rounded-lg'
  };

  const baseClasses = 'font-medium transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center gap-2';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
