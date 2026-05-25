'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LinkWithBackProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

const STORAGE_KEY = 'navigation_history_v2';

export default function LinkWithBack({ href, children, className, onClick }: LinkWithBackProps) {
  const currentPath = usePathname();

  const handleClick = () => {
    if (typeof window !== 'undefined') {
      try {
        let history: { stack: string[]; contexts: Record<string, { backTo: string }> } = { stack: [], contexts: {} };
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          history = JSON.parse(stored);
        }
        
        const targetPath = href.split('?')[0]!;
        history.contexts = history.contexts || {};
        history.contexts[targetPath] = {
          backTo: currentPath,
        };
        
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to set navigation context:', error);
      }
    }
    onClick?.();
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
