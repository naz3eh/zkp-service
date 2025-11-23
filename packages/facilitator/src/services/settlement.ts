import { ethers } from 'ethers';
import type { PaymentProof, SettlementResult } from '../types/payment.js';

export class SettlementService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private minConfirmations: number;

    constructor(rpcUrl: string, privateKey: string, minConfirmations: number = 1) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.minConfirmations = minConfirmations;
    }

    /**
     * Settle payment on blockchain
     */
    async settlePayment(paymentProof: PaymentProof): Promise<SettlementResult> {
        try {
            console.log(`[Settlement] Settling payment from ${paymentProof.payer} to ${paymentProof.recipient}`);
            console.log(`[Settlement] Amount: ${ethers.formatEther(paymentProof.amount)} ETH`);

            // Create transaction
            const tx = await this.wallet.sendTransaction({
                to: paymentProof.recipient,
                value: paymentProof.amount,
                // Add some metadata in the transaction data field
                data: ethers.hexlify(ethers.toUtf8Bytes(`x402:${paymentProof.nonce}`)),
            });

            console.log(`[Settlement] Transaction sent: ${tx.hash}`);

            // Wait for confirmations
            const receipt = await tx.wait(this.minConfirmations);

            if (!receipt) {
                return {
                    success: false,
                    error: 'Transaction receipt not found',
                };
            }

            if (receipt.status === 0) {
                return {
                    success: false,
                    error: 'Transaction failed on-chain',
                };
            }

            console.log(`[Settlement] Transaction confirmed in block ${receipt.blockNumber}`);

            return {
                success: true,
                txHash: tx.hash,
            };
        } catch (error: any) {
            console.error('[Settlement] Error:', error);
            return {
                success: false,
                error: error.message || 'Settlement failed',
            };
        }
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(txHash: string): Promise<{
        confirmed: boolean;
        blockNumber?: number;
        status?: number;
    }> {
        try {
            const receipt = await this.provider.getTransactionReceipt(txHash);

            if (!receipt) {
                return { confirmed: false };
            }

            return {
                confirmed: true,
                blockNumber: receipt.blockNumber ?? undefined,
                status: receipt.status ?? undefined,
            };
        } catch (error) {
            return { confirmed: false };
        }
    }

    /**
     * Get facilitator wallet balance
     */
    async getBalance(): Promise<string> {
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers.formatEther(balance);
    }

    /**
     * Get facilitator wallet address
     */
    getAddress(): string {
        return this.wallet.address;
    }
}
