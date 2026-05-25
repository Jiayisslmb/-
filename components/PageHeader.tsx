'use client';

import Link from 'next/link';
import Button from './ui/Button';
import BackButton from './common/BackButton';

interface ButtonProps {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface PageHeaderProps {
  title: string;
  buttons?: ButtonProps[];
  showBackButton?: boolean;
}

export default function PageHeader({ title, buttons = [], showBackButton = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-slideDown">
      <div className="flex items-center gap-4">
        {showBackButton && <BackButton fallback="/" />}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <div className="mt-1 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
        </div>
      </div>
      <div className="flex gap-3">
        {buttons.map((button, index) => (
          <Link key={index} href={button.href}>
            <Button variant={button.variant || 'primary'}>
              {button.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
