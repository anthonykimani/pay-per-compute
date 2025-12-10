# PayPerCompute Backend

<p align="center">
  <strong>Multi-merchant platform for monetizing physical assets via x402 pay-per-use protocols on Solana</strong>
</p>

<p align="center">
  <a href="https://solana.com"><img src="https://img.shields.io/badge/Solana-Blockchain-black?logo=solana" alt="Solana"/></a>
  <a href="https://docs.x402.org"><img src="https://img.shields.io/badge/x402-Protocol-blue" alt="x402 Protocol"/></a>
  <a href="https://payai.network"><img src="https://img.shields.io/badge/PayAI-Facilitator-green" alt="PayAI"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript"/></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4.18-lightgrey" alt="Express"/></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql" alt="PostgreSQL"/></a>
</p>

## Overview

PayPerCompute is a **production-ready, multi-tenant Node.js backend** that enables any merchant to offer pay-per-use access to physical assets (GPU rigs, 3D printers, IoT devices) using the Solana x402 payment protocol. Built as a platform (not a single-merchant app), it provides automated merchant registration, per-merchant API keys, dynamic platform fees, and comprehensive analytics.

### Core Philosophy

- **No Subscriptions**: Native HTTP 402 Payment Required handshake
- **No Accounts**: Cryptographic wallet-based authentication
- **No Intermediaries**: Direct peer-to-peer payments between users and merchants
- **Platform-Native**: Automated merchant onboarding with configurable fee tiers

## Features

### Platform Layer
- **Automated Merchant Registration**: Self-service signup with instant API key generation
- **Per-Merchant API Keys**: Cryptographically secure (`sk_` prefixed) keys with rate limiting
- **Dynamic Platform Fees**: Configurable fee tiers (default 2%) deducted at payment time
- **Multi-Chain Support**: Configurable networks (Solana, Base) via environment variables

### Asset Management
- **Dynamic Per-Asset Pricing**: Minutes, hours, days, or session-based billing
- **Asset Lifecycle States**: Available, Occupied, Maintenance statuses
- **Metadata Support**: JSONB storage for asset-specific configurations
- **Merchant Scoping**: Assets isolated per merchant via foreign keys

### Payment & Session Flow
- **Native x402 Integration**: Automatic 402 responses with payment requirements
- **Instant Payment Verification**: Sub-second validation via PayAI facilitator
- **Session Auto-Expiry**: Automatic asset locking and cleanup via timer system
- **Session Extension**: Mid-session top-ups without interruption
- **Payment Audit Trail**: Immutable logs of all transactions with signatures

### Security & Observability
- **Rate Limiting**: Granular limits (payment: 10/min, API: 100/15min)
- **CORS Whitelisting**: Origin-based access control with credentials support
- **API Key Authentication**: Per-request merchant validation
- **Field-Level Whitelisting**: Prevents mass-assignment vulnerabilities
- **Structured Logging**: Winston-based JSON logs with error stack traces

## Architecture

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant API as PayPerCompute API
    participant PayAI as PayAI Facilitator
    participant Solana as Solana Network
    participant DB as PostgreSQL

    %% Merchant Onboarding
    Dev->>API: POST /api/v1/auth/register
    API->>DB: Create merchant + API key
    API-->>Dev: {apiKey: "sk_...", walletAddress: "..."}
    
    %% Asset Creation
    Dev->>API: POST /api/v1/assets (with x-api-key)
    API->>DB: Create asset (linked to merchant)
    API-->>Dev: {assetId: "uuid", status: "available"}
    
    %% Payment Flow
    Note over User,Asset: Standard x402 Flow
    User->>API: POST /access/{assetId}
    API->>DB: Fetch asset pricing
    API-->>User: 402 Payment Required<br/>{x-cost: 0.10, x-address: ...}
    User->>PayAI: Sign USDC transfer
    PayAI->>Solana: Submit + verify transaction
    Solana-->>PayAI: ✅ Confirmed (signature)
    User->>API: POST /access/{assetId}<br/>Header: x-payment-authorization: PAY2 ...
    API->>PayAI: Verify signature
    PayAI-->>API: ✅ Valid
    API->>DB: Create session, unlock asset
    API-->>User: 200 {sessionToken, expiresAt, websocketUrl}
    
    %% Session Monitoring
    loop Every 30s
        User->>API: GET /sessions/{token}/status
        API->>DB: Check session expiry
        API-->>User: {minutesLeft: X}
    end
    
    %% Auto-Expiry
    API->>API: Timer fires
    API->>DB: Lock asset, delete session
```

### Tech Stack

| Layer          | Technology              | Purpose                         |
| -------------- | ----------------------- | ------------------------------- |
| **Runtime**    | Node.js 20+             | Server runtime                  |
| **Language**   | TypeScript 5.x          | Type safety                     |
| **Framework**  | Express.js 4.18         | HTTP server                     |
| **Database**   | PostgreSQL 15+          | Primary data store              |
| **ORM**        | TypeORM 0.3.x           | Database abstraction            |
| **Validation** | Zod                     | Environment variable validation |
| **Payment**    | x402-express + PayAI    | x402 protocol implementation    |
| **Blockchain** | Solana (Devnet/Mainnet) | Settlement layer                |
| **Logging**    | Winston 3.x             | Structured logging              |
| **Crypto**     | Node.js crypto          | API key generation              |

## Database Schema

```mermaid
erDiagram
    MERCHANT ||--o{ ASSET : owns
    MERCHANT {
        string id PK
        string name
        string walletAddress
        string apiKey
        int platformFeePercent
        bool isActive
    }
    ASSET ||--o{ SESSION : hosts
    ASSET ||--o{ PAYMENT_LOG : logs
    ASSET {
        string id PK
        string name
        decimal pricePerUnit
        enum unit
        enum type
        enum status
        string merchantWallet
        json metadata
        string merchantId FK
    }
    SESSION {
        string token PK
        uuid asset_id FK
        string payerWallet
        decimal amountPaid
        timestamp expiresAt
        bool isExtended
    }
    PAYMENT_LOG {
        int id PK
        string signature
        decimal amount
        string payerWallet
        uuid asset_id FK
        string sessionToken
        bool success
        json facilitatorResponse
    }
```

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm
- PostgreSQL 15+ (local or cloud)
- Solana wallet with USDC (Devnet for testing)
- PayAI Facilitator API key

### Installation

```bash
# Clone and install
git clone https://github.com/your-org/paypercompute.git
cd paypercompute
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration (see Configuration section)

# Start PostgreSQL
# Option A: Docker
docker run -d --name paypercompute-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=paypercompute \
  -p 5432:5432 postgres:15

# Option B: Local PostgreSQL
# Ensure DATABASE_URL points to your instance

# Initialize database
pnpm run build
pnpm run db:migrate

# Start server
pnpm run dev
```

### Merchant Registration

```bash
# Register as a merchant (save the API key!)
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Gaming Cafe",
    "walletAddress": "YourSolanaWalletAddress",
    "platformFeePercent": 2
  }'

# Response:
# {
#   "status": "success",
#   "data": {
#     "merchantId": "...",
#     "apiKey": "sk_live_abc123...",
#     "walletAddress": "..."
#   },
#   "message": "Save your API key - it will not be shown again!"
# }
```

### Create Your First Asset

```bash
# Using your API key from registration
curl -X POST http://localhost:3001/api/v1/assets \
  -H "x-api-key: sk_live_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RTX 4090 Gaming Rig #1",
    "pricePerUnit": "0.10",
    "unit": "minute",
    "type": "gpu",
    "metadata": {"location": "Nairobi", "specs": "RTX 4090, 64GB RAM"}
  }'
```

## Configuration

### Environment Variables

| Variable                | Required | Default         | Description                               |
| ----------------------- | -------- | --------------- | ----------------------------------------- |
| `NODE_ENV`              | ✅        | `development`   | Environment mode                          |
| `PORT`                  | ❌        | `3001`          | Server port                               |
| `DATABASE_URL`          | ✅        | -               | PostgreSQL connection string              |
| `PAYAI_FACILITATOR_URL` | ✅        | -               | PayAI facilitator endpoint                |
| `PAYAI_API_KEY`         | ✅        | -               | PayAI API key                             |
| `PAYAI_VERSION`         | ❌        | `2024-01-24`    | PayAI API version                         |
| `PAYAI_NETWORK`         | ❌        | `solana-devnet` | Blockchain network                        |
| `SOLANA_RPC`            | ✅        | -               | Solana RPC URL                            |
| `MERCHANT_WALLET`       | ⚠️        | -               | **Deprecated** (use per-merchant wallets) |
| `FRONTEND_URL`          | ✅        | -               | Your frontend origin                      |
| `ALLOWED_ORIGINS`       | ✅        | -               | Comma-separated CORS origins              |
| `PAYMENT_TIMEOUT`       | ❌        | `300`           | Payment session timeout (seconds)         |
| `UNIT_TYPE`             | ❌        | `minute`        | Default billing unit                      |
| `ACCEPTED_TOKENS`       | ❌        | `USDC`          | Comma-separated token list                |

### PayAI Facilitator Setup

1. Sign up at [PayAI Network](https://payai.network)
2. Create a facilitator endpoint
3. Fund your facilitator wallet with USDC on your target network
4. Set `PAYAI_API_KEY` and `PAYAI_FACILITATOR_URL` in your environment

## Project Structure

```
src/
├── config/
│   ├── env.ts              # Zod-validated environment config
│   ├── database.ts         # TypeORM data source
│   ├── cors.ts             # Dynamic CORS configuration
│   └── payai.ts            # PayAI client settings
├── controllers/
│   ├── asset-controller.ts     # Public & merchant asset operations
│   ├── auth-controller.ts      # Merchant registration & key management
│   ├── merchant-controller.ts  # Merchant dashboard analytics
│   └── payment-controller.ts   # Payment processing & session control
├── middleware/
│   ├── x402Wrapper.ts          # PayAI middleware factory
│   ├── api-key.ts              # API key authentication
│   ├── rate-limitier.ts        # Granular rate limiting
│   ├── cors.ts                 # CORS policy enforcement
│   └── errorHandler.ts         # Global error handling
├── models/
│   ├── asset.entity.ts         # Asset definition
│   ├── merchant.entity.ts      # Merchant with API keys
│   ├── session.entity.ts       # Active session tracking
│   ├── paymentlog.entity.ts    # Payment audit trail
│   └── platform.entity.ts      # Platform configuration
├── services/
│   ├── asset-service.ts        # Asset business logic
│   ├── merchant-service.ts     # Merchant operations & keygen
│   ├── session-service.ts      # Session lifecycle with timers
│   └── payment-log-service.ts  # Payment verification & analytics
├── enums/
│   ├── asset-status.enum.ts    # AVAILABLE, OCCUPIED, MAINTENANCE
│   ├── asset-type.enum.ts      # gpu, printer, iot, etc.
│   └── unit-type.enum.ts       # minute, hour, day, session
├── routes/v1/
│   ├── index.ts                # Route aggregator
│   ├── index.asset.ts          # /assets endpoints
│   ├── index.auth.ts           # /auth endpoints
│   ├── index.merchant.ts       # /merchant endpoints
│   ├── index.payments.ts       # /access endpoints
│   └── index.session.ts        # /sessions endpoints
├── utils/
│   ├── logger.ts               # Winston logger
│   └── errors.ts               # Custom error classes
└── app.ts                      # Express app factory
```

## API Documentation

### Authentication Routes (`/api/v1/auth`)

| Method   | Endpoint          | Auth    | Description                            |
| -------- | ----------------- | ------- | -------------------------------------- |
| `POST`   | `/register`       | None    | Register new merchant                  |
| `POST`   | `/regenerate-key` | API Key | Generate new API key (invalidates old) |
| `DELETE` | `/deactivate`     | API Key | Deactivate merchant account            |

### Asset Routes (`/api/v1/assets`)

| Method  | Endpoint           | Auth    | Description                       |
| ------- | ------------------ | ------- | --------------------------------- |
| `GET`   | `/`                | None    | List all assets (public view)     |
| `GET`   | `/:assetId/status` | None    | Get asset status & availability   |
| `POST`  | `/`                | API Key | Create new asset                  |
| `PATCH` | `/:id`             | API Key | Update asset (whitelisted fields) |
| `PATCH` | `/:id/price`       | API Key | Update pricing                    |

### Payment & Access Routes (`/api/v1/access`)

| Method | Endpoint                  | Auth | Description                              |
| ------ | ------------------------- | ---- | ---------------------------------------- |
| `POST` | `/:assetId`               | None | **Initiates payment flow** (returns 402) |
| `GET`  | `/:assetId/status`        | None | Check active session status              |
| `POST` | `/sessions/:token/extend` | None | Extend active session with payment       |

### Session Routes (`/api/v1/sessions`)

| Method | Endpoint         | Auth | Description                  |
| ------ | ---------------- | ---- | ---------------------------- |
| `GET`  | `/:token/status` | None | Get session details & expiry |

### Merchant Dashboard (`/api/v1/merchant`)

| Method  | Endpoint      | Auth    | Description                          |
| ------- | ------------- | ------- | ------------------------------------ |
| `GET`   | `/assets`     | API Key | Get merchant's assets + earnings     |
| `GET`   | `/earnings`   | API Key | Earnings report (filterable by date) |
| `PATCH` | `/assets/:id` | API Key | Update merchant's asset              |

### Example Payment Flow

```bash
# 1. Initiate payment (receives 402)
curl -i -X POST http://localhost:3001/api/v1/access/gpu-node-01

# Response:
# HTTP/1.1 402 Payment Required
# x-cost: 0.10
# x-address: MerchantWalletAddress
# x-facilitator: https://facilitator.payai.network
# x-network: solana-devnet
# x-unit: minute

# 2. Pay via PayAI (user-side, typically via wallet)

# 3. Access with payment receipt
curl -X POST http://localhost:3001/api/v1/access/gpu-node-01 \
  -H "x-payment-authorization: PAY2 eyJzaWduYXR1cmUiOiIuLi4ifQ=="

# Response:
# {
#   "status": "granted",
#   "sessionToken": "sess_12345abc",
#   "minutesPurchased": 10,
#   "expiresAt": "2025-12-09T15:30:00.000Z",
#   "websocketUrl": "ws://localhost:3001?token=sess_12345abc"
# }

# 4. Monitor session
curl http://localhost:3001/api/v1/sessions/sess_12345abc/status

# 5. Extend session
curl -X POST http://localhost:3001/api/v1/access/sessions/sess_12345abc/extend \
  -d '{"additionalAmount": "0.50"}'
```

## Testing

### Manual Testing Checklist

```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Register merchant (save API key!)
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Merchant","walletAddress":"YourWalletAddress"}'

# 3. Create asset
curl -X POST http://localhost:3001/api/v1/assets \
  -H "x-api-key: sk_..." \
  -d '{"name":"Test GPU","pricePerUnit":"0.05","unit":"minute","type":"gpu"}'

# 4. Test payment flow
curl -i -X POST http://localhost:3001/api/v1/access/{assetId}

# 5. Check asset status
curl http://localhost:3001/api/v1/assets/{assetId}/status

# 6. Check merchant dashboard
curl -H "x-api-key: sk_..." http://localhost:3001/api/v1/merchant/assets
```

### Automated Tests

```bash
# Unit tests (when implemented)
pnpm test:unit

# Integration tests (when implemented)
pnpm test:integration

# Linting and formatting
pnpm lint:check
pnpm format:check
```

**Note**: Test suite is currently being developed. See `tests/` directory for stubs.

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL (Neon, Supabase, AWS RDS)
- [ ] Set `synchronize: false` in `database.ts`
- [ ] Run migrations: `pnpm run db:migrate`
- [ ] Configure PM2 for process management
- [ ] Set up Nginx reverse proxy with SSL
- [ ] Configure firewall (allow only PayAI IPs)
- [ ] Set up log aggregation (Loki, CloudWatch)
- [ ] Enable Prometheus metrics endpoint (see TODO in `app.ts`)

### Docker Deployment

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://user:pass@postgres:5432/paypercompute
      PAYAI_FACILITATOR_URL: https://facilitator.payai.network
      # ... other env vars
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: paypercompute
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: paypercompute
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U paypercompute"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

```bash
# Build and run
docker-compose -f docker-compose.production.yml up -d --build
```

## Security Considerations

### Rate Limiting
- **Payment attempts**: 10 requests/minute per IP (prevents spam)
- **API operations**: 100 requests/15min per API key (merchant-scoped)
- **Status checks**: Exempt from limits for real-time monitoring

### Authentication
- **API Keys**: Generated via `crypto.randomBytes(32)` - 48 character hex strings
- **Key Rotation**: Regenerate keys without downtime via `/auth/regenerate-key`
- **Deactivation**: Instant merchant account lockout

### CORS
- Whitelist-only model: origins must be in `ALLOWED_ORIGINS`
- Supports credentials for merchant dashboard access
- Exposes payment headers to frontend clients

### Payment Security
- All payments verified on-chain via PayAI facilitator
- Signature uniqueness enforced at database level
- Session tokens are UUIDv4 with random suffix
- Automatic asset locking on session expiry prevents unauthorized use

## Use Cases

### Gaming Cafe Chain (Multi-Merchant)
```javascript
// Each cafe registers separately with platform fee
// Platform takes 2% of all revenue
// Cafe owner manages their own assets via API keys
```

### AI Agent Marketplace
```javascript
// Agent registers as merchant
// Offers GPU time to other agents
// Self-service asset creation via API
// Automated payment verification enables machine-to-machine commerce
```

### DePIN Networks
```javascript
// Hotspot owners register as merchants
// Offer bandwidth per hour
// Platform provides unified payment interface
// Automatic payout to merchant wallets
```

## API Versioning

Current version: `v1`  
Version is hardcoded in route paths. Future versions will be mounted alongside.

## Future Roadmap

### Q1 2026
- Implement webhook system for payment notifications
- Add Prometheus metrics and Grafana dashboard
- Compressed NFT receipt generation
- Type-safe API client generation (OpenAPI spec)

### Q2 2026
- Multi-token support via Jupiter Swap integration
- Escrow system for dispute resolution
- Mobile SDK (React Native)
- Admin panel for platform operators

### Q3 2026
- Cross-chain settlement (Base, Polygon)
- AI agent marketplace launch
- Enterprise SSO (SAML/OIDC)
- Volume-based fee discounts

## Contributing

This is a production-ready foundation. To contribute:

1. **Bug Reports**: Open issue with `bug` label, include logs
2. **Features**: Open issue for discussion, then submit PR
3. **Security**: Email security concerns to security@your-org.com
4. **Commercial**: Contact us for white-label licensing

### Development Setup

```bash
# Fork and clone
git checkout -b feature/your-feature
pnpm run dev  # Hot-reload on TS changes
pnpm run lint  # ESLint + Prettier
# Submit PR with tests
```

## License

MIT License - see LICENSE file for details. Commercial use requires attribution.

---

**Built for the Solana ecosystem. Powering the pay-per-use economy.**