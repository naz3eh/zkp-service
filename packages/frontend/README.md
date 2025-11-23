# Frontend Package

Vite + React + TypeScript frontend application for the ZKP service, providing a user interface for proof generation, submission, and verification.

## Technologies

- **Vite**: Next-generation frontend tooling
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Ethers.js**: Blockchain interaction
- **Axios**: HTTP client for API calls

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

Open [http://localhost:3000](http://localhost:3000) with your browser.

The development server features:
- ⚡️ Lightning fast HMR (Hot Module Replacement)
- 🔧 TypeScript support out of the box
- 📦 Optimized build with code splitting

## Build

```bash
npm run build
```

Outputs optimized production build to `dist/` directory.

### Preview Production Build

```bash
npm run preview
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

## Configuration

### Environment Variables

Create a `.env` file in the package root:

```env
VITE_API_URL=http://localhost:3001
```

Note: Vite exposes environment variables prefixed with `VITE_` to the client.

### Tailwind CSS

Customize styles in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
    },
  },
}
```

### TypeScript

TypeScript configuration in `tsconfig.json`. The project uses:
- Strict mode enabled
- Path aliases (`@/*` maps to `src/*`)
- Modern ES2020 target

## API Integration

The frontend communicates with the backend via REST API:

```typescript
import { zkpApi } from '@/lib/api'

// Generate proof
const proof = await zkpApi.generateProof(data, secret)

// Submit proof
await zkpApi.submitProof(proofId, proofData)

// Verify proof
await zkpApi.verifyProof(proofId)

// Get proof status
const status = await zkpApi.getProofStatus(proofId)
```

## Styling

### Using Tailwind CSS

```tsx
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
  Styled with Tailwind
</div>
```

### Dark Mode

Dark mode is supported out of the box:

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>
```

## Code Quality

### Linting

```bash
npm run lint
```

ESLint configuration includes:
- TypeScript support
- React Hooks rules
- React Refresh plugin

### Type Checking

TypeScript automatically checks types during development and build.

## Deployment

### Static Hosting (Netlify, Vercel, etc.)

```bash
npm run build
# Deploy the dist/ folder
```

### Docker

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables in Production

For production, set environment variables in your hosting platform:

- **Netlify**: Environment variables in site settings
- **Vercel**: Environment variables in project settings
- **Docker**: Use `--env-file` or pass via `-e` flag

## Performance

Vite provides:
- Fast cold starts
- Instant hot module replacement
- Optimized production builds with:
  - Code splitting
  - Tree shaking
  - Asset optimization

## Browser Support

Supports modern browsers:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)

## Integration

### With Backend

Configure the API URL in `.env`:

```
VITE_API_URL=http://localhost:3001
```

### With Smart Contracts

Through the backend, the frontend interacts with deployed smart contracts for:
- Proof submission
- On-chain verification
- Proof status queries

## Troubleshooting

### Port Already in Use

Change port in `vite.config.ts`:

```typescript
server: {
  port: 3001,
}
```

### Build Errors

Clear cache and rebuild:

```bash
rm -rf node_modules/.vite
npm run build
```

### Type Errors

Ensure all dependencies are installed:

```bash
npm install
```

## Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
