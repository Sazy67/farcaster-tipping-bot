'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';

interface TransactionDetailProps {
  transactionId: string;
  onClose?: () => void;
  className?: string;
}

export function TransactionDetail({ transactionId, onClose, className = '' }: TransactionDetailProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/transactions/${transactionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transaction details');
        }
        
        const data = await response.json();
        setTransaction(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(6);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error loading transaction: {error}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p>Transaction not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Status */}
        <div className="flex items-center justify-center">
          <div className={`px-4 py-2 rounded-full border ${getStatusColor(transaction.status)}`}>
            <span className="text-2xl mr-2">{getStatusIcon(transaction.status)}</span>
            <span className="font-semibold capitalize">{transaction.status}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatAmount(transaction.amount)} ETH
          </div>
          <div className="text-sm text-gray-500">
            Recipient receives: {formatAmount(transaction.recipientAmount)} ETH
          </div>
          <div className="text-sm text-gray-500">
            Platform fee: {formatAmount(transaction.platformFee)} ETH
          </div>
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">From</div>
            <div className="font-mono text-blue-600">user {transaction.senderFid}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">To</div>
            <div className="font-mono text-blue-600">user {transaction.recipientFid}</div>
          </div>
        </div>

        {/* Transaction Hash */}
        {transaction.txHash && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 mb-2">Transaction Hash</div>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 break-all">
                {transaction.txHash}
              </code>
              <a
                href={`https://basescan.org/tx/${transaction.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                View on Explorer
              </a>
            </div>
          </div>
        )}

        {/* Fee Transaction Hash */}
        {transaction.feeTxHash && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 mb-2">Fee Transaction Hash</div>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-800 break-all">
                {transaction.feeTxHash}
              </code>
              <a
                href={`https://basescan.org/tx/${transaction.feeTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
              >
                View on Explorer
              </a>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-500 mb-1">Created</div>
            <div className="text-sm text-gray-800">{formatDate(transaction.createdAt.toString())}</div>
          </div>
          {transaction.confirmedAt && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Confirmed</div>
              <div className="text-sm text-gray-800">{formatDate(transaction.confirmedAt.toString())}</div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm font-medium text-blue-800 mb-2">Transaction Info</div>
          <div className="text-sm text-blue-700 space-y-1">
            <div>ID: {transaction.id}</div>
            <div>Token: {transaction.token}</div>

          </div>
        </div>
      </div>
    </div>
  );
}