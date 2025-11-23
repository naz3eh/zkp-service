# Getting Started with ZKP Service

Welcome! This guide will help you get the ZKP Service monorepo up and running in minutes.

## 🎯 What is ZKP Service?

ZKP Service is a comprehensive Zero-Knowledge Proof as a Service platform that allows you to:
- **Generate** privacy-preserving zero-knowledge proofs using Oasis Sapphire
- **Submit** proofs to blockchain smart contracts
- **Verify** proofs on-chain for trustless verification

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.0.0 or higher ([download](https://nodejs.org/))
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git** for version control

Check your versions:
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 9.0.0
```

## 🚀 Quick Start (5 minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/naz3eh/zkp-service.git
cd zkp-service

# Install all dependencies for all packages
npm install
```

This will install dependencies for:
- Smart contracts package
- Backend API package  
- Frontend UI package

### Step 2: Start Development Environment

Open **4 terminal windows** and run these commands:

#### Terminal 1: Start Blockchain Node
```bash
cd packages/contracts
npm run node
```
Wait for "Started HTTP and WebSocket JSON-RPC server..."

#### Terminal 2: Deploy Smart Contracts
```bash
cd packages/contracts
npm run deploy:local
```
Copy the deployed contract address (you'll need it for the backend).

#### Terminal 3: Start Backend API
```bash
cd packages/backend
cp .env.example .env
# Edit .env and set:
# RPC_URL=http://localhost:8545
# ZKP_CONTRACT_ADDRESS=<paste address from step 2>

npm run dev
```
Backend runs at http://localhost:3001

#### Terminal 4: Start Frontend UI
```bash
cd packages/frontend
cp .env.example .env
# .env should have:
# VITE_API_URL=http://localhost:3001

npm run dev
```
Frontend runs at http://localhost:3000

### Step 3: Try It Out!

Open your browser to http://localhost:3000 and:

1. **Generate a Proof**
   - Go to "Generate Proof" tab
   - Enter some data (e.g., "secret message")
   - Click "Generate Proof"
   - Copy the Proof ID

2. **Submit the Proof**
   - Go to "Submit Proof" tab
   - Enter the Proof ID
   - Enter proof data as JSON: `{"proof": "test"}`
   - Click "Submit Proof"

3. **Verify the Proof**
   - Go to "Verify Proof" tab
   - Enter the Proof ID
   - Click "Verify Proof" or "Get Status"

## 📦 What's in the Monorepo?

```
zkp-service/
├── packages/
│   ├── contracts/    # Smart contracts (Hardhat + Solidity)
│   ├── backend/      # API service (Express + TypeScript)
│   └── frontend/     # Web UI (Vite + React + TypeScript)
├── README.md         # Project overview
├── ARCHITECTURE.md   # System design
├── DEPLOYMENT.md     # Production deployment
├── DEVELOPMENT.md    # Development guide
└── package.json      # Root workspace config
```

## 🛠️ Common Commands

### Build Everything
```bash
npm run build
```

### Clean Everything
```bash
npm run clean
```

### Run Tests
```bash
# Smart contracts tests
cd packages/contracts
npm test
```

### Compile Contracts
```bash
cd packages/contracts
npm run compile
```

## 📚 Next Steps

### For Developers
- Read [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development workflow
- Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand system design
- Explore each package's README for specific documentation

### For Deployment
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide
- Configure environment variables for your target networks
- Set up EVVM and Oasis Sapphire credentials

### For Integration
Each package can be used independently:

**Smart Contracts**
```bash
cd packages/contracts
npm install
npm run compile
npm run deploy -- --network <your-network>
```

**Backend API**
```bash
cd packages/backend
npm install
npm run build
npm start
```

**Frontend**
```bash
cd packages/frontend
npm install
npm run build
npm run preview
```

## 🔧 Configuration

### Smart Contracts (`packages/contracts/.env`)
```bash
PRIVATE_KEY=your_private_key
EVVM_RPC_URL=https://your-evvm-node
EVVM_CHAIN_ID=your_chain_id
OASIS_API_KEY=your_oasis_api_key
```

### Backend (`packages/backend/.env`)
```bash
PORT=3001
RPC_URL=http://localhost:8545
ZKP_CONTRACT_ADDRESS=0x...
OASIS_NETWORK=testnet
```

### Frontend (`packages/frontend/.env`)
```bash
VITE_API_URL=http://localhost:3001
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port in config
```

### Dependencies Installation Failed
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Contract Compilation Failed
```bash
# Clean and recompile
cd packages/contracts
npm run clean
npm run compile
```

### Backend Build Errors
```bash
# Check TypeScript version
cd packages/backend
npm run build -- --verbose
```

## 🎓 Learning Resources

### Technologies
- [Hardhat Documentation](https://hardhat.org/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Oasis Network](https://docs.oasis.io/)
- [EVVM Protocol](https://www.evvm.info/docs/intro)

### ZKP Concepts
- [Zero-Knowledge Proofs Explained](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
- [Oasis Sapphire - Confidential Smart Contracts](https://docs.oasis.io/dapp/sapphire/)

## 💡 Tips

1. **Development Speed**: Vite provides instant HMR - changes appear immediately
2. **Testing**: Write contract tests first, then build API and UI
3. **Security**: Never commit `.env` files - they contain secrets
4. **Debugging**: Use browser DevTools and VSCode debugger
5. **Performance**: Rate limiting is enabled - 20 proof ops per 15 min

## 🤝 Getting Help

1. Check package-specific READMEs in `packages/*/README.md`
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Read [DEVELOPMENT.md](DEVELOPMENT.md) for detailed workflows
4. Check GitHub Issues for known problems

## 🎉 You're Ready!

You now have a fully functional ZKP Service running locally. Start building your privacy-preserving applications!

**Happy coding! 🚀**
