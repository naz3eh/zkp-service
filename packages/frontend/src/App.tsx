import { useState } from 'react'
import { ProofGeneration } from './components/ProofGeneration'
import { ProofSubmission } from './components/ProofSubmission'
import { ProofVerification } from './components/ProofVerification'

type TabType = 'generate' | 'submit' | 'verify'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('generate')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto p-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ZKP Service
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Zero-Knowledge Proof as a Service
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Powered by Oasis Sapphire, EVVM, and Hardhat
          </p>
        </header>

        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-300 dark:border-gray-700">
            <button
              className={`px-6 py-3 font-medium transition-all rounded-t-lg ${
                activeTab === 'generate'
                  ? 'bg-white dark:bg-gray-800 border-b-2 border-primary text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('generate')}
            >
              Generate Proof
            </button>
            <button
              className={`px-6 py-3 font-medium transition-all rounded-t-lg ${
                activeTab === 'submit'
                  ? 'bg-white dark:bg-gray-800 border-b-2 border-primary text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('submit')}
            >
              Submit Proof
            </button>
            <button
              className={`px-6 py-3 font-medium transition-all rounded-t-lg ${
                activeTab === 'verify'
                  ? 'bg-white dark:bg-gray-800 border-b-2 border-primary text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab('verify')}
            >
              Verify Proof
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {activeTab === 'generate' && <ProofGeneration />}
          {activeTab === 'submit' && <ProofSubmission />}
          {activeTab === 'verify' && <ProofVerification />}
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500">
          <div className="flex justify-center gap-8 mb-4">
            <a
              href="https://hardhat.org/docs/hardhat3/whats-new"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Hardhat 3 Docs
            </a>
            <a
              href="https://www.evvm.info/docs/intro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              EVVM Docs
            </a>
            <a
              href="https://docs.oasis.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Oasis Docs
            </a>
          </div>
          <p>© 2024 ZKP Service. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default App
