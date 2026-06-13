# DeSocial 客户端

基于 Next.js 16 (App Router) + React 19 的去中心化社交平台前端。

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.2 |
| UI | React + Tailwind CSS 4 + Framer Motion | 19 / 4 / 12 |
| 状态管理 | React Context + SWR | 2.4 |
| 实时通信 | Socket.IO Client + libp2p | 4.8 / 3.1 |
| 去中心化 | IPFS (Pinata) | ipfs-http-client 60 |
| 类型校验 | Zod | 4.3 |
| AI | DeepSeek (SSE 流式) | v4-pro |
| 测试 | Vitest + Testing Library | 4.1 |
| 部署 | Cloudflare Pages (静态导出) | - |

## 项目结构

```
client/
├── app/                          # Next.js App Router 页面 (26个路由)
│   ├── layout.tsx                # 全局布局 (AuthProvider, IPFS, P2P, Chatbot)
│   ├── page.tsx                  # 首页 (ContentFeed + Sidebar + TrendingTopics)
│   ├── auth/                     # 登录/注册 (含 GitHub OAuth)
│   ├── profile/[username]/       # 用户主页 (动态/文章/收藏/点赞/作品)
│   ├── content/                  # 内容系统 (文章/动态 创建/详情)
│   ├── circles/                  # 圈子系统 (列表/创建/详情/设置/帖子)
│   ├── messages/                 # 私信系统 (列表/对话)
│   ├── admin/                    # 管理面板 (用户/内容/圈子/统计/举报)
│   ├── settings/                 # 设置 (资料/隐私/偏好/关注)
│   ├── search/                   # 全局搜索
│   ├── social/                   # 社交 (粉丝/关注列表)
│   ├── activities/               # 活动
│   └── topic/[name]/            # 话题页
├── components/
│   ├── auth/                     # GitHubLoginButton, GitHubAuthCallback
│   ├── chatbot/                  # AI 助手面板组件
│   ├── common/                   # ErrorBoundary, OnlineStatus, ConnectionStatus
│   ├── content/                  # ContentCard, ContentFeed, PostCreator
│   ├── ipfs/                     # IPFS 文件查看器
│   ├── layout/                   # Header, Sidebar, Footer, BottomNav
│   ├── p2p/                      # P2P 网络状态
│   ├── profile/                  # ProfileLayout
│   └── ui/                       # 通用 UI (Button, Card, Input, Modal, Avatar...)
├── lib/
│   ├── auth.ts                   # 认证逻辑 (AuthProvider, useAuth)
│   ├── chat.ts                   # WebSocket 客户端 (心跳/重连/重试队列)
│   ├── chatbot.ts                # AI SSE 客户端
│   ├── fetch-client.ts           # HTTP 客户端 (重试/去重/Token刷新)
│   ├── api.ts                    # API 函数封装
│   ├── p2p.ts                    # libp2p P2P 管理器
│   ├── ipfs.ts                   # IPFS URL 工具
│   ├── validation.ts             # Zod 表单验证
│   ├── preferences.tsx           # 用户偏好 Context
│   └── hooks/                    # useOnlineStatus, useNavigation, useSafeAsync
├── functions/api/[[path]].ts     # Cloudflare Pages Function (API 代理)
├── types/index.ts                # 统一 TypeScript 类型定义
└── public/                       # 静态资源
```

## 快速开始

### 环境要求

- Node.js 18+
- 后端服务运行中 (见 `../server/README.md`)

### 安装与启动

```bash
# 安装依赖
npm install

# 配置环境变量 (复制并编辑)
cp .env.example .env.local
# 编辑 .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:3002/api
#   NEXT_PUBLIC_WS_URL=http://localhost:3002

# 开发模式启动
npm run dev
# → http://localhost:3000

# 生产构建
npm run build
# → 输出到 out/ 目录 (静态导出)
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `/api` (生产) / `http://localhost:3002/api` (开发) |
| `NEXT_PUBLIC_WS_URL` | WebSocket 地址 | 同 API 地址 |
| `NEXT_PUBLIC_PINATA_GATEWAY` | IPFS 网关 | `https://gateway.pinata.cloud/ipfs/` |

## 部署

### Cloudflare Pages (推荐)

```bash
# 1. 启动后端隧道
./启动隧道-lhr.sh

# 2. 更新 functions/api/[[path]].ts 中的隧道 URL

# 3. 构建并部署
npm run build
npx wrangler pages deploy out --project-name=desocial --branch=main
```

### 隧道方案

项目使用 **localhost.run** (免费 SSH 反向隧道) 暴露本地后端：

```bash
# 首次使用：生成 SSH 密钥并注册
ssh-keygen -t rsa -b 4096
# 将 ~/.ssh/id_rsa.pub 上传到 https://admin.localhost.run/

# 启动隧道
ssh -R 80:localhost:3002 nokey@localhost.run
```

隧道 URL 变化时，更新 `functions/api/[[path]].ts` 第3行的 `API_BASE` 并重新部署。

## 核心功能

- 用户系统：注册/登录/GitHub OAuth/JWT/个人主页
- 内容发布：文章 (Article) 含标题+封面+圈子 / 动态 (Moment)
- 社交互动：关注/粉丝/拉黑/点赞/评论/收藏/转发
- 圈子系统：创建/加入/成员管理/圈内内容
- 实时聊天：WebSocket (Socket.IO) + 端到端加密 + 心跳检测
- AI 助手：DeepSeek SSE 流式对话
- P2P 网络：libp2p + Noise 加密 + DHT
- IPFS 存储：Pinata 上传/网关访问
- 通知系统：点赞/评论/关注/系统通知
- 管理面板：用户管理/内容审核/数据统计/举报处理
- 隐私设置：可见性控制/拉黑/隐藏关注列表
- 搜索：全局搜索 (用户/内容/圈子/话题)
- 话题标签：热门话题/趋势/搜索记录

## 测试

```bash
npm test              # 运行全部测试
npm run test:watch    # 监听模式
npm run test:coverage # 覆盖率报告
npm run typecheck     # TypeScript 类型检查
npm run lint          # ESLint 代码检查
```
