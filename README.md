# ZKP Service Monorepo

Zero-Knowledge Proof as a Service - A comprehensive monorepo containing frontend, smart contracts, and backend for privacy-preserving proof generation and verification.

## 🏗️ Architecture

This monorepo contains three main packages:

- **`packages/contracts`**: Smart contracts built with Hardhat 3 for on-chain proof verification
- **`packages/backend`**: Node.js/Express API service for proof management and blockchain interaction
- **`packages/frontend`**: Vite + React + TypeScript web application for user interaction

## 🚀 Technologies

### Smart Contracts
- **Hardhat 3**: Modern Ethereum development environment with ES modules ([docs](https://hardhat.org/docs/hardhat3/whats-new))
- **EVVM**: Deployment protocol ([docs](https://www.evvm.info/docs/intro))
- **Oasis Sapphire**: Privacy-preserving smart contracts for ZKP computation ([docs](https://docs.oasis.io/))

### Backend
- Express.js with TypeScript
- Ethers.js for blockchain interaction
- Oasis SDK integration

### Frontend
- Vite for blazing fast development
- React 18 + TypeScript
- Tailwind CSS

## 📦 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install all dependencies
npm install

# Or install for specific package
npm install --workspace=packages/contracts
npm install --workspace=packages/backend
npm install --workspace=packages/frontend
```

### Development

```bash
# Run all packages in development mode
npm run dev

# Or run specific packages
npm run contracts:compile    # Compile smart contracts
npm run backend:dev          # Start backend API
npm run frontend:dev         # Start frontend dev server
```

## 📚 Package Documentation

### Smart Contracts (`packages/contracts`)
Smart contracts for ZKP verification using Hardhat 3 with ES modules.

```bash
cd packages/contracts
npm install
npm run compile              # Compile contracts
npm run test                # Run tests
npm run deploy:local        # Deploy to local network
```

See [packages/contracts/README.md](packages/contracts/README.md) for detailed documentation.

### Backend (`packages/backend`)
API service for proof operations and blockchain interaction.

```bash
cd packages/backend
npm install
cp .env.example .env        # Configure environment
npm run dev                 # Start development server
```

API endpoints:
- `POST /api/zkp/generate` - Generate a ZKP using Oasis
- `POST /api/zkp/submit` - Submit proof to blockchain
- `POST /api/zkp/verify` - Verify a proof
- `GET /api/zkp/proof/:id` - Get proof status

See [packages/backend/README.md](packages/backend/README.md) for detailed documentation.

### Frontend (`packages/frontend`)
Vite + React web application for interacting with the ZKP service.

```bash
cd packages/frontend
npm install
cp .env.example .env        # Configure environment
npm run dev                 # Start development server
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

See [packages/frontend/README.md](packages/frontend/README.md) for detailed documentation.

## 🔐 Environment Configuration

### Contracts
Create `packages/contracts/.env`:
```
PRIVATE_KEY=your_private_key
EVVM_RPC_URL=https://your-evvm-node
EVVM_CHAIN_ID=your_chain_id
OASIS_API_KEY=your_oasis_api_key
```

### Backend
Create `packages/backend/.env`:
```
PORT=3001
RPC_URL=http://localhost:8545
ZKP_CONTRACT_ADDRESS=0x...
OASIS_NETWORK=testnet
```

### Frontend
Create `packages/frontend/.env`:
```
VITE_API_URL=http://localhost:3001
```

## 🧪 Testing

```bash
# Run tests for all packages
npm test

# Run tests for specific package
npm test --workspace=packages/contracts
```

## 🏗️ Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=packages/backend
```

## 📖 Learn More

- [Hardhat 3 Documentation](https://hardhat.org/docs/hardhat3/whats-new)
- [EVVM Deployment Protocol](https://www.evvm.info/docs/intro)
- [Oasis Network Documentation](https://docs.oasis.io/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details
