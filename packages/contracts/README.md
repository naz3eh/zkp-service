# Smart Contracts Package

This package contains smart contracts for the ZKP service using Hardhat.

## Technologies

- **Hardhat**: Modern Ethereum development environment (v2.22+, ready for Hardhat 3)
- **EVVM**: Deployment protocol integration
- **Oasis Sapphire**: Privacy-preserving smart contract platform for ZKP computation

## Setup

```bash
npm install
```

## Development

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Deploy Contracts

Local deployment:
```bash
npm run node  # In one terminal
npm run deploy:local  # In another terminal
```

Deploy to EVVM:
```bash
npm run deploy -- --network evvm
```

Deploy to Oasis Sapphire:
```bash
npm run deploy -- --network sapphire-testnet
```

## Environment Variables

Create a `.env` file in this package directory:

```
PRIVATE_KEY=your_private_key
EVVM_RPC_URL=https://your-evvm-node
EVVM_CHAIN_ID=your_chain_id
EVVM_API_KEY=your_api_key
OASIS_API_KEY=your_oasis_api_key
```

## Contracts

### ZKPVerifier

A zero-knowledge proof verification contract that:
- Accepts proof submissions
- Verifies proofs on-chain
- Tracks verification history
- Integrates with Oasis Sapphire for privacy-preserving computation

## Network Configuration

The Hardhat configuration includes:
- **Local**: For development and testing
- **EVVM**: For production deployment using EVVM protocol
- **Oasis Sapphire**: For privacy-preserving ZKP operations
