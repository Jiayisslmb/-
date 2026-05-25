# Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4 |
| Backend | Node.js, NestJS 11, Prisma 6, MySQL 8 |
| Auth | JWT (access + refresh tokens), Passport.js, MFA (TOTP) |
| Storage | IPFS (Pinata gateway), multi-gateway fallback |
| Cache | Redis 7 |
| Real-time | WebSocket (Socket.IO), libp2p (DHT + Noise encryption) |
| AI | DeepSeek API via SSE streaming |
| Testing | Vitest, Testing Library |
| CI/CD | GitHub Actions |
| Animation | Framer Motion |

## Directory Structure

```
xiangmu/
├── client/                          # Frontend (Next.js)
│   ├── app/                        # App Router pages
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Home feed
│   │   ├── auth/                   # Sign-in, sign-up
│   │   ├── admin/                  # Admin dashboard
│   │   ├── circles/                # Circle CRUD + feed
│   │   ├── content/                # Article/post creation
│   │   ├── messages/               # Real-time chat
│   │   ├── profile/                # User profiles
│   │   └── search/                 # Search results
│   ├── components/
│   │   ├── common/                 # ErrorBoundary, StateRenderer
│   │   ├── content/                # ContentFeed, PostItem
│   │   ├── chatbot/                # AI assistant panel
│   │   ├── layout/                 # Header, Footer, BottomNav
│   │   ├── p2p/                    # P2P status panel
│   │   ├── ipfs/                   # IPFS viewer, file info
│   │   └── ui/                     # Button, Modal, Skeleton, etc.
│   ├── lib/                        # Shared utilities
│   │   ├── fetch-client.ts         # Unified HTTP client
│   │   ├── swr-config.ts           # SWR data hooks
│   │   ├── animations.ts           # Framer Motion presets
│   │   ├── validation.ts           # Zod schemas
│   │   ├── auth.ts                 # Auth context + provider
│   │   ├── chatbot.ts              # SSE streaming client
│   │   ├── ipfs.ts                 # IPFS upload + URL resolution
│   │   ├── p2p.ts                  # libp2p manager (singleton)
│   │   └── utils.ts                # formatDate, formatNumber, etc.
│   └── types/
│       └── index.ts                # Single source of type truth
│
├── server/                  # Backend (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.ts                 # Demo data seeding
│   └── src/
│       ├── main.ts                 # Bootstrap, CORS, Swagger
│       ├── app.module.ts           # Root module
│       ├── modules/
│       │   ├── auth/               # Authentication
│       │   ├── user/               # User profiles
│       │   ├── content/            # Posts + articles
│       │   ├── circle/             # Circles
│       │   ├── message/            # Chat + WebSocket gateway
│       │   ├── notification/       # Notifications
│       │   ├── topics/             # Trending topics
│       │   ├── chatbot/            # AI assistant
│       │   └── admin/              # Admin dashboard
│       ├── common/
│       │   ├── guards/             # JWT + admin guards
│       │   └── utils/              # IPFS service
│       └── config/                 # Prisma, Redis services
│
├── .github/workflows/ci.yml        # CI pipeline
└── docker-compose.yml              # One-command deploy
```

## Data Flow

```
Browser
  │
  ├─ HTTP (fetch-client.ts)
  │   └─ Next.js rewrites → /api/* → NestJS :3001
  │       └─ Prisma → MySQL
  │       └─ Redis (cache/sessions)
  │       └─ Pinata (IPFS upload)
  │
  ├─ WebSocket (Socket.IO)
  │   └─ /chat namespace → NestJS ChatGateway
  │       └─ Real-time messaging, presence, typing
  │
  └─ P2P (libp2p)
      └─ WebSockets transport → DHT discovery
          └─ Noise encryption, direct peer messaging
```

## Provider Tree (Frontend)

```
<html>
  <AuthProvider>            ← JWT token, user state
    <IPFSProvider>          ← IPFS upload, gateway URL resolution
      <P2PProvider>         ← libp2p node status, peer list
        <PreferencesProvider> ← Theme, language, font settings
          <ChatbotProvider>  ← AI conversation state
            <Header />
            <main>{children}</main>
            <Footer />
            <BottomNav />
            <ChatbotButton />
```

## API Endpoints

See [API Reference](../README.md#api-reference) in README.

## Key Design Decisions

1. **Types**: Single `types/index.ts` with domain types (`id: number`) and DTO types (`id: string`) — transform at the boundary
2. **HTTP**: All requests go through `lib/fetch-client.ts` — retry, dedup, timeout, auth headers
3. **Data Fetching**: SWR hooks in `lib/swr-config.ts` wrap the unified client
4. **Error Handling**: Three-level ErrorBoundary (page/section/inline) + `useSafeAsync` hook
5. **P2P**: Singleton `P2PManager` with React Context wrapper for reactive status
6. **IPFS**: Multi-gateway fallback in `getIPFSUrl()`, backend-first upload with localStorage fallback
