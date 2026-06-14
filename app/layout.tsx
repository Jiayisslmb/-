//全局布局
import './globals.css';
import type { Metadata, Viewport } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import GlobalBackground from '@/components/layout/GlobalBackground';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import BackendStatusBanner from '@/components/common/BackendStatusBanner';
import ConnectionStatusWrapper from '@/components/common/ConnectionStatusWrapper';
import { AuthProvider } from '@/lib/auth';
import { IPFSProvider } from '@/lib/ipfs';
import { PreferencesProvider } from '@/lib/preferences';
import { ChatbotProvider } from '@/components/chatbot/ChatbotProvider';
import { P2PProviderLoader } from '@/components/p2p/P2PProviderLoader';
import { ChatbotButtonLoader } from '@/components/chatbot/ChatbotButtonLoader';

export const viewport: Viewport = {
  themeColor: '#6364FF',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'DeSocial - 去中心化个人社交平台',
  description: '基于Web3技术的去中心化社交网络，保护用户隐私和数据主权。支持IPFS存储、端到端加密私信、AI聊天助手。',
  metadataBase: new URL('https://www.desocial.top'),
  openGraph: {
    type: 'website',
    siteName: 'DeSocial',
    title: 'DeSocial - 去中心化个人社交平台',
    description: '基于Web3技术的去中心化社交网络，保护用户隐私和数据主权。',
    url: 'https://www.desocial.top',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DeSocial - 去中心化个人社交平台',
    description: '基于Web3技术的去中心化社交网络，保护用户隐私和数据主权。',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-white text-gray-900">
        <a href="#main-content" className="skip-link">跳转到主内容</a>
        <ErrorBoundary severity="page">
          <AuthProvider>
            <IPFSProvider>
              <P2PProviderLoader>
                <PreferencesProvider>
                  <ChatbotProvider>
                    <BackendStatusBanner />
                    <GlobalBackground />
                    <Header />
                    <main id="main-content" className="container mx-auto px-4 py-8 min-h-screen relative z-10 pb-16 md:pb-8 page-enter">
                      <ErrorBoundary severity="section">
                        {children}
                      </ErrorBoundary>
                    </main>
                    <Footer />
                    <BottomNav />
                    <ChatbotButtonLoader />
                    <ConnectionStatusWrapper />
                  </ChatbotProvider>
                </PreferencesProvider>
              </P2PProviderLoader>
            </IPFSProvider>
          </AuthProvider>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
