# 去中心化个人社交平台

基于 Next.js 16 + NestJS 11 的去中心化社交网络，支持 IPFS 内容存储、P2P 通信、AI 助手和实时消息。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Framer Motion |
| 后端 | NestJS 11, Prisma 6, MySQL 8, Redis 7 |
| 去中心化 | IPFS (Pinata), libp2p (DHT + Noise 加密) |
| 实时通信 | WebSocket (Socket.IO), SSE (AI 流式响应) |
| 测试 | Vitest, Testing Library |
| CI/CD | GitHub Actions |

## 项目结构

```
xiangmu/                         # 项目根目录
├── client/                       # 前端客户端 (Next.js)
│   ├── app/                     # 页面路由 (App Router)
│   ├── components/              # UI 组件
│   │   ├── chatbot/             # AI 聊天机器人
│   │   ├── common/              # 通用组件 (ErrorBoundary, BackendStatusBanner)
│   │   ├── content/             # 内容组件
│   │   ├── ipfs/                # IPFS 组件
│   │   ├── layout/              # 布局组件
│   │   ├── p2p/                 # P2P 组件
│   │   └── ui/                  # 基础 UI 组件
│   ├── lib/                     # 工具函数与 Hooks
│   ├── types/                   # TypeScript 类型定义
│   ├── test/                    # 测试配置
│   ├── docs/                    # 文档
│   ├── vercel.json              # Vercel 部署配置
│   └── next.config.ts           # Next.js 配置
├── server/               # 后端服务端 (NestJS)
│   ├── prisma/                  # 数据库 Schema 与种子数据
│   │   └── schema.prisma        # 数据模型定义
│   ├── src/
│   │   ├── modules/             # 业务模块
│   │   │   ├── auth/            # 认证模块
│   │   │   ├── user/            # 用户模块
│   │   │   ├── content/         # 内容模块
│   │   │   ├── circle/          # 圈子模块
│   │   │   ├── message/         # 消息模块 (含 WebSocket)
│   │   │   ├── admin/           # 管理模块
│   │   │   ├── topics/          # 话题模块
│   │   │   ├── notification/    # 通知模块
│   │   │   └── chatbot/         # AI 聊天模块
│   │   ├── common/              # 公共工具 (IPFS, 守卫)
│   │   └── config/              # 配置 (Prisma, Redis, 验证)
│   ├── .env.example             # 环境变量配置模板
│   └── package.json
├── 社交平台客户端.sh             # 前端一键启动脚本
├── 社交平台服务端.sh             # 后端一键启动脚本
├── 社交平台.sh                   # 全栈一键启动脚本 (旧版)
├── .github/workflows/           # CI/CD 配置
└── docker-compose.yml           # 容器编排
```

## 快速开始

### 方式一：使用启动脚本（推荐）

```bash
# 1. 先启动后端服务
./社交平台服务端.sh

# 2. 再启动前端服务（新终端）
./社交平台客户端.sh
```

脚本自带端口检测、冲突处理、浏览器自动打开等功能。使用 `-h` 查看详细说明。

### 方式二：手动启动

```bash
# 1. 安装依赖
cd client && npm install
cd ../server && npm install

# 2. 配置后端环境变量
cd server
cp .env.example .env
# 编辑 .env 填入数据库、Redis、Pinata、DeepSeek 等配置

# 3. 初始化数据库
npx prisma migrate dev
npx prisma db seed

# 4. 启动后端服务 (端口 3001)
npm run start:dev

# 5. 新终端启动前端 (端口 3000)
cd ../client
npm run dev
```

### 方式三：Docker 一键部署

```bash
docker-compose up -d
```

## 启动脚本说明

### 社交平台客户端 (`./社交平台客户端.sh`)

启动前端 Next.js 开发服务器，自动：
- 检测端口占用并自动分配可用端口
- 检测后端服务连接状态
- 如后端未连接，前端页面显示"后端服务未连接"提示横幅
- 服务就绪后自动打开浏览器

```bash
./社交平台客户端.sh                  # 默认端口 3000
./社交平台客户端.sh -p 3005           # 指定端口 3005
./社交平台客户端.sh -b http://192.168.1.1:3001/api  # 指定后端地址
```

### 社交平台服务端 (`./社交平台服务端.sh`)

启动后端 NestJS 服务，自动：
- 检查 .env 配置文件是否存在
- 运行 Prisma 数据库迁移
- 检测端口占用并自动分配
- 服务就绪后自动打开 Swagger 文档

```bash
./社交平台服务端.sh                  # 默认端口 3001
./社交平台服务端.sh -p 3005           # 指定端口 3005
```

## 后端环境变量配置

后端需要 `.env` 文件才能正常运行。复制模板文件并填写实际值：

```bash
cd server
cp .env.example .env
```

### 必需的环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|---------|
| `DATABASE_URL` | MySQL 连接字符串 | 本地安装 MySQL 8.0+，创建数据库后填写 |
| `JWT_SECRET` | JWT 签名密钥 (64位 hex) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_KEY` | 数据加密密钥 (64位 hex) | 同上命令重新生成一个 |

### 可选的环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|---------|
| `REDIS_URL` | Redis 连接字符串 | 本地安装 Redis 7.0+，默认 `redis://127.0.0.1:6379` |
| `PINATA_JWT` | Pinata IPFS 服务 JWT Token | 注册 https://app.pinata.cloud/ → API Keys → 创建 JWT |
| `PINATA_API_KEY` | Pinata API Key (JWT 优先) | Pinata 控制台 → API Keys |
| `PINATA_API_SECRET` | Pinata API Secret | Pinata 控制台 → API Keys |
| `PINATA_GATEWAY` | Pinata 专用网关 | Pinata 控制台 → Gateways |
| `DEEPSEEK_API_KEY` | DeepSeek AI API Key | 注册 https://platform.deepseek.com/ → API Keys |
| `CORS_ORIGINS` | 允许的前端源地址 | 生产环境填写 Vercel 部署域名 |
| `NEST_PORT` | 后端端口 | 默认 3001 |

### 前置服务

后端需要以下服务运行：

- **MySQL 8.0+**：默认端口 3306，创建名为 `bishe` 的数据库
- **Redis 7.0+**：默认端口 6379

## 前端部署 (Vercel)

前端项目已配置 `vercel.json`，可直接部署到 Vercel：

```bash
cd client
npx vercel deploy --prod
```

部署前确保：
1. 设置环境变量 `NEXT_PUBLIC_API_URL` 指向已部署的后端地址
2. 后端 CORS 配置中添加 Vercel 部署域名（`CORS_ORIGINS` 环境变量）

## API 概览

| 模块 | 主要端点 |
|------|---------|
| Auth | `POST /api/auth/login`, `/register`, `/refresh` |
| Users | `GET/PATCH /api/users/profile`, `POST /api/users/:id/follow` |
| Content | `GET /api/content/articles/feed`, `POST /api/content/articles` |
| Circles | `GET/POST /api/circles`, `POST /api/circles/:id/join` |
| Messages | `GET /api/messages/conversations`, `POST /api/messages/send` |
| Chatbot | `POST /api/chatbot/message` (SSE) |
| Admin | `GET /api/admin/stats`, `/users`, `/content` |
| IPFS | `POST /api/ipfs/upload` |
| Health | `GET /api/health` |

WebSocket: `/chat` 命名空间，事件包括 `send_message`, `new_message`, `user_status`, `typing`

在线 API 文档: `http://localhost:3001/api-docs`

## 功能清单

### 用户系统
- [x] JWT 认证 (Access + Refresh Token)
- [x] 注册/登录/密码修改
- [x] MFA 双因素认证 (TOTP)
- [x] 登录失败锁定 (5次/15分钟，管理员30分钟)

### 内容管理
- [x] 发布文章 (Markdown) 和动态
- [x] 点赞、评论、收藏、分享
- [x] 话题标签系统
- [x] 可见性控制 (public/followers/private)
- [x] IPFS 内容存储 (多网关回退)

### 社交功能
- [x] 关注/取关、粉丝列表
- [x] 圈子 (创建、加入、圈子动态)
- [x] 实时私信 (WebSocket)
- [x] 在线状态、打字指示器
- [x] 通知系统 (未读计数)

### AI 助手
- [x] 浮动聊天面板 (DeepSeek v4 Pro)
- [x] SSE 流式响应
- [x] Markdown 渲染
- [x] 上下文感知

### 去中心化
- [x] IPFS 内容寻址 (CID)
- [x] P2P 节点管理 (libp2p)
- [x] DHT 节点发现
- [x] Noise 加密通信
- [x] P2P 状态面板

### 管理后台
- [x] 用户管理 (冻结/解冻)
- [x] 内容审核
- [x] 圈子管理
- [x] 数据统计
- [x] 反馈处理

### 工程化
- [x] TypeScript 严格模式
- [x] 统一 HTTP 客户端 (重试/去重/超时)
- [x] SWR 数据获取 (缓存/重验证)
- [x] Error Boundary (page/section/inline)
- [x] 后端连接状态检测横幅
- [x] Git Hooks (Husky + commitlint)
- [x] CI/CD (GitHub Actions)
- [x] 97 个单元测试
- [x] .env 排除开源 (仅提供 .env.example 模板)

## 演示账户

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | (seed 输出) | 管理员 |
| alice | 123456 | 普通用户 |
| bob | 123456 | 普通用户 |
| charlie | 123456 | 普通用户 |
| diana | 123456 | 普通用户 |

## 可用命令

```bash
# 前端 (client/)
npm run dev              # 开发模式
npm run build            # 生产构建
npm run lint             # ESLint
npm run typecheck        # TypeScript 类型检查
npm test                 # 运行测试
npm run test:coverage    # 测试覆盖率

# 后端 (server/)
npm run start:dev        # 开发模式 (热重载)
npm run build            # 生产构建
npm run start:prod       # 生产启动
npm test                 # 运行测试
npx prisma studio        # 数据库可视化管理
npx prisma migrate dev   # 创建数据库迁移
npx prisma db seed       # 填充种子数据
```

## 开源说明

- `.env` 文件**不会**提交到 Git（已在 `.gitignore` 中排除）
- 请使用 `.env.example` 作为参考创建本地 `.env` 配置
- 项目采用 MIT 许可证
- 前端和后端为独立项目，可分别部署

## License

MIT
