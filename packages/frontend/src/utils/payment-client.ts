import { createWalletClient, custom, type WalletClient } from 'viem';
import { sepolia } from 'viem/chains';

export interface PaymentProof {
    signature: string;
    amount: string;
    recipient: string;
    nonce: string;
    timestamp: number;
    payer: string;
}

export interface PaymentRequirement {
    amount: string;
    recipient: string;
    currency: string;
    network: string;
}

/**
 * Custom payment client using viem for Ethereum Sepolia
 * Replaces Coinbase's x402-fetch with our own implementation
 */

/**
 * Make a payment-enabled request
 * Handles 402 responses by prompting for payment signature
 */
export async function paymentRequest<T = any>(
    url: string,
    options?: RequestInit
): Promise<T> {
    // First attempt - without payment
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    // If not 402, return response
    if (response.status !== 402) {
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    // 402 Payment Required - handle payment
    const paymentInfo = await response.json();
    console.log('💳 Payment required:', paymentInfo);

    // Create payment proof
    const paymentProof = await createPaymentProof({
        amount: paymentInfo.amount || '1000000000000000',
        recipient: paymentInfo.recipient,
        currency: paymentInfo.currency || 'ETH',
        network: paymentInfo.network || 'sepolia',
    });

    console.log('✍️ Payment signed:', paymentProof);

    // Retry request with payment
    const paidResponse = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-Payment': JSON.stringify(paymentProof),
            ...options?.headers,
        },
    });

    if (!paidResponse.ok) {
        const errorText = await paidResponse.text();
        throw new Error(`Payment request failed: ${paidResponse.status} ${errorText}`);
    }

    return paidResponse.json();
}

/**
 * Create payment proof by signing with MetaMask
 */
async function createPaymentProof(
    requirement: PaymentRequirement
): Promise<PaymentProof> {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    // Get accounts
    const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
    }) as string[];

    if (accounts.length === 0) {
        throw new Error('No MetaMask accounts found');
    }

    const payer = accounts[0];

    // Create wallet client
    const walletClient = createWalletClient({
        account: payer as `0x${string}`,
        chain: sepolia,
        transport: custom(window.ethereum!),
    });

    // Generate unique nonce
    const nonce = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = Date.now();

    // Construct message to sign
    const message = `Payment Authorization
Amount: ${requirement.amount} wei
Recipient: ${requirement.recipient}
Network: ${requirement.network}
Nonce: ${nonce}
Timestamp: ${timestamp}

By signing this message, you authorize the payment.`;

    console.log('📝 Signing message:', message);

    // Sign message with MetaMask
    const signature = await walletClient.signMessage({
        account: payer as `0x${string}`,
        message,
    });

    return {
        signature,
        amount: requirement.amount,
        recipient: requirement.recipient,
        nonce,
        timestamp,
        payer,
    };
}

/**
 * Get wallet client for current MetaMask account
 */
export async function getWalletClient(): Promise<WalletClient> {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
    }) as string[];

    return createWalletClient({
        account: accounts[0] as `0x${string}`,
        chain: sepolia,
        transport: custom(window.ethereum!),
    });
}
