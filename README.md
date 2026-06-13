# DeSocial 客户端

基于 Next.js 16 (App Router) + React 19 的去中心化社交平台前端，部署于 Vercel。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router / SSR) |
| UI | React 19 + Tailwind CSS 4 + Framer Motion |
| 状态 | React Context + SWR 2.4 |
| 通信 | Socket.IO 4.8 (长轮询) + libp2p 3.1 |
| 存储 | IPFS (Pinata) |
| AI | DeepSeek SSE 流式 |
| 校验 | Zod 4.3 |
| 部署 | Vercel (自动 CI/CD) |

## 快速开始

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:3002/api
npm run dev
```

## 项目结构

```
client/
├── app/                    # App Router 页面 (26个路由)
│   ├── layout.tsx          # 全局布局
│   ├── page.tsx            # 首页
│   ├── auth/               # 登录/注册/GitHub OAuth
│   ├── profile/[username]/ # 用户主页
│   ├── content/            # 文章+动态
│   ├── circles/            # 圈子
│   ├── messages/           # 私信
│   ├── admin/              # 管理面板
│   ├── settings/           # 设置
│   ├── search/             # 全局搜索
│   └── topic/[name]/      # 话题页
├── components/
│   ├── auth/               # GitHub 登录组件
│   ├── chatbot/            # AI 助手
│   ├── common/             # 错误边界/在线状态
│   ├── content/            # 内容卡片/动态流
│   ├── layout/             # 布局组件
│   ├── p2p/                # P2P 网络状态
│   └── ui/                 # 通用 UI
├── lib/
│   ├── auth.ts             # 认证 (AuthProvider)
│   ├── chat.ts             # Socket.IO 客户端
│   ├── chatbot.ts          # AI SSE 客户端
│   ├── fetch-client.ts     # HTTP 客户端 (重试/去重/Token刷新)
│   ├── api.ts              # API 函数
│   └── hooks/              # useOnlineStatus 等
├── types/                  # TypeScript 类型
└── vercel.json             # Vercel Rewrites 配置
```

## 生产部署

```bash
# Vercel 自动部署 (git push 触发)
git push origin main

# 本地生产测试
npm run build && npx next start
```

## 生产架构

```
用户 https://www.desocial.top
  ├── 页面 → Vercel SSR
  ├── API  → Vercel Rewrites → api.desocial.top → Tunnel → Backend
  └── 聊天 → api.desocial.top (直连, 绕过 Cloudflare 代理)
```

## 环境变量

| 变量 | 开发 | 生产 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3002/api` | `/api` |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3002` | (不使用) |

## 脚本

```bash
npm run dev         # 开发模式
npm run build       # 生产构建
npm run start       # 生产启动
npm test            # 运行测试
npm run typecheck   # 类型检查
npm run lint        # 代码检查
```
