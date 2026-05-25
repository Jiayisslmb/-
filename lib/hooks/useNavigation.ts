'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export type BackBehavior = 'history' | 'specified';

export interface NavigationContext {
  backTo?: string;
  backLabel?: string;
}

interface NavigationHistory {
  stack: string[];
  contexts: Record<string, NavigationContext>;
}

const STORAGE_KEY = 'navigation_history_v2';

export function useNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<NavigationHistory>({ stack: [], contexts: {} });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load navigation history:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname) return;

    setHistory(prev => {
      const newStack = [...prev.stack];
      const newContexts = { ...prev.contexts };

      if (!initializedRef.current) {
        initializedRef.current = true;
        if (newStack.length === 0 || newStack[newStack.length - 1] !== pathname) {
          newStack.push(pathname);
        }
      } else {
        const lastIndex = newStack.lastIndexOf(pathname);
        if (lastIndex !== -1 && lastIndex < newStack.length - 1) {
          return {
            stack: newStack.slice(0, lastIndex + 1),
            contexts: newContexts,
          };
        }

        if (newStack[newStack.length - 1] !== pathname) {
          newStack.push(pathname);
        }
      }

      const updated = { stack: newStack, contexts: newContexts };

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save navigation history:', error);
      }

      return updated;
    });
  }, [pathname]);

  const getBackTarget = useCallback((): {
    path: string;
    label: string;
    behavior: BackBehavior;
  } => {
    if (!pathname) {
      return { path: '/', label: '首页', behavior: 'specified' };
    }

    const currentContext = history.contexts[pathname];
    if (currentContext?.backTo && currentContext.backTo !== pathname) {
      return {
        path: currentContext.backTo,
        label: currentContext.backLabel || '返回',
        behavior: 'specified',
      };
    }

    const currentIndex = history.stack.lastIndexOf(pathname);
    if (currentIndex > 0) {
      const previousPath = history.stack[currentIndex - 1];
      if (previousPath !== pathname) {
        return {
          path: previousPath,
          label: '返回',
          behavior: 'history',
        };
      }
    }

    return { path: '/', label: '首页', behavior: 'specified' };
  }, [pathname, history]);

  const goBack = useCallback((options?: {
    fallback?: string;
  }) => {
    const target = getBackTarget();
    let finalPath = target.path;

    if (options?.fallback && target.path === '/') {
      finalPath = options.fallback;
    }

    setHistory(prev => {
      const currentIndex = prev.stack.lastIndexOf(pathname || '');
      if (currentIndex > 0) {
        const newStack = prev.stack.slice(0, currentIndex);
        const newContexts = { ...prev.contexts };
        delete newContexts[pathname || ''];
        const updated = { stack: newStack, contexts: newContexts };

        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to update navigation history:', error);
        }

        return updated;
      }
      return prev;
    });

    router.push(finalPath);
  }, [getBackTarget, pathname, router]);

  return {
    currentPath: pathname,
    getBackTarget,
    goBack,
    canGoBack: true,
  };
}

export function useBackButton(options?: {
  onBack?: () => void;
  fallback?: string;
  confirmMessage?: string;
}) {
  const navigation = useNavigation();
  
  const handleBack = useCallback(() => {
    if (options?.onBack) {
      options.onBack();
      return;
    }

    if (options?.confirmMessage && typeof window !== 'undefined') {
      if (!window.confirm(options.confirmMessage)) {
        return;
      }
    }

    navigation.goBack({ fallback: options?.fallback });
  }, [navigation, options]);

  const getBackTargetWithFallback = useCallback(() => {
    const target = navigation.getBackTarget();
    if (options?.fallback && target.path === '/') {
      return {
        path: options.fallback,
        label: '返回',
        behavior: 'specified' as BackBehavior,
      };
    }
    return target;
  }, [navigation, options]);

  return {
    ...getBackTargetWithFallback(),
    handleBack,
    canGoBack: navigation.canGoBack,
  };
}
