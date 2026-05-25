'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

type Severity = 'page' | 'section' | 'inline';

interface ErrorBoundaryProps {
  children: ReactNode;
  severity?: Severity;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const severity = this.props.severity ?? 'section';

    if (this.props.fallback) return this.props.fallback;

    switch (severity) {
      case 'page':
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center p-8 max-w-md">
              <div className="text-5xl mb-4">⚠</div>
              <h2 className="text-xl font-bold mb-2">页面加载异常</h2>
              <p className="text-gray-500 mb-6 text-sm break-words">
                {this.state.error?.message || '发生了未知错误'}
              </p>
              <button
                onClick={this.handleRetry}
                className="px-6 py-2 bg-[#6364FF] text-white rounded-lg hover:bg-[#5558DD] transition"
              >
                重试
              </button>
            </div>
          </div>
        );

      case 'section':
        return (
          <div className="border border-red-200 bg-red-50 rounded-xl p-5 my-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">⚠</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-red-800 mb-1">组件加载失败</p>
                <p className="text-red-600 text-sm break-words">
                  {this.state.error?.message || '未知错误'}
                </p>
                <button
                  onClick={this.handleRetry}
                  className="mt-3 text-sm px-4 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        );

      case 'inline':
        return (
          <span className="inline-flex items-center gap-1 text-red-500 text-sm">
            <span>⚠</span>
            <button
              onClick={this.handleRetry}
              className="underline hover:text-red-700"
            >
              重试
            </button>
          </span>
        );

      default:
        return null;
    }
  }
}

export default ErrorBoundary;
