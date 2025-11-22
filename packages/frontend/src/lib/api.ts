import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/zkp`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const zkpApi = {
  /**
   * Submit a proof to the blockchain
   */
  async submitProof(proofId: string, proofData: any) {
    const response = await api.post('/submit', { proofId, proofData });
    return response.data;
  },

  /**
   * Verify a proof on the blockchain
   */
  async verifyProof(proofId: string) {
    const response = await api.post('/verify', { proofId });
    return response.data;
  },

  /**
   * Get proof status from the blockchain
   */
  async getProofStatus(proofId: string) {
    const response = await api.get(`/proof/${proofId}`);
    return response.data;
  },

  /**
   * Generate a new ZKP using Oasis
   */
  async generateProof(data: string, secret?: string) {
    const response = await api.post('/generate', { data, secret });
    return response.data;
  },
};
