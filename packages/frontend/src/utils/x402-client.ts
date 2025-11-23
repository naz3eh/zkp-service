import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, custom } from 'viem';
import { sepolia } from 'viem/chains';

/**
 * Create x402-enabled fetch client that handles 402 Payment Required responses
 * and automatically makes payments via MetaMask
 */
export async function createX402Client() {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    // Get accounts from MetaMask
    const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
    }) as string[];

    if (accounts.length === 0) {
        throw new Error('No MetaMask accounts found');
    }

    // Create wallet client for x402
    const walletClient = createWalletClient({
        account: accounts[0] as `0x${string}`,
        chain: sepolia,
        transport: custom(window.ethereum!),
    });

    // Wrap fetch with payment handling
    // maxValue is in wei - default to 0.001 ETH (1000000000000000 wei)
    const maxPaymentInWei = BigInt(import.meta.env.VITE_X402_MAX_PAYMENT || '1000000000000000');

    // Type assertion: viem's WalletClient is compatible with x402-fetch's Signer interface
    // but TypeScript needs explicit cast
    const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        walletClient as any, // Type assertion for viem WalletClient compatibility
        maxPaymentInWei
    );

    return fetchWithPayment;
}

/**
 * Make a payment-enabled API request
 * This will automatically handle 402 responses and make payments via MetaMask
 */
export async function x402Request<T = any>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const fetchWithPayment = await createX402Client();

    const response = await fetchWithPayment(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} ${errorText}`);
    }

    return response.json();
}

/**
 * Utility to check if a response requires payment
 */
export function requiresPayment(response: Response): boolean {
    return response.status === 402;
}
