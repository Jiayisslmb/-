// 轻量级 Toast 通知 — 替代浏览器 alert()

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
}

function showToast(message: string, type: ToastType, options?: ToastOptions) {
  if (typeof document === 'undefined') return;

  const duration = options?.duration || 3000;

  const container = document.getElementById('toast-container') || createContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  const bg = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  }[type];

  const textColor = '#fff';

  toast.style.cssText = `
    background: ${bg};
    color: ${textColor};
    padding: 10px 18px;
    border-radius: 8px;
    margin: 4px 0;
    font-size: 14px;
    max-width: 360px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: toast-in 0.25s ease-out;
    pointer-events: auto;
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'opacity 0.2s, transform 0.2s';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

function createContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    pointer-events: none;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(container);
  return container;
}

const toast = {
  success(msg: string, opts?: ToastOptions) { showToast(msg, 'success', opts); },
  error(msg: string, opts?: ToastOptions) { showToast(msg, 'error', opts); },
  info(msg: string, opts?: ToastOptions) { showToast(msg, 'info', opts); },
  warning(msg: string, opts?: ToastOptions) { showToast(msg, 'warning', opts); },
};

export { toast };
