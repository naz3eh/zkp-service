# ZKP Service Architecture

## Overview

The ZKP Service is a monorepo-based application that provides Zero-Knowledge Proof as a Service. It integrates multiple cutting-edge technologies to enable privacy-preserving proof generation, submission, and verification.

## System Components

### 1. Smart Contracts (`packages/contracts`)

**Technology Stack:**
- Hardhat 3 - Modern development environment with ES modules
- Solidity 0.8.24 - Smart contract language
- OpenZeppelin - Secure contract libraries

**Key Contracts:**
- `ZKPVerifier.sol` - Main verification contract

**Deployment Targets:**
- Local Hardhat Network (development)
- EVVM Network (production deployment via EVVM protocol)
- Oasis Sapphire (privacy-preserving computation)

**Features:**
- Proof submission and storage
- On-chain verification
- Event emission for tracking
- Verifier reputation system

### 2. Backend Service (`packages/backend`)

**Technology Stack:**
- Node.js + Express - API framework
- TypeScript - Type safety
- Ethers.js - Blockchain interaction
- Oasis SDK - Privacy computation integration

**Architecture:**
```
src/
├── index.ts          # Application entry
├── routes/           # API endpoints
│   └── zkp.ts
├── services/         # Business logic
│   └── zkp-service.ts
├── types/            # Type definitions
└── utils/            # Helper functions
```

**API Endpoints:**
- `POST /api/zkp/generate` - Generate ZKP using Oasis
- `POST /api/zkp/submit` - Submit proof to blockchain
- `POST /api/zkp/verify` - Verify a proof
- `GET /api/zkp/proof/:id` - Query proof status

### 3. Frontend Application (`packages/frontend`)

**Technology Stack:**
- Vite - Next-generation frontend tooling
- React 18 - UI library
- TypeScript - Type safety
- Tailwind CSS - Styling
- Axios - HTTP client

**Architecture:**
```
src/
├── main.tsx          # Application entry
├── App.tsx           # Root component
├── index.css         # Global styles
├── components/       # React components
│   ├── ProofGeneration.tsx
│   ├── ProofSubmission.tsx
│   └── ProofVerification.tsx
├── lib/              # Utilities
│   └── api.ts
└── types/            # Type definitions
```

**User Features:**
- Generate ZKPs with Oasis integration
- Submit proofs to blockchain
- Verify proofs on-chain
- Check proof status

## Technology Integration

### Hardhat 3
- Modern Ethereum development environment
- Built-in testing framework
- Plugin ecosystem for extended functionality
- Network management and deployment automation

### EVVM Deployment Protocol
- Standardized deployment workflow
- Multi-chain support
- Deployment verification
- Configuration management

### Oasis Sapphire
- Privacy-preserving smart contract platform
- Confidential computation capabilities
- ZKP generation and verification
- Private state management

## Data Flow

### Proof Generation Flow
```
User → Frontend → Backend → Oasis SDK → Generate ZKP → Return to User
```

### Proof Submission Flow
```
User → Frontend → Backend → Ethers.js → Smart Contract → Blockchain
```

### Proof Verification Flow
```
User → Frontend → Backend → Smart Contract Query → Return Status
```

## Security Considerations

### Smart Contract Security
- OpenZeppelin battle-tested libraries
- Require statements for input validation
- Event emission for transparency
- Access control for critical functions

### Backend Security
- Environment variable protection
- Input validation with Zod
- Error handling and logging
- CORS configuration

### Frontend Security
- Environment variable isolation (NEXT_PUBLIC_* pattern)
- Client-side validation
- Secure API communication
- No private key exposure

## Development Workflow

### Local Development
1. Start local Hardhat node
2. Deploy contracts locally
3. Start backend with local RPC
4. Start frontend pointing to local backend

### Testing
1. Unit tests for smart contracts
2. Integration tests for backend API
3. E2E tests for frontend flows

### Deployment
1. Deploy contracts to target network (EVVM/Sapphire)
2. Configure backend with contract addresses
3. Build and deploy backend API
4. Build and deploy frontend with API URL

## Scalability

### Smart Contracts
- Gas optimization in Solidity
- Batch operations support
- Event-driven architecture

### Backend
- Stateless design for horizontal scaling
- Caching strategies for blockchain queries
- Rate limiting and request queuing

### Frontend
- Optimized Vite production builds
- Client-side caching
- Code splitting for faster loads

## Future Enhancements

1. **Advanced ZKP Protocols**
   - zk-SNARKs integration
   - zk-STARKs support
   - Recursive proofs

2. **Multi-Chain Support**
   - Cross-chain proof verification
   - Bridge integrations
   - Unified proof registry

3. **Enhanced Privacy**
   - Anonymous credential system
   - Private voting mechanisms
   - Confidential transactions

4. **Developer Tools**
   - SDK for third-party integration
   - CLI tools for proof management
   - Proof templates library

## Monitoring and Maintenance

### Metrics to Track
- Proof submission rate
- Verification success rate
- Gas costs per operation
- API response times
- Contract event emissions

### Maintenance Tasks
- Smart contract upgrades
- Dependency updates
- Security audits
- Performance optimization
