'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';

interface TransactionHistoryProps {
  userFid: string;
  className?: string;
}

interface TransactionWithDirection extends Transaction {
  direction: 'sent' | 'received';
  counterparty: string;
}

export function TransactionHistory({ userFid, className = '' }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<TransactionWithDirection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (reset = false) => {
    try {
      setLoading(true);
      const offset = reset ? 0 : page * 20;
      
      const response = await fetch(
        `/api/transactions/history?userFid=${userFid}&limit=20&offset=${offset}&type=${filter}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      
      if (reset) {
        setTransactions(data.transactions);
        setPage(0);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      
      setHasMore(data.pagination.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(true);
  }, [userFid, filter]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchTransactions(false);
    }
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(4);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>Error loading transactions: {error}</p>
          <button
            onClick={() => fetchTransactions(true)}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
        
        <div className="flex space-x-2">
          {(['all', 'sent', 'received'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === filterType
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
          <p className="text-gray-500">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.direction === 'sent' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {transaction.direction === 'sent' ? '↗️' : '↙️'}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {transaction.direction === 'sent' ? 'Sent to' : 'Received from'}
                      </span>
                      <span className="text-blue-600 font-mono">
                        user {transaction.counterparty}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{formatDate(transaction.createdAt.toString())}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    transaction.direction === 'sent' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.direction === 'sent' ? '-' : '+'}
                    {formatAmount(transaction.direction === 'sent' ? transaction.amount : transaction.recipientAmount)} ETH
                  </div>
                  
                  {transaction.direction === 'sent' && (
                    <div className="text-xs text-gray-500">
                      Fee: {formatAmount(transaction.platformFee)} ETH
                    </div>
                  )}
                </div>
              </div>
              
              {transaction.txHash && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={`https://basescan.org/tx/${transaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 font-mono"
                  >
                    {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-8)}
                  </a>
                </div>
              )}
            </div>
          ))}
          
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}