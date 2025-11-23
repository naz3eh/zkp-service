# Quick Backend Integration for x402 Payments

Your Oasis backend needs to add x402 payment middleware to make the full flow work.

## What Your Backend Needs (Tell Your Teammate)

Add this to your Oasis backend at `/api/zkp/generate`:

```typescript
app.post('/api/zkp/generate', async (req, res) => {
  const paymentHeader = req.headers['x-payment'];
  
  // 1. If no payment, return 402 Payment Required
  if (!paymentHeader) {
    return res.status(402).json({
      error: 'Payment Required',
      amount: '1000000000000000', // 0.001 ETH in wei
      recipient: '0xYOUR_MERCHANT_ADDRESS', // Where to receive payment
      currency: 'ETH',
      network: 'sepolia'
    });
  }

  // 2. Verify payment with facilitator
  try {
    const facilitatorUrl = 'YOUR_FACILITATOR_URL'; // Or http://localhost:3002 for local
    const verification = await fetch(`${facilitatorUrl}/api/facilitator/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentProof: JSON.parse(paymentHeader),
        requiredAmount: '1000000000000000',
        requiredRecipient: '0xYOUR_MERCHANT_ADDRESS'
      })
    });

    const result = await verification.json();

    if (!result.valid) {
      return res.status(402).json({ 
        error: 'Invalid payment',
        details: result.error 
      });
    }

    // 3. Payment verified and settled! Process the request
    console.log('Payment verified:', result.paymentId);
    console.log('Settlement TX:', result.settlementTxHash);

    // Your ZKP generation logic here
    const zkpResult = await generateZKP(req.body);

    // 4. Return results with payment info
    res.json({
      success: true,
      data: zkpResult,
      payment: {
        paymentId: result.paymentId,
        settlementTxHash: result.settlementTxHash, // Sepolia transaction
        settled: result.settled
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Payment verification failed' });
  }
});
```

## Start the Facilitator (Settlement Service)

The facilitator handles EVM settlement. Run it locally:

```bash
cd packages/facilitator

# Create and configure .env
cp .env.example .env

# Edit .env with:
# - FACILITATOR_PRIVATE_KEY: A wallet private key (needs Sepolia ETH for gas)
# - MERCHANT_RECEIVER_ADDRESS: Where payments should go
# - AUTO_SETTLE=true

# Start the facilitator
npm run dev
```

It will run on http://localhost:3002

## Deploy Facilitator (For Production)

Your Oasis backend needs to call a deployed facilitator. You can:
- Deploy facilitator to same infrastructure as Oasis backend
- Use the local facilitator URL if testing locally

## Frontend is Ready

The frontend already has:
✅ x402-fetch configured
✅ MetaMask integration
✅ Wallet connection
✅ Payment signing logic

Once your backend implements the above, the flow will be:
1. User submits form → Backend returns 402
2. x402-fetch prompts MetaMask → User signs payment
3. Request retried with payment → Backend calls facilitator
4. Facilitator verifies + settles on Sepolia → Returns tx hash
5. Backend returns results → Frontend displays success + Etherscan link

## Test Flow

1. Start facilitator: `npm run facilitator:dev`
2. Update Oasis backend with x402 logic above
3. Test from frontend
4. Check Sepolia Etherscan for settlement transaction
