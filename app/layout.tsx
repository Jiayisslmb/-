//全局布局
import './globals.css';
import type { Metadata } from 'next';
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
import { P2PProvider } from '@/components/p2p/P2PProvider';
import { ChatbotProvider } from '@/components/chatbot/ChatbotProvider';
import ChatbotButton from '@/components/chatbot/ChatbotButton';

export const metadata: Metadata = {
  title: '去中心化个人社交平台',
  description: '基于Next.js和区块链技术的去中心化社交网络',
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
              <P2PProvider>
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
                    <ChatbotButton />
                    <ConnectionStatusWrapper />
                  </ChatbotProvider>
                </PreferencesProvider>
              </P2PProvider>
            </IPFSProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
