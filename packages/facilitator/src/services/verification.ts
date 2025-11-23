import { ethers } from 'ethers';
import type { PaymentProof } from '../types/payment.js';

export class PaymentVerificationService {
    private maxPaymentAmount: bigint;

    constructor(maxPaymentAmount?: string) {
        this.maxPaymentAmount = BigInt(maxPaymentAmount || '10000000000000000'); // 0.01 ETH default
    }

    /**
     * Verify payment signature and amount
     */
    async verifyPayment(
        paymentProof: PaymentProof,
        requiredAmount: string,
        requiredRecipient: string
    ): Promise<{ valid: boolean; error?: string }> {
        try {
            // 1. Validate payment amount
            const proofAmount = BigInt(paymentProof.amount);
            const required = BigInt(requiredAmount);

            if (proofAmount < required) {
                return {
                    valid: false,
                    error: `Insufficient payment: ${paymentProof.amount} < ${requiredAmount}`,
                };
            }

            if (proofAmount > this.maxPaymentAmount) {
                return {
                    valid: false,
                    error: `Payment exceeds maximum: ${paymentProof.amount} > ${this.maxPaymentAmount}`,
                };
            }

            // 2. Validate recipient matches
            if (paymentProof.recipient.toLowerCase() !== requiredRecipient.toLowerCase()) {
                return {
                    valid: false,
                    error: `Recipient mismatch: ${paymentProof.recipient} != ${requiredRecipient}`,
                };
            }

            // 3. Check timestamp (not too old - within 5 minutes)
            const now = Date.now();
            const age = now - paymentProof.timestamp;
            if (age > 5 * 60 * 1000) {
                return {
                    valid: false,
                    error: `Payment proof expired (age: ${Math.floor(age / 1000)}s)`,
                };
            }

            // 4. Verify signature
            const message = this.constructPaymentMessage(paymentProof);
            const recoveredAddress = ethers.verifyMessage(message, paymentProof.signature);

            if (recoveredAddress.toLowerCase() !== paymentProof.payer.toLowerCase()) {
                return {
                    valid: false,
                    error: `Invalid signature: recovered ${recoveredAddress}, expected ${paymentProof.payer}`,
                };
            }

            return { valid: true };
        } catch (error: any) {
            return {
                valid: false,
                error: `Verification error: ${error.message}`,
            };
        }
    }

    /**
     * Construct the message that was signed
     * Must match the format in payment-client.ts
     */
    private constructPaymentMessage(proof: PaymentProof): string {
        return `Payment Authorization
Amount: ${proof.amount} wei
Recipient: ${proof.recipient}
Network: sepolia
Nonce: ${proof.nonce}
Timestamp: ${proof.timestamp}

By signing this message, you authorize the payment.`;
    }

    /**
     * Generate a unique payment ID
     */
    generatePaymentId(proof: PaymentProof): string {
        const data = `${proof.payer}-${proof.nonce}-${proof.timestamp}`;
        return ethers.keccak256(ethers.toUtf8Bytes(data));
    }
}
