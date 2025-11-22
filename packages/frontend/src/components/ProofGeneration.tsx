import { useState, FormEvent } from 'react'
import { zkpApi } from '../lib/api'

export function ProofGeneration() {
  const [data, setData] = useState('')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await zkpApi.generateProof(data, secret)
      setResult(response)
    } catch (err) {
      setError('Failed to generate proof. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Generate Zero-Knowledge Proof
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Generate a ZKP using Oasis Sapphire for privacy-preserving computation
      </p>

      <form onSubmit={handleGenerate} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Data to Prove
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            rows={4}
            placeholder="Enter the data you want to prove knowledge of..."
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Secret (Optional)
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            placeholder="Enter a secret value..."
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        >
          {loading ? 'Generating...' : 'Generate Proof'}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-bold mb-2">Proof Generated Successfully!</h3>
          <div className="text-sm space-y-1 font-mono">
            <p><strong>Proof ID:</strong> {result.proofId}</p>
            <p><strong>Data Hash:</strong> {result.dataHash?.slice(0, 20)}...</p>
            <p><strong>Commitment:</strong> {result.commitment?.slice(0, 20)}...</p>
            <p className="text-xs mt-2 text-green-600 dark:text-green-400">
              {result.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
