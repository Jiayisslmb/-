import Card from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">关于</h1>
      <div className="mb-6 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full" />
      <div className="space-y-6">
        {/* 关于 DeSocial */}
        <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
            <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">
              关于 DeSocial
            </h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6364FF] to-[#8B83FF] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--mastodon-text-primary)]">DeSocial</h3>
                <p className="text-sm text-[var(--mastodon-text-secondary)]">v2.1.0</p>
              </div>
            </div>
            <p className="text-[var(--mastodon-text-secondary)] leading-relaxed text-sm">
              DeSocial 是一个基于 Web3 技术的去中心化个人社交平台。我们致力于保护用户隐私和数据主权，
              通过 IPFS 分布式存储、端到端加密通信和 P2P 网络技术，为用户提供安全、自由的社交体验。
            </p>
            <p className="text-[var(--mastodon-text-secondary)] leading-relaxed text-sm">
              与传统的中心化社交平台不同，DeSocial 让用户真正拥有自己的数据和内容。
              你的动态、文章和媒体文件都存储在你控制的去中心化网络中。
            </p>
          </div>
        </Card>

        {/* 技术栈 */}
        <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
            <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">技术栈</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { name: 'Next.js', ver: '16', desc: '前端框架' },
                { name: 'NestJS', ver: '11', desc: '后端框架' },
                { name: 'Prisma ORM', ver: '6', desc: '数据库 ORM' },
                { name: 'MySQL', ver: '8.0', desc: '关系型数据库' },
                { name: 'Redis', ver: '7', desc: '缓存 & 实时' },
                { name: 'IPFS / Pinata', ver: '-', desc: '去中心化存储' },
                { name: 'Socket.IO', ver: '4', desc: '实时通信' },
                { name: 'Tailwind CSS', ver: '4', desc: '样式框架' },
              ].map((tech) => (
                <div
                  key={tech.name}
                  className="p-3 rounded-xl border border-[var(--mastodon-border-light)] bg-[var(--mastodon-bg)]"
                >
                  <p className="font-semibold text-[var(--mastodon-text-primary)]">
                    {tech.name}
                    <span className="text-xs text-[var(--mastodon-text-tertiary)] ml-1">
                      v{tech.ver}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--mastodon-text-tertiary)] mt-0.5">
                    {tech.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 法律信息 */}
        <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
            <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">法律信息</h2>
          </div>
          <div className="p-6 space-y-3">
            <a
              href="/settings/about"
              className="flex items-center justify-between p-3 rounded-xl border border-[var(--mastodon-border-light)] hover:bg-[var(--mastodon-bg)] transition-colors"
            >
              <span className="text-sm text-[var(--mastodon-text-primary)]">服务条款</span>
              <span className="text-[var(--mastodon-text-tertiary)]">→</span>
            </a>
            <a
              href="/settings/about"
              className="flex items-center justify-between p-3 rounded-xl border border-[var(--mastodon-border-light)] hover:bg-[var(--mastodon-bg)] transition-colors"
            >
              <span className="text-sm text-[var(--mastodon-text-primary)]">隐私政策</span>
              <span className="text-[var(--mastodon-text-tertiary)]">→</span>
            </a>
            <a
              href="/settings/about"
              className="flex items-center justify-between p-3 rounded-xl border border-[var(--mastodon-border-light)] hover:bg-[var(--mastodon-bg)] transition-colors"
            >
              <span className="text-sm text-[var(--mastodon-text-primary)]">Cookie 政策</span>
              <span className="text-[var(--mastodon-text-tertiary)]">→</span>
            </a>
          </div>
        </Card>

        {/* 开源协议 */}
        <Card className="border-[var(--mastodon-border)] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[var(--mastodon-border-light)] bg-gradient-to-r from-[var(--mastodon-bg)] to-[var(--mastodon-surface)]">
            <h2 className="text-base font-bold text-[var(--mastodon-text-primary)]">开源协议</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[var(--mastodon-text-secondary)] leading-relaxed mb-3">
              DeSocial 基于 MIT 开源协议发布。你可以自由使用、修改和分发本项目的代码。
            </p>
            <a
              href="https://github.com/Jiayisslmb/-"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[var(--mastodon-primary)] hover:underline font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub 仓库
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}
