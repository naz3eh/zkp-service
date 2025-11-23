import type { PaymentRecord, PaymentProof } from '../types/payment.js';

export class PaymentStorageService {
    private payments: Map<string, PaymentRecord>;
    private payerNonces: Map<string, Set<string>>;

    constructor() {
        this.payments = new Map();
        this.payerNonces = new Map();
    }

    /**
     * Store a payment record
     */
    storePayment(paymentId: string, proof: PaymentProof, verified: boolean): void {
        const record: PaymentRecord = {
            id: paymentId,
            proof,
            verified,
            settled: false,
            createdAt: Date.now(),
        };

        this.payments.set(paymentId, record);

        // Track nonce for double-spend prevention
        if (!this.payerNonces.has(proof.payer)) {
            this.payerNonces.set(proof.payer, new Set());
        }
        this.payerNonces.get(proof.payer)!.add(proof.nonce);

        console.log(`[Storage] Stored payment ${paymentId} from ${proof.payer}`);
    }

    /**
     * Update payment settlement status
     */
    markAsSettled(paymentId: string, txHash: string): void {
        const payment = this.payments.get(paymentId);
        if (payment) {
            payment.settled = true;
            payment.settlementTxHash = txHash;
            payment.settledAt = Date.now();
            this.payments.set(paymentId, payment);
            console.log(`[Storage] Marked payment ${paymentId} as settled: ${txHash}`);
        }
    }

    /**
     * Get payment record
     */
    getPayment(paymentId: string): PaymentRecord | undefined {
        return this.payments.get(paymentId);
    }

    /**
     * Check if nonce has been used by payer (prevent double-spend)
     */
    hasNonceBeenUsed(payer: string, nonce: string): boolean {
        return this.payerNonces.get(payer)?.has(nonce) || false;
    }

    /**
     * Get all payments
     */
    getAllPayments(): PaymentRecord[] {
        return Array.from(this.payments.values());
    }

    /**
     * Get payments by payer
     */
    getPaymentsByPayer(payer: string): PaymentRecord[] {
        return Array.from(this.payments.values()).filter(
            (p) => p.proof.payer.toLowerCase() === payer.toLowerCase()
        );
    }

    /**
     * Clean up old payments (older than 24 hours)
     */
    cleanup(): void {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        let cleanedCount = 0;

        for (const [id, payment] of this.payments.entries()) {
            if (payment.createdAt < oneDayAgo && payment.settled) {
                this.payments.delete(id);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`[Storage] Cleaned up ${cleanedCount} old payments`);
        }
    }
}
