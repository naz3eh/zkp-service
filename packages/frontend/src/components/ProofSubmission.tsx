import { useState, FormEvent } from 'react'
import { zkpApi } from '../lib/api'
import { truncateHash, formatTimestamp } from '../lib/utils'

export function ProofSubmission() {
  const [proofId, setProofId] = useState('')
  const [proofData, setProofData] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = JSON.parse(proofData)
      const response = await zkpApi.submitProof(proofId, data)
      setResult(response)
    } catch (err) {
      setError('Failed to submit proof. Please check your input and try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Submit Proof to Blockchain
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Submit your zero-knowledge proof to the smart contract
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Proof ID
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            placeholder="Enter a unique identifier for your proof..."
            value={proofId}
            onChange={(e) => setProofId(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Proof Data (JSON)
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
            rows={6}
            placeholder='{"proof": "...", "publicInputs": [...]}'
            value={proofData}
            onChange={(e) => setProofData(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        >
          {loading ? 'Submitting...' : 'Submit Proof'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-bold mb-2">Proof Submitted Successfully!</h3>
          <div className="text-sm space-y-1 font-mono">
            <p><strong>Proof ID:</strong> {truncateHash(result.proofId)}</p>
            <p><strong>Proof Hash:</strong> {truncateHash(result.proofHash)}</p>
            <p><strong>Timestamp:</strong> {formatTimestamp(result.timestamp)}</p>
            <p className="text-xs mt-2 text-green-600 dark:text-green-400">
              {result.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
