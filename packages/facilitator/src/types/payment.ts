export interface PaymentProof {
    signature: string;
    amount: string;
    recipient: string;
    nonce: string;
    timestamp: number;
    payer: string;
}

export interface PaymentVerificationResult {
    valid: boolean;
    paymentId?: string;
    error?: string;
    settlementTxHash?: string;
}

export interface PaymentRecord {
    id: string;
    proof: PaymentProof;
    verified: boolean;
    settled: boolean;
    settlementTxHash?: string;
    createdAt: number;
    settledAt?: number;
}

export interface SettlementResult {
    success: boolean;
    txHash?: string;
    error?: string;
}
