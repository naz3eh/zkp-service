# Development Guide

This guide will help you set up your local development environment and understand the development workflow for the ZKP Service monorepo.

## Initial Setup

### Prerequisites

- Node.js >= 18.0.0 (use `.nvmrc` file: `nvm use`)
- npm >= 9.0.0
- Git

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/naz3eh/zkp-service.git
cd zkp-service

# Install all dependencies
npm install
```

This will install dependencies for all packages in the monorepo using npm workspaces.

## Package Structure

```
zkp-service/
├── packages/
│   ├── contracts/      # Smart contracts (Hardhat 3)
│   ├── backend/        # API service (Express + TypeScript)
│   └── frontend/       # Web UI (Vite + React + TypeScript)
├── package.json        # Root workspace configuration
├── README.md
├── ARCHITECTURE.md     # System architecture
└── DEPLOYMENT.md       # Deployment guide
```

## Development Workflow

### Running Everything Locally

#### 1. Start Hardhat Local Node

```bash
# Terminal 1: Start local blockchain
cd packages/contracts
npm run node
```

This starts a local Ethereum node at `http://localhost:8545`.

#### 2. Deploy Contracts Locally

```bash
# Terminal 2: Deploy contracts
cd packages/contracts
npm run deploy:local
```

Save the deployed contract address.

#### 3. Start Backend

```bash
# Terminal 3: Start backend API
cd packages/backend
cp .env.example .env

# Edit .env with:
# RPC_URL=http://localhost:8545
# ZKP_CONTRACT_ADDRESS=<address from step 2>

npm run dev
```

Backend runs at `http://localhost:3001`.

#### 4. Start Frontend

```bash
# Terminal 4: Start frontend
cd packages/frontend
cp .env.example .env

# .env should have:
# VITE_API_URL=http://localhost:3001

npm run dev
```

Frontend runs at `http://localhost:3000`.

### Quick Start Script

For convenience, you can create a script to start everything:

```bash
#!/bin/bash
# start-dev.sh

# Start Hardhat node
cd packages/contracts && npm run node &
sleep 5

# Deploy contracts
cd packages/contracts && npm run deploy:local

# Start backend
cd packages/backend && npm run dev &

# Start frontend
cd packages/frontend && npm run dev
```

## Working with Smart Contracts

### Development Cycle

1. **Write/Modify Contract**
   ```bash
   cd packages/contracts
   # Edit contracts/YourContract.sol
   ```

2. **Compile**
   ```bash
   npm run compile
   ```

3. **Test**
   ```bash
   npm run test
   ```

4. **Deploy Locally**
   ```bash
   npm run deploy:local
   ```

### Testing Contracts

```bash
cd packages/contracts
npm test
```

Tests are in `test/` directory using Hardhat's testing framework.

### Adding New Contracts

1. Create new `.sol` file in `contracts/`
2. Write tests in `test/`
3. Update deployment script in `scripts/deploy.js`
4. Compile and test

### Network Configuration

Edit `hardhat.config.js` to add new networks:

```javascript
networks: {
  yourNetwork: {
    url: "YOUR_RPC_URL",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: YOUR_CHAIN_ID
  }
}
```

## Working with Backend

### Development Server

```bash
cd packages/backend
npm run dev
```

Uses `tsx watch` for hot reloading on file changes.

### Adding New API Routes

1. Create route file in `src/routes/`
   ```typescript
   // src/routes/new-route.ts
   import { Router } from 'express';
   
   export const newRouter = Router();
   
   newRouter.get('/endpoint', (req, res) => {
     res.json({ message: 'Hello' });
   });
   ```

2. Register in `src/index.ts`
   ```typescript
   import { newRouter } from './routes/new-route';
   app.use('/api/new', newRouter);
   ```

### Adding Business Logic

Create services in `src/services/`:

```typescript
// src/services/my-service.ts
export class MyService {
  async doSomething() {
    // Implementation
  }
}
```

### Type Safety

Use TypeScript types in `src/types/`:

```typescript
// src/types/proof.ts
export interface Proof {
  proofId: string;
  data: any;
  timestamp: number;
}
```

### Building for Production

```bash
npm run build
```

Outputs to `dist/` directory.

## Working with Frontend

### Development Server

```bash
cd packages/frontend
npm run dev
```

Lightning fast HMR (Hot Module Replacement) enabled by Vite.

### Project Structure

```
src/
├── main.tsx          # Application entry point
├── App.tsx           # Root component
├── index.css         # Global styles with Tailwind
├── components/       # React components
│   ├── ProofGeneration.tsx
│   ├── ProofSubmission.tsx
│   └── ProofVerification.tsx
├── lib/             # Utility functions
│   └── api.ts       # API client
└── types/           # TypeScript types
```

### Creating Components

```typescript
// src/components/MyComponent.tsx
import { useState } from 'react'

export function MyComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  )
}
```

### Styling with Tailwind CSS

Configure in `tailwind.config.js`:

Example:
```typescript
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Styled with Tailwind
</div>
```

### API Integration

Add API functions to `src/lib/api.ts`:

```typescript
export const myApi = {
  async getData() {
    const response = await api.get('/endpoint');
    return response.data;
  }
}
```

## Testing

### Contract Tests

```bash
cd packages/contracts
npm test
```

### Backend Tests

```bash
cd packages/backend
npm test
```

(Tests need to be implemented using Jest)

### Frontend Tests

```bash
cd packages/frontend
npm test
```

(Tests need to be implemented)

## Code Quality

### Linting

```bash
# Frontend linting
cd packages/frontend
npm run lint
```

### Type Checking

```bash
# Backend
cd packages/backend
npm run build  # TypeScript compilation checks types

# Frontend
cd packages/frontend
npm run build  # Vite build checks types
```

## Common Development Tasks

### Install New Package

For a specific workspace:
```bash
npm install <package> --workspace=packages/backend
```

### Update Dependencies

```bash
# Update all packages
npm update

# Update specific workspace
npm update --workspace=packages/frontend
```

### Clean Build Artifacts

```bash
# Clean all
npm run clean

# Clean specific package
cd packages/backend
npm run clean
```

## Debugging

### Smart Contracts

Use Hardhat console:
```bash
cd packages/contracts
npx hardhat console --network localhost
```

Add `console.log` in Solidity (Hardhat feature):
```solidity
import "hardhat/console.sol";

function myFunction() {
  console.log("Debug message");
}
```

### Backend

Use Node.js debugger:
```bash
node --inspect dist/index.js
```

Or use VSCode debugger with launch configuration.

### Frontend

Use browser DevTools and React DevTools extension.

Add logging:
```typescript
console.log('Debug:', data);
```

## Environment Variables

### Development

Use `.env` files for local development:

- `packages/contracts/.env` - Contract deployment keys
- `packages/backend/.env` - Backend configuration
- `packages/frontend/.env.local` - Frontend API URLs

### Never Commit

- Private keys
- API secrets
- `.env` files (they're in `.gitignore`)

Always use `.env.example` as templates.

## Git Workflow

### Feature Development

```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-feature
# Create Pull Request
```

### Commit Messages

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## Troubleshooting

### Issue: Dependencies not installing

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: TypeScript errors

```bash
# Rebuild
npm run build

# Check tsconfig.json
```

### Issue: Port already in use

```bash
# Find process using port
lsof -i :3000  # or :3001, :8545

# Kill process
kill -9 <PID>
```

### Issue: Contract compilation fails

- Check Solidity version in contract matches `hardhat.config.js`
- Verify imports are correct
- Check for syntax errors

## Resources

### Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Oasis Documentation](https://docs.oasis.io/)
- [EVVM Documentation](https://www.evvm.info/docs/intro)

### Learning Resources

- [Solidity by Example](https://solidity-by-example.org/)
- [Hardhat Tutorial](https://hardhat.org/tutorial)
- [Next.js Learn](https://nextjs.org/learn)

## Getting Help

1. Check documentation in package README files
2. Review ARCHITECTURE.md for system design
3. Search GitHub Issues
4. Ask in team chat/discussions
