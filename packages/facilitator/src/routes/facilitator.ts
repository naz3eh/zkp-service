import { Router, Request, Response } from 'express';
import { PaymentVerificationService } from '../services/verification.js';
import { SettlementService } from '../services/settlement.js';
import { PaymentStorageService } from '../services/storage.js';
import type { PaymentProof } from '../types/payment.js';

export function createFacilitatorRoutes(
    verificationService: PaymentVerificationService,
    settlementService: SettlementService,
    storageService: PaymentStorageService,
    autoSettle: boolean
) {
    const router = Router();

    /**
     * POST /api/facilitator/verify
     * Verify a payment proof and optionally settle it
     */
    router.post('/verify', async (req: Request, res: Response) => {
        try {
            const { paymentProof, requiredAmount, requiredRecipient } = req.body;

            if (!paymentProof || !requiredAmount || !requiredRecipient) {
                return res.status(400).json({
                    error: 'Missing required fields: paymentProof, requiredAmount, requiredRecipient',
                });
            }

            const proof: PaymentProof = paymentProof;

            // Generate payment ID
            const paymentId = verificationService.generatePaymentId(proof);

            // Check for double-spend
            if (storageService.hasNonceBeenUsed(proof.payer, proof.nonce)) {
                return res.status(400).json({
                    valid: false,
                    error: 'Payment nonce already used (possible double-spend)',
                });
            }

            // Verify payment
            const verificationResult = await verificationService.verifyPayment(
                proof,
                requiredAmount,
                requiredRecipient
            );

            if (!verificationResult.valid) {
                return res.status(402).json({
                    valid: false,
                    error: verificationResult.error,
                });
            }

            // Store payment
            storageService.storePayment(paymentId, proof, true);

            // Auto-settle if enabled
            let settlementTxHash: string | undefined;
            if (autoSettle) {
                const settlementResult = await settlementService.settlePayment(proof);
                if (settlementResult.success && settlementResult.txHash) {
                    settlementTxHash = settlementResult.txHash;
                    storageService.markAsSettled(paymentId, settlementResult.txHash);
                } else {
                    console.error('[Facilitator] Settlement failed:', settlementResult.error);
                }
            }

            res.json({
                valid: true,
                paymentId,
                settlementTxHash,
                settled: !!settlementTxHash,
            });
        } catch (error: any) {
            console.error('[Facilitator] Verification error:', error);
            res.status(500).json({
                valid: false,
                error: 'Internal server error',
            });
        }
    });

    /**
     * POST /api/facilitator/settle
     * Manually settle a verified payment
     */
    router.post('/settle', async (req: Request, res: Response) => {
        try {
            const { paymentId } = req.body;

            if (!paymentId) {
                return res.status(400).json({ error: 'Missing paymentId' });
            }

            const payment = storageService.getPayment(paymentId);
            if (!payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            if (payment.settled) {
                return res.json({
                    success: true,
                    txHash: payment.settlementTxHash,
                    message: 'Already settled',
                });
            }

            if (!payment.verified) {
                return res.status(400).json({ error: 'Payment not verified' });
            }

            const settlementResult = await settlementService.settlePayment(payment.proof);

            if (settlementResult.success && settlementResult.txHash) {
                storageService.markAsSettled(paymentId, settlementResult.txHash);
                res.json({
                    success: true,
                    txHash: settlementResult.txHash,
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: settlementResult.error,
                });
            }
        } catch (error: any) {
            console.error('[Facilitator] Settlement error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
            });
        }
    });

    /**
     * GET /api/facilitator/payment/:paymentId
     * Get payment status
     */
    router.get('/payment/:paymentId', (req: Request, res: Response) => {
        const { paymentId } = req.params;

        const payment = storageService.getPayment(paymentId);
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({
            paymentId: payment.id,
            verified: payment.verified,
            settled: payment.settled,
            settlementTxHash: payment.settlementTxHash,
            amount: payment.proof.amount,
            payer: payment.proof.payer,
            recipient: payment.proof.recipient,
            createdAt: payment.createdAt,
            settledAt: payment.settledAt,
        });
    });

    /**
     * GET /api/facilitator/payments
     * List all payments (admin endpoint)
     */
    router.get('/payments', (req: Request, res: Response) => {
        const payments = storageService.getAllPayments();
        res.json({
            total: payments.length,
            payments: payments.map((p) => ({
                paymentId: p.id,
                verified: p.verified,
                settled: p.settled,
                amount: p.proof.amount,
                payer: p.proof.payer,
                recipient: p.proof.recipient,
                createdAt: p.createdAt,
                settledAt: p.settledAt,
            })),
        });
    });

    /**
     * GET /api/facilitator/status
     * Get facilitator status
     */
    router.get('/status', async (req: Request, res: Response) => {
        try {
            const balance = await settlementService.getBalance();
            const address = settlementService.getAddress();
            const payments = storageService.getAllPayments();

            res.json({
                facilitatorAddress: address,
                balance: `${balance} ETH`,
                totalPayments: payments.length,
                settledPayments: payments.filter((p) => p.settled).length,
                pendingPayments: payments.filter((p) => !p.settled).length,
                autoSettle,
            });
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to get status' });
        }
    });

    return router;
}
