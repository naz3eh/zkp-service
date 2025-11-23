# x402 Facilitator Service

Payment verification and settlement service for the x402 protocol on Ethereum Sepolia.

## Overview

The x402 Facilitator is a standalone service that handles payment verification and blockchain settlement for merchants. It acts as an intermediary between clients (using x402-fetch) and merchant servers, abstracting away the complexity of blockchain interactions.

**Key Features:**
- Payment signature verification
- Transaction settlement on Sepolia
- Double-spend prevention
- RESTful API for merchant integration
- Payment tracking and status queries

## Quick Start

### 1. Installation

```bash
cd packages/facilitator
npm install
```

### 2. Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```bash
# Generate a new wallet
npx tsx -e "import {ethers} from 'ethers'; const w = ethers.Wallet.createRandom(); console.log('Address:', w.address, '\nPrivate Key:', w.privateKey)"

# Update .env
FACILITATOR_PRIVATE_KEY=0x_your_private_key
MERCHANT_RECEIVER_ADDRESS=0x_merchant_receiver_address
SEPOLIA_RPC_URL=https://sepolia.gateway.tenderly.co
AUTO_SETTLE=true
```

### 3. Start Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The facilitator will start on `http://localhost:3002`

## Merchant Integration

### Architecture

```
Client (x402-fetch) → Merchant Server → Facilitator → Sepolia Blockchain
```

### Integration Steps

#### Step 1: Verify Payments in Your Merchant Server

When a request includes a payment header, verify it with the facilitator:

```typescript
import express from 'express';

const app = express();

app.post('/api/paid/resource', async (req, res) => {
  // 1. Extract payment proof from request header
  const paymentProof = req.headers['x-payment'];
  
  if (!paymentProof) {
    return res.status(402).json({
      error: 'Payment Required',
      amount: '1000000000000000', // 0.001 ETH in wei
      recipient: '0xYourMerchantAddress',
    });
  }

  try {
    // 2. Verify payment with facilitator
    const response = await fetch('http://localhost:3002/api/facilitator/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentProof: JSON.parse(paymentProof as string),
        requiredAmount: '1000000000000000', // 0.001 ETH
        requiredRecipient: '0xYourMerchantAddress',
      }),
    });

    const result = await response.json();

    if (!result.valid) {
      return res.status(402).json({
        error: 'Invalid payment',
        details: result.error,
      });
    }

    // 3. Payment verified! Process the request
    console.log('Payment verified:', result.paymentId);
    console.log('Settlement TX:', result.settlementTxHash);

    // Your business logic here
    res.json({
      success: true,
      data: 'Your protected resource',
      paymentId: result.paymentId,
    });

  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});
```

#### Step 2: Handle 402 Responses

Return proper 402 responses when payment is missing:

```typescript
res.status(402).json({
  error: 'Payment Required',
  amount: '1000000000000000', // Required amount in wei
  recipient: '0xYourMerchantAddress', // Where payment should go
  currency: 'ETH',
  network: 'sepolia',
});
```

The client's x402-fetch will automatically:
1. Parse these payment requirements
2. Prompt MetaMask for payment signature
3. Retry the request with payment proof

## API Reference

### POST /api/facilitator/verify

Verify a payment proof and optionally settle it.

**Request:**
```json
{
  "paymentProof": {
    "signature": "0x...",
    "amount": "1000000000000000",
    "recipient": "0x...",
    "payer": "0x...",
    "nonce": "random_nonce",
    "timestamp": 1234567890
  },
  "requiredAmount": "1000000000000000",
  "requiredRecipient": "0x..."
}
```

**Response (Success):**
```json
{
  "valid": true,
  "paymentId": "0x...",
  "settlementTxHash": "0x...",
  "settled": true
}
```

**Response (Failure):**
```json
{
  "valid": false,
  "error": "Insufficient payment: 500000000000000 < 1000000000000000"
}
```

### GET /api/facilitator/payment/:paymentId

Query payment status.

**Response:**
```json
{
  "paymentId": "0x...",
  "verified": true,
  "settled": true,
  "settlementTxHash": "0x...",
  "amount": "1000000000000000",
  "payer": "0x...",
  "recipient": "0x...",
  "createdAt": 1234567890,
  "settledAt": 1234567900
}
```

### POST /api/facilitator/settle

Manually settle a verified payment (if auto-settle is disabled).

**Request:**
```json
{
  "paymentId": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x..."
}
```

### GET /api/facilitator/status

Get facilitator service status.

**Response:**
```json
{
  "facilitatorAddress": "0x...",
  "balance": "0.5 ETH",
  "totalPayments": 42,
  "settledPayments": 40,
  "pendingPayments": 2,
  "autoSettle": true
}
```

### GET /api/facilitator/payments

List all payments (admin endpoint).

**Response:**
```json
{
  "total": 42,
  "payments": [
    {
      "paymentId": "0x...",
      "verified": true,
      "settled": true,
      "amount": "1000000000000000",
      "payer": "0x...",
      "recipient": "0x...",
      "createdAt": 1234567890,
      "settledAt": 1234567900
    }
  ]
}
```

### Rate Limiting

The service includes rate limiting (100 requests per 15 minutes by default). Adjust in `.env`:
```bash
API_RATE_LIMIT=100
```

### Double-Spend Prevention

The facilitator tracks used nonces per payer address to prevent double-spending.

## Testing

### Manual Testing

1. **Start facilitator**:
   ```bash
   npm run dev
   ```

2. **Check status**:
   ```bash
   curl http://localhost:3002/api/facilitator/status
   ```

3. **Test verification** (mock payment proof):
   ```bash
   curl -X POST http://localhost:3002/api/facilitator/verify \
     -H "Content-Type: application/json" \
     -d '{
       "paymentProof": {
         "signature": "0x...",
         "amount": "1000000000000000",
         "recipient": "0xRecipientAddress",
         "payer": "0xPayerAddress",
         "nonce": "test123",
         "timestamp": '$(date +%s000)'
       },
       "requiredAmount": "1000000000000000",
       "requiredRecipient": "0xRecipientAddress"
     }'
   ```

## Monitoring

### Check Facilitator Balance

```bash
curl http://localhost:3002/api/facilitator/status | jq '.balance'
```

### View Recent Payments

```bash
curl http://localhost:3002/api/facilitator/payments | jq '.payments | .[:5]'
```

### Verify Settlement on Etherscan

Visit [Sepolia Etherscan](https://sepolia.etherscan.io/) and search for the settlement transaction hash.

## Troubleshooting

### "Verification error: Invalid signature"

**Solution**: Check:
- Payment proof signature is correctly formatted
- Message construction matches client-side signing
- Payer address matches signature

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3002
SEPOLIA_RPC_URL=https://your-dedicated-rpc.com
FACILITATOR_PRIVATE_KEY=use_key_management_service
AUTO_SETTLE=true
MIN_CONFIRMATION_BLOCKS=3  # Higher for production
API_RATE_LIMIT=1000
```
