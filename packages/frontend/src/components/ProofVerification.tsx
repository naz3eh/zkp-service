'use client';

import { useState } from 'react';
import { zkpApi } from '@/lib/api';

export function ProofVerification() {
  const [proofId, setProofId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await zkpApi.verifyProof(proofId);
      setResult(response);
    } catch (err) {
      setError('Failed to verify proof. Please check the proof ID and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await zkpApi.getProofStatus(proofId);
      setResult(response);
    } catch (err) {
      setError('Failed to get proof status. Proof may not exist.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Verify Proof</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Verify a submitted proof or check its status on the blockchain
      </p>

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Proof ID
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            placeholder="Enter the proof ID..."
            value={proofId}
            onChange={(e) => setProofId(e.target.value)}
            required
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || !proofId}
            className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Proof'}
          </button>

          <button
            type="button"
            onClick={handleGetStatus}
            disabled={loading || !proofId}
            className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Get Status'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 rounded-lg">
          <h3 className="font-bold mb-2">Proof Information</h3>
          <div className="text-sm space-y-1">
            {result.proofId && (
              <p><strong>Proof ID:</strong> {result.proofId?.slice(0, 20)}...</p>
            )}
            {result.proofHash && (
              <p><strong>Proof Hash:</strong> {result.proofHash?.slice(0, 20)}...</p>
            )}
            {result.verifier && (
              <p><strong>Verifier:</strong> {result.verifier}</p>
            )}
            {result.timestamp && (
              <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
            )}
            {typeof result.isVerified !== 'undefined' && (
              <p><strong>Status:</strong> {result.isVerified ? '✓ Verified' : '✗ Not Verified'}</p>
            )}
            {typeof result.verified !== 'undefined' && (
              <p><strong>Status:</strong> {result.verified ? '✓ Verified' : '✗ Not Verified'}</p>
            )}
            {result.message && (
              <p className="text-xs mt-2 text-blue-600 dark:text-blue-300">
                {result.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
