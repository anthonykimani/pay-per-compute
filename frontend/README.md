# Fix: QueryClient Error

The error occurs because `useMutation` is called outside the `QueryClientProvider`. Ensure your providers are correctly structured:

**In `src/providers/index.tsx`:**
```typescript
'use client';

import { QueryProvider } from './query-provider'; // Make sure this import exists
import { WalletProviders } from './wallet-providers';
import { SocketProvider } from './socket-provider';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProviders>
      <QueryProvider>  {/* This must wrap components that use useMutation */}
        <SocketProvider>
          {children}
          <Toaster position="top-right" expand={false} />
        </SocketProvider>
      </QueryProvider>
    </WalletProviders>
  );
}
```

**In `src/app/layout.tsx`:**
```typescript
import { Providers } from '@/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers> {/* Must wrap everything */}
      </body>
    </html>
  );
}
```

---

# PayPerCompute Frontend - README

## 🚀 AI-Powered Compute Marketplace on Solana

Production-ready Next.js 16 frontend for the PayPerCompute platform. Chat with an AI agent to find and access GPU compute, 3D printers, and IoT devices using Solana's x402 payment protocol.

## 📁 Architecture Overview

```
src/
├── app/                          # Next.js 16 App Router
│   ├── (main)/                   # Public routes (home, agent, assets)
│   │   ├── page.tsx              # Landing page with hero & AgentChat
│   │   ├── agent/page.tsx        # AI Agent interface (split chat/feed)
│   │   ├── assets/page.tsx       # Public asset browser
│   │   └── session/page.tsx      # Session lookup
│   └── (merchant)/               # Protected merchant routes
│       └── merchant/
│           ├── login/page.tsx    # API key login
│           └── dashboard/page.tsx # Analytics & earnings
├── components/
│   ├── agent/                    # AI agent UI components
│   ├── merchant/                 # Merchant dashboard components
│   └── shared/                   # Reusable UI primitives
├── lib/
│   ├── api/                      # Typed API client layers
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types (barrel exports)
│   └── config/                   # Environment validation
├── providers/                    # Context providers (Wallet, Query, Socket)
└── middleware.ts                 # Route protection & API key injection
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.8 with App Router & Route Groups
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x + shadcn/ui
- **State Management**: @tanstack/react-query
- **Blockchain**: @solana/web3.js, @solana/wallet-adapter
- **Real-time**: Socket.IO client
- **Animations**: framer-motion
- **Forms**: react-hook-form + zod

## ✨ Key Features

### 🔮 AI Agent Interface
- Natural language compute discovery
- Real-time WebSocket activity feed
- Automatic asset matching & recommendation
- Type-safe agent logs

### 💳 x402 Payment Flow
- Automatic 402 Payment Required handling
- Wallet-based message signing
- PayAI facilitator verification
- Session token + WebSocket URL generation

### 🏪 Merchant Dashboard
- Self-service registration
- Per-merchant API key management
- Real-time earnings analytics
- Asset lifecycle management

## 🚦 How to Run

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL

# Run development server
pnpm dev

# Build for production
pnpm build
```

**Required Environment Variables:**
```bash
NEXT_PUBLIC_PAY_PER_COMPUTE_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

## 🎮 User Journey

### 1. Find Compute via AI Agent
```
Landing Page → Click "Chat with AI Agent"
→ Connect Solana Wallet (Phantom)
→ Type: "RTX 4090 for 1 hour under $0.10/min"
→ Watch Agent Feed: "Found 3 matching assets..."
→ Agent recommends: "Asset #1: RTX 4090 @ $0.08/min"
```

### 2. Pay & Access
```
→ Payment Requirement Card appears
→ Shows: Cost ($4.80), Network (solana-devnet), Merchant wallet
→ Click "Pay & Access Asset"
→ Wallet prompts to sign message
→ Success: Session token + WebSocket URL
→ Click "Connect" to open compute access
```

### 3. Monitor Session
```
→ Live countdown timer
→ Minutes remaining updates every 30s
→ "Extend Session" button for top-ups
→ Auto-expire when time runs out
```

## 🏪 Merchant Journey

### 1. Register
```bash
curl -X POST https://api.paypercompute.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"My Gaming Cafe","walletAddress":"YourSolanaWallet"}'
# Response: { "apiKey": "sk_live_...", "walletAddress": "..." }
```

### 2. Login to Dashboard
```
→ Visit /merchant/login
→ Enter API key
→ Dashboard shows: Total Earnings, Active Assets, Session Count
```

### 3. List Assets
```bash
curl -X POST https://api.paypercompute.com/api/v1/assets \
  -H "x-api-key: sk_live_..." \
  -d '{"name":"RTX 4090 #1","pricePerUnit":"0.08","unit":"minute","type":"gpu"}'
```

### 4. Monitor Earnings
```
→ Real-time chart of earnings over time
→ Per-session logs with signatures
→ Direct payments to merchant wallet (minus 2% platform fee)
```

## 🔧 API Integration

### Asset Management
```typescript
const { data: assets } = useAssets({ type: 'gpu', maxPrice: 0.1 });
const { mutate: createAsset } = useCreateAsset();
```

### Payment Flow
```typescript
const { paymentRequirement, session, initiate, complete } = usePaymentFlow();

// Initiate payment
initiate('asset-123');

// Complete payment with wallet
await complete('asset-123', wallet);
```

### Agent Interaction
```typescript
const { mutate: createIntent } = useCreateIntent(wallet);
const { data: intent } = useAgentIntent(intentId);
```

## 🛡️ Production Deployment

### Netlify Configuration
```toml
[build]
  command = "pnpm build"
  publish = ".next"
  environment = { NODE_VERSION = "20" }

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Critical Backend Setup
1. **PayAI Facilitator**: Funded wallet with USDC
2. **Platform Fee Wallet**: Configured for fee collection
3. **CORS**: Allow frontend origin + `x-user-wallet` header
4. **Rate Limiting**: Configured per IP/API key
5. **Database**: PostgreSQL 15+ with migrations run

### Environment Variables (Production)
```bash
# Backend
NODE_ENV=production
PAYAI_FACILITATOR_URL=https://facilitator.payai.network
PAYAI_API_KEY=your_api_key
PAYAI_NETWORK=mainnet
SOLANA_RPC=https://api.mainnet-beta.solana.com
PLATFORM_FEE_WALLET=your_fee_wallet

# Frontend
NEXT_PUBLIC_PAY_PER_COMPUTE_URL=https://api.paypercompute.com
NEXT_PUBLIC_BACKEND_URL=https://api.paypercompute.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## 🔍 Troubleshooting

**"No QueryClient set"**: Ensure `<QueryProvider>` wraps all components using `useMutation`/`useQuery`

**CORS errors**: Backend must allow `x-user-wallet` header in `allowedHeaders`

**Payment failures**: Check PayAI facilitator has USDC and backend env vars are correct

**Agent not responding**: Verify WebSocket connection and backend agent service is running

## 📊 Performance Optimizations

- React Query caching with 5-minute stale time
- Granular rate limiting (10 payments/min, 100 API ops/15min)
- Optimistic UI updates for asset creation
- Lazy loading for merchant dashboard charts
- Suspense boundaries for code splitting

## 🎨 UI/UX Highlights

- **Agent Interface**: Split-screen chat + real-time feed
- **Payment Flow**: Clear cost breakdown before signing
- **Landing Page**: Animated gradient hero with floating particles
- **Merchant Dashboard**: Live earnings analytics with Recharts
- **Responsive**: Mobile-first design with Tailwind 4

---

**Built for the Solana ecosystem. Powering the pay-per-use economy. 🚀**

For issues, see the `ErrorBoundary` component logs or check browser console for detailed error messages. All API errors include structured error codes for easy debugging.