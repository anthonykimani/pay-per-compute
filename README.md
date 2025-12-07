# PayPerCompute Backend

<p align="center">
  <strong>Turing any internet-connected physical asset into a self-monetizing machine using x402 protocol on Solana</strong>
</p>

<p align="center">
  <a href="https://solana.com"><img src="https://img.shields.io/badge/Solana-Blockchain-black?logo=solana" alt="Solana"/></a>
  <a href="https://docs.x402.org"><img src="https://img.shields.io/badge/x402-Protocol-blue" alt="x402 Protocol"/></a>
  <a href="https://payai.network"><img src="https://img.shields.io/badge/PayAI-Facilitator-green" alt="PayAI"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript"/></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-4.18-lightgrey" alt="Express"/></a>
</p>

## Overview

PayPerCompute is a production-ready Node.js backend that enables **pay-per-use access** to physical assets (gaming PCs, 3D printers, IoT devices) using the Solana x402 payment protocol. It eliminates subscriptions, accounts, and human intermediaries by treating payment as a native HTTP handshake.


## Features

- **Dynamic Per-Asset Pricing**: Each asset has its own price per unit (minute/hour/day/session)
- **x402 Payment Flow**: Native 402 Payment Required HTTP responses with Solana USDC settlement
- **Session Management**: Automatic expiry timers with extension support
- **Merchant Dashboard**: Complete earnings analytics and asset management
- **Type-Safe Architecture**: Full TypeScript with Zod validation and TypeORM
- **Security**: Rate limiting, CORS, API key authentication, and field-level whitelisting
- **Horizontal Scaling**: Stateless design supports unlimited asset types

## Architecture

```mermaid
sequenceDiagram
    participant User as User/Agent
    participant API as PayPerCompute API
    participant PayAI as PayAI Facilitator
    participant Solana as Solana Devnet
    participant Asset as Physical Asset
    
    User->>API: POST /access/gpu-node-01
    API->>User: 402 Payment Required {x-cost: 0.10}
    
    User->>PayAI: Sign USDC transfer
    PayAI->>Solana: Verify transaction
    Solana-->>PayAI: ✅ Confirmed
    
    User->>API: POST /access/gpu-node-01 (with x-payment-authorization)
    API->>PayAI: Verify payment
    PayAI-->>API: ✅ Valid
    
    API->>Asset: Unlock via SSH/WebSocket
    API-->>User: 200 {sessionToken: sess_abc123, minutesLeft: 10}
    
    loop Every 30s
        User->>API: GET /sessions/sess_abc123/status
        API-->>User: {minutesLeft: X}
    end
    
    API->>Asset: Auto-lock after expiry
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript 5.x |
| **Framework** | Express.js |
| **Database** | PostgreSQL 15+ |
| **ORM** | TypeORM 0.3.x |
| **Validation** | Zod |
| **Payment** | PayAI x402 Facilitator |
| **Blockchain** | Solana Devnet/Mainnet |
| **Logging** | Winston |
| **Rate Limiting** | Express-rate-limit |

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm
- PostgreSQL 15+ (Docker recommended)
- Solana wallet with USDC on Devnet
- PayAI Facilitator API key

### Installation

```bash
# Clone and install
git clone https://github.com/your-org/paypercompute.git
cd paypercompute
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start PostgreSQL
docker-compose up -d postgres

# Initialize database
pnpm run build
pnpm run db:migrate

# Seed demo assets
pnpm run seed

# Start server
pnpm run dev
```

### Project Structure

```
src/
├── config/
│   ├── env.ts              # Zod-validated environment
│   ├── database.ts         # TypeORM DataSource
│   ├── cors.ts             # CORS config
│   └── payai.ts            # PayAI client config
├── controllers/
│   ├── asset-controller.ts     # Asset CRUD
│   ├── payment-controller.ts   # Payment flows
│   └── merchant-controller.ts  # Earnings & management
├── services/
│   ├── asset-service.ts        # Asset business logic
│   ├── session-service.ts      # Session lifecycle
│   └── payment-log-service.ts  # Payment analytics
├── middleware/
│   ├── x402Wrapper.ts          # PayAI integration
│   ├── rate-limiter.ts         # Security
│   └── cors.ts                 # CORS policy
├── models/
│   ├── asset.entity.ts         # PostgreSQL entity
│   ├── session.entity.ts       # Session entity
│   └── paymentlog.entity.ts   # Payment logs
├── enums/
│   ├── asset-status.enum.ts
│   ├── asset-type.enum.ts
│   └── unit-type.enum.ts
└── routes/
    ├── index.ts                # Main router
    ├── v1/
    │   ├── assets.ts          # Asset routes
    │   ├── payments.ts        # Payment/access routes
    │   ├── merchant.ts        # Merchant dashboard
    │   └── sessions.ts        # Session status
```

## API Documentation

Import the Swagger YAML into Postman, Swagger UI, or EchoAPI for interactive testing:

```bash
# Swagger UI
docker run -p 8080:8080 -e SWAGGER_JSON=/swagger.yaml -v $(pwd)/swagger.yaml:/swagger.yaml swaggerapi/swagger-ui
```

**Key Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/access/{assetId}` | None | Initiate payment flow (returns 402) |
| `GET` | `/sessions/{token}/status` | None | Check session status |
| `POST` | `/access/{assetId}/extend` | None | Extend session with payment |
| `GET` | `/merchant/assets` | API Key | Get assets + earnings |
| `GET` | `/merchant/earnings` | API Key | Earnings report |
| `POST` | `/assets` | API Key | Create new asset |

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PAYAI_FACILITATOR_URL` | ✅ | PayAI facilitator endpoint |
| `PAYAI_API_KEY` | ✅ | PayAI API key |
| `SOLANA_RPC` | ✅ | Solana RPC URL |
| `MERCHANT_WALLET` | ✅ | Your Solana wallet address |
| `MERCHANT_API_KEY` | ✅ | Admin API key |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `PAYMENT_TIMEOUT` | ❌ | Session timeout (default: 300s) |

## Testing

### Manual Testing Flow

1. **Check asset status:**
   ```bash
   curl http://localhost:3001/api/v1/assets/gpu-node-01/status
   ```

2. **Initiate payment (gets 402):**
   ```bash
   curl -X POST http://localhost:3001/api/v1/access/gpu-node-01
   ```

3. **Pay with USDC** (via PayAI dashboard or Phantom wallet)

4. **Access with payment header:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/access/gpu-node-01 \
     -H "x-payment-authorization: PAY2 <base64-payload>"
   ```

5. **Verify session:**
   ```bash
   curl http://localhost:3001/api/v1/sessions/{token}/status
   ```

### Automated Tests

```bash
# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL managed service (Neon, Supabase)
- [ ] Set `synchronize: false` in `database.ts`
- [ ] Run migrations: `pnpm run db:migrate`
- [ ] Use PM2 for process management
- [ ] Configure Nginx for SSL termination
- [ ] Set up Prometheus metrics

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/paypercompute
    depends_on:
      - postgres
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: paypercompute
```

```bash
docker-compose up -d
```

## Use Cases

### Gaming Cafe Example
```bash
# On each PC, install middleware
# PC accesses API to check payment status
# Customer scans QR, pays $0.01/min
# PC unlocks automatically
```

### AI Agent Autonomy
```javascript
// AI agent rents GPU for ML training
const agent = new PayPerComputeAgent();
await agent.payAndAccess('gpu-node-01', '0.30'); // 30 mins
// Agent runs training, auto-extends if needed
```

### DePIN Hotspot
```javascript
// Helium hotspot monetizes spare capacity
hotspot.use(middleware({ price: 0.01, unit: 'hour' }));
// Neighbors pay per hour of connectivity
```

## Hackathon Context

**Built for:** Solana Hackathon: Winter Build Challenge 2025 
**Category:** Best Use of x402 with Solana  
**Team:**   
**Demo Video:** [Comming Soon]  
**Live Demo:** [Comming Soon]

## Future Roadmap

### Q1 2026
- ✅ Publish npm package `paypercompute-middleware`
- Add Jupiter Swap integration for any SPL token
- Implement compressed NFT receipts

### Q2 2026
- Launch with 3 gaming cafes in Nairobi
- Partner with Helium for hotspot monetization
- Add mobile SDK for native app integration

### Q3 2026
- Multi-chain support (Base, Polygon)
- AI agent marketplace integration
- Enterprise SSO for corporate deployments

## Contributing

This is a hackathon project. For production use, please:
1. Open an issue for any bugs
2. Submit PRs for improvements
3. Contact us for commercial licensing

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the Solana ecosystem**