import { useState, useEffect, useCallback } from 'react';
import { createWalletClient, custom, type WalletClient } from 'viem';
import { sepolia } from 'viem/chains';

export interface WalletState {
    isConnected: boolean;
    isConnecting: boolean;
    address: string | null;
    chainId: number | null;
    error: string | null;
    walletClient: WalletClient | null;
}

export function useWallet() {
    const [walletState, setWalletState] = useState<WalletState>({
        isConnected: false,
        isConnecting: false,
        address: null,
        chainId: null,
        error: null,
        walletClient: null,
    });

    // Check if MetaMask is installed
    const isMetaMaskInstalled = useCallback(() => {
        return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    }, []);

    // Connect to MetaMask
    const connect = useCallback(async () => {
        if (!isMetaMaskInstalled()) {
            setWalletState(prev => ({
                ...prev,
                error: 'MetaMask is not installed. Please install MetaMask to continue.',
            }));
            return;
        }

        setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            // Request account access
            const accounts = await window.ethereum!.request({
                method: 'eth_requestAccounts',
            }) as string[];

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            // Get current chain ID
            const chainId = await window.ethereum!.request({
                method: 'eth_chainId',
            }) as string;

            const chainIdNumber = parseInt(chainId, 16);

            // Create wallet client
            const walletClient = createWalletClient({
                account: accounts[0] as `0x${string}`,
                chain: sepolia,
                transport: custom(window.ethereum!),
            });

            setWalletState({
                isConnected: true,
                isConnecting: false,
                address: accounts[0],
                chainId: chainIdNumber,
                error: null,
                walletClient,
            });

            // Switch to Sepolia if not already on it
            if (chainIdNumber !== sepolia.id) {
                await switchToSepolia();
            }
        } catch (error: any) {
            console.error('Failed to connect wallet:', error);
            setWalletState(prev => ({
                ...prev,
                isConnecting: false,
                error: error.message || 'Failed to connect wallet',
            }));
        }
    }, [isMetaMaskInstalled]);

    // Disconnect wallet
    const disconnect = useCallback(() => {
        setWalletState({
            isConnected: false,
            isConnecting: false,
            address: null,
            chainId: null,
            error: null,
            walletClient: null,
        });
    }, []);

    // Switch to Sepolia network
    const switchToSepolia = useCallback(async () => {
        if (!isMetaMaskInstalled()) {
            return;
        }

        try {
            await window.ethereum!.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${sepolia.id.toString(16)}` }],
            });
        } catch (error: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (error.code === 4902) {
                try {
                    await window.ethereum!.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: `0x${sepolia.id.toString(16)}`,
                                chainName: sepolia.name,
                                nativeCurrency: sepolia.nativeCurrency,
                                rpcUrls: sepolia.rpcUrls.default.http,
                                blockExplorerUrls: [sepolia.blockExplorers.default.url],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error('Failed to add Sepolia network:', addError);
                    throw addError;
                }
            } else {
                console.error('Failed to switch to Sepolia:', error);
                throw error;
            }
        }
    }, [isMetaMaskInstalled]);

    // Listen for account changes
    useEffect(() => {
        if (!isMetaMaskInstalled()) {
            return;
        }

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else {
                setWalletState(prev => ({
                    ...prev,
                    address: accounts[0],
                }));
            }
        };

        const handleChainChanged = (chainId: string) => {
            const chainIdNumber = parseInt(chainId, 16);
            setWalletState(prev => ({
                ...prev,
                chainId: chainIdNumber,
            }));

            // Reload page when chain changes (recommended by MetaMask)
            window.location.reload();
        };

        window.ethereum!.on('accountsChanged', handleAccountsChanged);
        window.ethereum!.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum!.removeListener('chainChanged', handleChainChanged);
        };
    }, [isMetaMaskInstalled, disconnect]);

    return {
        ...walletState,
        connect,
        disconnect,
        switchToSepolia,
        isMetaMaskInstalled: isMetaMaskInstalled(),
    };
}
