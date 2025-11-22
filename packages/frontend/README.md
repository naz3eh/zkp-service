# Frontend Package

Next.js frontend application for the ZKP service, providing a user interface for proof generation, submission, and verification.

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Ethers.js**: Blockchain interaction
- **Axios**: HTTP client for API calls

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Build

```bash
npm run build
npm start
```

## Features

### Generate Proof
Generate zero-knowledge proofs using Oasis Sapphire for privacy-preserving computation.

### Submit Proof
Submit proofs to the blockchain smart contract for on-chain verification.

### Verify Proof
Verify submitted proofs and check their status on the blockchain.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # React components
│   ├── ProofGeneration.tsx
│   ├── ProofSubmission.tsx
│   └── ProofVerification.tsx
├── lib/             # Utility functions
│   └── api.ts       # API client
└── types/           # TypeScript types
```

## Configuration

The frontend connects to the backend API. Set the API URL in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Integration

### With Backend
The frontend communicates with the backend via REST API endpoints:
- POST `/api/zkp/generate` - Generate a ZKP
- POST `/api/zkp/submit` - Submit a proof
- POST `/api/zkp/verify` - Verify a proof
- GET `/api/zkp/proof/:id` - Get proof status

### With Smart Contracts
Through the backend, the frontend interacts with deployed smart contracts for:
- Proof submission
- On-chain verification
- Proof status queries
