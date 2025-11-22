# Backend Package

Backend API service for ZKP operations, providing REST endpoints for proof submission, verification, and management.

## Technologies

- **Express**: Web framework
- **TypeScript**: Type-safe development
- **Ethers.js**: Blockchain interaction
- **Oasis SDK**: Privacy-preserving ZKP computation

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Submit Proof
```
POST /api/zkp/submit
Body: { proofId: string, proofData: any }
```

### Verify Proof
```
POST /api/zkp/verify
Body: { proofId: string }
```

### Get Proof Status
```
GET /api/zkp/proof/:proofId
```

### Generate ZKP
```
POST /api/zkp/generate
Body: { data: any, secret?: string }
```

## Integration

### With Smart Contracts
The backend connects to the deployed smart contracts using ethers.js. Configure the contract address in `.env`:

```
ZKP_CONTRACT_ADDRESS=0x...
```

### With Oasis
For privacy-preserving ZKP computation, the backend integrates with Oasis Sapphire. Configure Oasis settings in `.env`:

```
OASIS_NETWORK=testnet
OASIS_PARATIME=sapphire
```

## Architecture

```
src/
├── index.ts           # Application entry point
├── routes/            # API route handlers
│   └── zkp.ts
├── services/          # Business logic
│   └── zkp-service.ts
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```
