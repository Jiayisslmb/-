import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../ErrorBoundary';

function BrokenComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error('Test error message');
  return <div>OK</div>;
}

function suppressErrorLog(cb: () => void) {
  const orig = console.error;
  console.error = vi.fn();
  cb();
  console.error = orig;
}

afterEach(() => cleanup());

describe('ErrorBoundary', () => {
  it('渲染子组件当无错误时', () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    expect(container.textContent).toContain('Normal content');
  });

  it('捕获错误并显示page级别的fallback UI', () => {
    suppressErrorLog(() => {
      render(
        <ErrorBoundary severity="page">
          <BrokenComponent />
        </ErrorBoundary>
      );
    });
    expect(screen.getByText('页面加载异常')).toBeDefined();
    expect(screen.getByText(/Test error message/)).toBeDefined();
  });

  it('捕获错误并显示section级别的fallback UI', () => {
    suppressErrorLog(() => {
      render(
        <ErrorBoundary severity="section">
          <BrokenComponent />
        </ErrorBoundary>
      );
    });
    expect(screen.getByText('组件加载失败')).toBeDefined();
  });

  it('捕获错误并显示inline级别的fallback UI', () => {
    suppressErrorLog(() => {
      render(
        <ErrorBoundary severity="inline">
          <BrokenComponent />
        </ErrorBoundary>
      );
    });
    expect(screen.getByText('重试')).toBeDefined();
  });

  it('默认使用section severity', () => {
    suppressErrorLog(() => {
      render(
        <ErrorBoundary>
          <BrokenComponent />
        </ErrorBoundary>
      );
    });
    expect(screen.getByText('组件加载失败')).toBeDefined();
  });

  it('点击重试按钮后重新渲染子组件', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    function ToggleComponent() {
      if (shouldThrow) throw new Error('toggle error');
      return <div>Recovered!</div>;
    }

    suppressErrorLog(() => {
      const { rerender, unmount } = render(
        <ErrorBoundary severity="section">
          <ToggleComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('组件加载失败')).toBeDefined();

      // Click retry, then re-render with shouldThrow=false
      shouldThrow = false;

      // The ErrorBoundary's retry button resets internal state,
      // but ToggleComponent still uses the closure variable.
      // Click retry to reset the boundary, then re-render.
      const retryBtn = screen.getByText('重试');
      retryBtn.click();

      // Re-render with updated state — the boundary should now show children
      rerender(
        <ErrorBoundary severity="section">
          <ToggleComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Recovered!')).toBeDefined();
      unmount();
    });
  });

  it('接受自定义fallback', () => {
    suppressErrorLog(() => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <BrokenComponent />
        </ErrorBoundary>
      );
    });
    expect(screen.getByText('Custom error UI')).toBeDefined();
  });

  it('调用onError回调', () => {
    const onError = vi.fn();
    suppressErrorLog(() => {
      render(
        <ErrorBoundary onError={onError}>
          <BrokenComponent />
        </ErrorBoundary>
      );
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
