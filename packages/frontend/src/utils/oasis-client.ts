/**
 * Oasis Service Client
 * Utilities for interacting with the deployed Oasis ROFL service
 */

const OASIS_SERVICE_URL = import.meta.env.VITE_OASIS_SERVICE_URL || 'https://p3000.m1132.opf-testnet-rofl-25.rofl.app';

export interface OasisPublicKeyResponse {
    public_key: string;
}

/**
 * Fetch the public key from the Oasis service
 */
export async function fetchOasisPublicKey(): Promise<string> {
    try {
        const response = await fetch(`${OASIS_SERVICE_URL}/public-key`);

        if (!response.ok) {
            throw new Error(`Failed to fetch public key: ${response.status} ${response.statusText}`);
        }

        const data: OasisPublicKeyResponse = await response.json();
        return data.public_key;
    } catch (error: any) {
        console.error('Error fetching Oasis public key:', error);
        throw new Error(`Could not fetch Oasis public key: ${error.message}`);
    }
}

/**
 * Check if Oasis service is available
 */
export async function checkOasisServiceHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${OASIS_SERVICE_URL}/public-key`, {
            method: 'HEAD',
        });
        return response.ok;
    } catch {
        return false;
    }
}
