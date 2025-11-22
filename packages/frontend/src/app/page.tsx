'use client';

import { useState } from 'react';
import { ProofSubmission } from '@/components/ProofSubmission';
import { ProofVerification } from '@/components/ProofVerification';
import { ProofGeneration } from '@/components/ProofGeneration';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'submit' | 'verify' | 'generate'>('generate');

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">ZKP Service</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Zero-Knowledge Proof as a Service
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Powered by Oasis Sapphire, EVVM, and Hardhat
          </p>
        </header>

        <div className="mb-6">
          <div className="flex gap-4 border-b border-gray-300 dark:border-gray-700">
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
              onClick={() => setActiveTab('generate')}
            >
              Generate Proof
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'submit'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
              onClick={() => setActiveTab('submit')}
            >
              Submit Proof
            </button>
            <button
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'verify'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
              onClick={() => setActiveTab('verify')}
            >
              Verify Proof
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
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
    </main>
  );
}
