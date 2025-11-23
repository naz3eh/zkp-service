import { Router, Request, Response } from 'express';
import { ZKPService } from '../services/zkp-service';
import { proofLimiter } from '../utils/rate-limiter';
import { x402PaymentMiddleware } from '../middleware/x402-payment';

export const zkpRouter = Router();
const zkpService = new ZKPService();

/**
 * Submit a proof for verification
 */
zkpRouter.post('/submit', proofLimiter, async (req: Request, res: Response) => {
  try {
    const { proofId, proofData } = req.body;

    if (!proofId || !proofData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await zkpService.submitProof(proofId, proofData);
    res.json(result);
  } catch (error) {
    console.error('Error submitting proof:', error);
    res.status(500).json({ error: 'Failed to submit proof' });
  }
});

/**
 * Verify a submitted proof
 */
zkpRouter.post('/verify', proofLimiter, async (req: Request, res: Response) => {
  try {
    const { proofId } = req.body;

    if (!proofId) {
      return res.status(400).json({ error: 'Missing proofId' });
    }

    const result = await zkpService.verifyProof(proofId);
    res.json(result);
  } catch (error) {
    console.error('Error verifying proof:', error);
    res.status(500).json({ error: 'Failed to verify proof' });
  }
});

/**
 * Get proof status
 */
zkpRouter.get('/proof/:proofId', async (req: Request, res: Response) => {
  try {
    const { proofId } = req.params;
    const proof = await zkpService.getProof(proofId);

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    res.json(proof);
  } catch (error) {
    console.error('Error getting proof:', error);
    res.status(500).json({ error: 'Failed to get proof' });
  }
});

/**
 * Generate a ZKP using Oasis (PAID ENDPOINT - Requires x402 payment)
 */
zkpRouter.post('/generate', x402PaymentMiddleware, proofLimiter, async (req: Request, res: Response) => {
  try {
    const { data, secret } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Generate the proof
    const proof = await zkpService.generateProof(data, secret);

    // Get payment info attached by middleware
    const payment = (req as any).payment;

    console.log('🎉 Proof generated successfully');
    console.log('💰 Payment settled on Sepolia:', payment?.settlementTxHash);

    // Return proof with payment information
    res.json({
      success: true,
      proof,
      payment: {
        paymentId: payment?.paymentId,
        settlementTxHash: payment?.settlementTxHash,
        settled: payment?.settled,
        payer: payment?.payer,
        amount: payment?.amount,
        etherscanUrl: payment?.settlementTxHash
          ? `https://sepolia.etherscan.io/tx/${payment.settlementTxHash}`
          : undefined
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating proof:', error);
    res.status(500).json({ error: 'Failed to generate proof' });
  }
});
