import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold mb-2 text-gray-900">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg 
                   focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20
                   placeholder-gray-400 transition-all duration-200
                   hover:border-gray-400
                   ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} 
                   ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1.5 font-medium">{error}</p>}
      {helperText && !error && <p className="text-gray-500 text-sm mt-1.5">{helperText}</p>}
    </div>
  );
}
