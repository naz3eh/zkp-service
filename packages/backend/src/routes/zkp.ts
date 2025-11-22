import { Router, Request, Response } from 'express';
import { ZKPService } from '../services/zkp-service';

export const zkpRouter = Router();
const zkpService = new ZKPService();

/**
 * Submit a proof for verification
 */
zkpRouter.post('/submit', async (req: Request, res: Response) => {
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
zkpRouter.post('/verify', async (req: Request, res: Response) => {
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
 * Generate a ZKP using Oasis
 */
zkpRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const { data, secret } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const proof = await zkpService.generateProof(data, secret);
    res.json(proof);
  } catch (error) {
    console.error('Error generating proof:', error);
    res.status(500).json({ error: 'Failed to generate proof' });
  }
});
