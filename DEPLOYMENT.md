# Deployment Guide

This guide provides step-by-step instructions for deploying the ZKP Service monorepo to production.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Access to target blockchain networks (EVVM, Oasis Sapphire)
- Private key for deployment
- API keys for network access

## Environment Setup

### 1. Smart Contracts Environment

Create `packages/contracts/.env`:

```bash
# Deployment private key (without 0x prefix)
PRIVATE_KEY=your_deployment_private_key

# EVVM Configuration
EVVM_RPC_URL=https://your-evvm-rpc-endpoint
EVVM_CHAIN_ID=your_chain_id
EVVM_API_KEY=your_evvm_api_key

# Oasis Sapphire Configuration
OASIS_API_KEY=your_oasis_api_key

# Select deployment target
DEFAULT_NETWORK=evvm
```

### 2. Backend Environment

Create `packages/backend/.env`:

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Blockchain RPC
RPC_URL=https://your-evvm-rpc-endpoint
PRIVATE_KEY=your_backend_private_key

# Deployed Contract Addresses
ZKP_CONTRACT_ADDRESS=0x...  # Set after contract deployment

# Oasis Configuration
OASIS_NETWORK=mainnet
OASIS_PARATIME=sapphire
OASIS_API_KEY=your_oasis_api_key
```

### 3. Frontend Environment

Create `packages/frontend/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-api-url
```

## Deployment Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Deploy Smart Contracts

#### Deploy to EVVM

```bash
cd packages/contracts
npm run compile
npm run deploy -- --network evvm
```

#### Deploy to Oasis Sapphire

```bash
npm run deploy -- --network sapphire
```

Save the deployed contract addresses from the output.

### Step 3: Update Backend Configuration

Update `packages/backend/.env` with the deployed contract address:

```bash
ZKP_CONTRACT_ADDRESS=0x...  # From Step 2
```

### Step 4: Build All Packages

```bash
# From root directory
npm run build
```

This will:
- Compile smart contracts
- Build backend TypeScript to JavaScript
- Create optimized production frontend build

### Step 5: Deploy Backend

#### Option A: Traditional Server

```bash
cd packages/backend
npm start
```

#### Option B: Docker Deployment

Create `packages/backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

RUN npm install --workspace=packages/backend --production

COPY packages/backend/dist ./packages/backend/dist

WORKDIR /app/packages/backend

EXPOSE 3001

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t zkp-backend .
docker run -p 3001:3001 --env-file packages/backend/.env zkp-backend
```

#### Option C: Cloud Platform (Vercel, Railway, etc.)

1. Connect your repository
2. Set root directory to `packages/backend`
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Configure environment variables

### Step 6: Deploy Frontend

#### Option A: Vercel (Recommended for Next.js)

```bash
cd packages/frontend
npm install -g vercel
vercel --prod
```

Or connect via Vercel Dashboard:
1. Import repository
2. Set root directory to `packages/frontend`
3. Framework preset: Next.js
4. Configure environment variable: `NEXT_PUBLIC_API_URL`

#### Option B: Static Export

```bash
cd packages/frontend
npm run build
# Deploy the `.next` folder to your static host
```

#### Option C: Docker Deployment

Create `packages/frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm install --workspace=packages/frontend

COPY packages/frontend ./packages/frontend

WORKDIR /app/packages/frontend

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/packages/frontend/.next ./.next
COPY --from=builder /app/packages/frontend/public ./public
COPY --from=builder /app/packages/frontend/package.json ./

RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]
```

## Verification

### 1. Verify Smart Contracts

Check contract on block explorer:
- EVVM: Visit your EVVM block explorer with contract address
- Oasis: https://explorer.oasis.io/

### 2. Verify Backend

```bash
curl https://your-backend-url/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 3. Verify Frontend

Visit your frontend URL and test:
1. Generate a ZKP
2. Submit a proof
3. Verify the proof

## Monitoring

### Smart Contracts

Monitor contract events:
- `ProofSubmitted`
- `ProofVerified`

Set up alerts for:
- Failed transactions
- Gas price spikes
- Unusual activity

### Backend

Monitor metrics:
- API response times
- Error rates
- Request volumes
- Blockchain connection status

Tools:
- Application Performance Monitoring (APM)
- Log aggregation (e.g., LogRocket, Sentry)
- Uptime monitoring

### Frontend

Monitor:
- Page load times
- JavaScript errors
- User interactions
- API call success rates

Tools:
- Google Analytics
- Sentry for error tracking
- Web Vitals monitoring

## Troubleshooting

### Contract Deployment Issues

**Problem**: Deployment fails with "insufficient funds"
- **Solution**: Ensure deployer wallet has enough tokens for gas

**Problem**: Contract verification fails
- **Solution**: Check compiler version matches, flatten contracts if needed

### Backend Issues

**Problem**: Cannot connect to blockchain
- **Solution**: Verify RPC URL and network connectivity

**Problem**: Contract interaction fails
- **Solution**: Verify contract address and ABI are correct

### Frontend Issues

**Problem**: API calls fail with CORS errors
- **Solution**: Configure CORS in backend to allow frontend origin

**Problem**: Build fails
- **Solution**: Check environment variables are set correctly

## Rollback Procedure

If deployment issues occur:

1. **Smart Contracts**: Deploy previous version to new address, update backend config
2. **Backend**: Revert to previous Docker image or git commit
3. **Frontend**: Revert deployment on hosting platform

## Security Checklist

- [ ] Private keys are stored securely (never in code)
- [ ] Environment variables are properly configured
- [ ] Smart contracts are audited
- [ ] API endpoints have rate limiting
- [ ] HTTPS is enabled for all services
- [ ] Database credentials are secured (if applicable)
- [ ] Monitoring and alerting are configured
- [ ] Backup strategy is in place

## Maintenance

### Regular Updates

- Update dependencies monthly: `npm update`
- Review security advisories: `npm audit`
- Monitor gas prices and optimize if needed
- Review and optimize smart contract calls

### Performance Optimization

- Enable CDN for frontend assets
- Implement caching strategies
- Optimize database queries (if applicable)
- Monitor and optimize gas usage

## Support

For deployment issues:
1. Check logs in respective packages
2. Review documentation at package README files
3. Consult ARCHITECTURE.md for system design
4. Check GitHub Issues for known problems
