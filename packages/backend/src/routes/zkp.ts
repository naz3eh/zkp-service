import { Router, Request, Response } from 'express';
import { ZKPService } from '../services/zkp-service';
import { proofLimiter } from '../utils/rate-limiter';

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
 * Generate a ZKP - DEMO version (no payment required)
 * Returns dummy data for testing
 */
zkpRouter.post('/generate', proofLimiter, async (req: Request, res: Response) => {
  try {
    const { data, x, y, publicKey, githubRepo } = req.body;

    console.log('📝 ZKP generation request received');
    console.log('Data:', { x, y, publicKey, githubRepo });

    // Return dummy success data
    res.json({
      success: true,
      proof: {
        proofId: `proof_${Date.now()}`,
        status: 'verified',
        generatedAt: new Date().toISOString(),
        type: 'zkp-oasis',
      },
      data: {
        coordinates: `(${x}, ${y})`,
        publicKey,
        repository: githubRepo,
      },
      message: 'ZKP generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating proof:', error);
    res.status(500).json({ error: 'Failed to generate proof' });
  }
});
