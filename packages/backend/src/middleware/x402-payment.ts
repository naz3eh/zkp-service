import { Request, Response, NextFunction } from 'express';

const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://zkp-service-facilitator.vercel.app';
const PAYMENT_AMOUNT = process.env.PAYMENT_AMOUNT || '1000000000000000'; // 0.001 ETH
const MERCHANT_ADDRESS = process.env.MERCHANT_RECEIVER_ADDRESS || '0x0c12522fcda861460bf1bc223eca108144ee5df4';

// Validate required environment variables
if (!MERCHANT_ADDRESS) {
    console.error('❌ ERROR: MERCHANT_RECEIVER_ADDRESS environment variable is not set!');
    console.error('Please set it in your .env file to receive payments.');
} else {
    console.log('💰 x402 Payment Middleware Configuration:');
    console.log(`   Facilitator URL: ${FACILITATOR_URL}`);
    console.log(`   Payment Amount: ${PAYMENT_AMOUNT} wei (${parseFloat(PAYMENT_AMOUNT) / 1e18} ETH)`);
    console.log(`   Merchant Address: ${MERCHANT_ADDRESS}`);
}

export interface PaymentProof {
    signature: string;
    amount: string;
    recipient: string;
    nonce: string;
    timestamp: number;
    payer: string;
}

/**
 * x402 Payment Middleware
 * Returns 402 Payment Required if no payment header
 * Verifies payment with facilitator if payment header present
 */
export async function x402PaymentMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Check if merchant address is configured
    if (!MERCHANT_ADDRESS) {
        console.error('❌ x402 middleware error: MERCHANT_RECEIVER_ADDRESS not configured');
        return res.status(500).json({
            error: 'Payment system misconfigured',
            message: 'Merchant address not set. Please contact the service administrator.'
        });
    }

    const paymentHeader = req.headers['x-payment'] as string;

    // No payment provided - return 402 Payment Required
    if (!paymentHeader) {
        return res.status(402).json({
            error: 'Payment Required',
            amount: PAYMENT_AMOUNT,
            recipient: MERCHANT_ADDRESS,
            currency: 'ETH',
            network: 'sepolia',
            message: 'This endpoint requires payment to access'
        });
    }

    try {
        // Parse payment proof
        const paymentProof: PaymentProof = JSON.parse(paymentHeader);

        console.log('💳 Payment received from:', paymentProof.payer);
        console.log('📝 Verifying with facilitator...');

        const requestBody = {
            paymentProof: paymentProof,
            requiredAmount: PAYMENT_AMOUNT,
            requiredRecipient: MERCHANT_ADDRESS,
        };
        console.log('🔍 Sending to facilitator:', JSON.stringify(requestBody, null, 2));

        // Verify payment with facilitator
        const verificationResponse = await fetch(`${FACILITATOR_URL}/api/facilitator/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const verificationResult: any = await verificationResponse.json();

        if (!verificationResult.valid) {
            console.error('❌ Payment verification failed:', verificationResult.error);
            return res.status(402).json({
                error: 'Invalid payment',
                details: verificationResult.error,
                message: 'Payment verification failed'
            });
        }

        // Payment verified! Add payment info to request
        (req as any).payment = {
            paymentId: verificationResult.paymentId,
            settlementTxHash: verificationResult.settlementTxHash,
            settled: verificationResult.settled,
            payer: paymentProof.payer,
            amount: paymentProof.amount,
        };

        console.log('✅ Payment verified:', verificationResult.paymentId);
        console.log('📝 Settlement TX:', verificationResult.settlementTxHash);

        // Continue to route handler
        next();
    } catch (error: any) {
        console.error('❌ Payment verification error:', error);
        return res.status(500).json({
            error: 'Payment verification failed',
            message: error.message || 'Internal server error',
        });
    }
}
