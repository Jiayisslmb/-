// Footer 组件 - Mastodon风格

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6364FF] to-[#8B83FF] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900">DeSocial</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              去中心化社交平台，基于Web3技术，保护用户隐私和数据主权。
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">平台</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  联系我们
                </Link>
              </li>
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  博客
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">支持</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  帮助中心
                </Link>
              </li>
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  常见问题
                </Link>
              </li>
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  反馈
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">法律</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  服务条款
                </Link>
              </li>
              <li>
                <Link href="/settings/about" className="text-gray-600 hover:text-[#6364FF] transition-colors duration-200 font-medium">
                  Cookie设置
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {currentYear} DeSocial. 基于开源协议发布。
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-full">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            系统运行正常 · 去中心化网络
          </div>
        </div>
      </div>
    </footer>
  );
}
