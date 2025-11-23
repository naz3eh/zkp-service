# Testing x402 Payment Flow - Quick Start Guide

## The Issue
Your wallet modal is working fine! The error is that the **merchant backend server** is not running on port 3001.

## Solution

### Option 1: Start the Backend Server (For Full Flow Testing)

```bash
# In a new terminal
cd packages/backend
npm install
npm run dev
```

The backend should start on `http://localhost:3001`

### Option 2: Demo Mode (Test Without Backend)

For now, since your teammate is building the merchant server, you can test the wallet connection with a mock endpoint:

1. **Start the facilitator** (for testing payment verification):
```bash
# Terminal 1
cd packages/facilitator
cp .env.example .env
# Edit .env with a test private key and funded Sepolia wallet
npm run dev
```

2. **Create a simple test endpoint** in your backend:

```bash
# Terminal 2
cd packages/backend
npm run dev
```

## Current Flow Status

✅ **Working:**
- Frontend form with Oasis public key integration
- MetaMask wallet connection
- x402-fetch client configured
- Facilitator service ready

❌ **Not Running:**
- Merchant backend server (port 3001)
- The `/api/paid/zkp/generate` endpoint

## Testing Wallet Connection Only

If you just want to test that wallet connection works, update the form to show a success message without calling the backend:

```typescript
// In X402Form.tsx handleWalletConfirm
// Temporarily comment out the API call:
toast.success("Wallet connected successfully!");
setResults({
  status: "demo",
  message: "Wallet connection working! Backend server needed for full payment flow."
});
```

## For Your Teammate (Merchant Backend)

They need to create an endpoint like:

```typescript
app.post('/api/paid/zkp/generate', async (req, res) => {
  const paymentProof = req.headers['x-payment'];
  
  if (!paymentProof) {
    // Return 402 Payment Required
    return res.status(402).json({
      error: 'Payment Required',
      amount: '1000000000000000', // 0.001 ETH
      recipient: process.env.MERCHANT_RECEIVER_ADDRESS,
    });
  }

  // Verify with facilitator
  const verification = await fetch('http://localhost:3002/api/facilitator/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentProof: JSON.parse(paymentProof),
      requiredAmount: '1000000000000000',
      requiredRecipient: process.env.MERCHANT_RECEIVER_ADDRESS,
    }),
  }).then(r => r.json());

  if (!verification.valid) {
    return res.status(402).json({ error: verification.error });
  }

  // Process the ZKP generation
  res.json({ success: true, paymentId: verification.paymentId });
});
```

Which server would you like me to help you set up first - the backend merchant or the facilitator?
