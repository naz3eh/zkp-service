import { createWalletClient, custom, parseEther } from 'viem';
import { sepolia } from 'viem/chains';

export interface DirectPaymentResult {
    txHash: string;
    from: string;
    to: string;
    amount: string;
    etherscanUrl: string;
}

/**
 * Send ETH payment directly via MetaMask (no backend verification)
 */
export async function sendDirectPayment(
    recipientAddress: string,
    amountInEth: string = '0.001'
): Promise<DirectPaymentResult> {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    // Request account access
    const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
    }) as string[];

    if (accounts.length === 0) {
        throw new Error('No MetaMask accounts found');
    }

    const from = accounts[0];

    // Create wallet client
    const walletClient = createWalletClient({
        account: from as `0x${string}`,
        chain: sepolia,
        transport: custom(window.ethereum!),
    });

    // Send transaction
    console.log(`💸 Sending ${amountInEth} ETH to ${recipientAddress}...`);

    const hash = await walletClient.sendTransaction({
        account: from as `0x${string}`,
        to: recipientAddress as `0x${string}`,
        value: parseEther(amountInEth),
    });

    console.log('✅ Transaction sent:', hash);

    return {
        txHash: hash,
        from,
        to: recipientAddress,
        amount: amountInEth,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${hash}`,
    };
}
