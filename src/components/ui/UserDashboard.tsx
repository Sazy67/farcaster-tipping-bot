'use client';

import { useState, useEffect } from 'react';
import { useFarcasterWallet } from '@/hooks/useFarcasterWallet';
import { TransactionHistory } from './TransactionHistory';

interface UserDashboardProps {
  userFid: string;
  className?: string;
}

interface DashboardStats {
  totalSent: string;
  totalReceived: string;
  transactionCount: number;
  pendingTransactions: number;
}

export function UserDashboard({ userFid, className = '' }: UserDashboardProps) {
  const { walletInfo, isLoading: walletLoading, error: walletError, refreshWallet } = useFarcasterWallet(userFid);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState<{ enabled: boolean; loading: boolean }>({
    enabled: true,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch(`/api/transactions/history?userFid=${userFid}&limit=1000`);
        
        if (response.ok) {
          const data = await response.json();
          const transactions = data.transactions;
          
          const sent = transactions
            .filter((tx: any) => tx.direction === 'sent')
            .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);
          
          const received = transactions
            .filter((tx: any) => tx.direction === 'received')
            .reduce((sum: number, tx: any) => sum + parseFloat(tx.recipientAmount), 0);
          
          const pending = transactions.filter((tx: any) => tx.status === 'pending').length;
          
          setStats({
            totalSent: sent.toFixed(4),
            totalReceived: received.toFixed(4),
            transactionCount: transactions.length,
            pendingTransactions: pending,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchNotificationPrefs = async () => {
      try {
        const response = await fetch(`/api/notifications/preferences?userFid=${userFid}`);
        
        if (response.ok) {
          const data = await response.json();
          setNotificationPrefs({
            enabled: data.notificationEnabled,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
        setNotificationPrefs(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
    fetchNotificationPrefs();
  }, [userFid]);

  const toggleNotifications = async () => {
    try {
      setNotificationPrefs(prev => ({ ...prev, loading: true }));
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userFid,
          notificationEnabled: !notificationPrefs.enabled,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificationPrefs({
          enabled: data.notificationEnabled,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      setNotificationPrefs(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, user {userFid}</p>
      </div>

      {/* Wallet Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Status</h2>
        
        {walletLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : walletError ? (
          <div className="text-red-600">
            <p>Error loading wallet: {walletError}</p>
            <button
              onClick={refreshWallet}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        ) : walletInfo?.isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-green-700 font-medium">Wallet Connected</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>Address: <code className="bg-gray-100 px-2 py-1 rounded">{walletInfo.address}</code></div>
              <div className="mt-1">Balance: <span className="font-semibold">{walletInfo.balance} ETH</span></div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-red-700 font-medium">Wallet Not Connected</span>
            </div>
            <p className="text-sm text-gray-600">
              Please connect your wallet to Farcaster to send and receive tips.
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Sent</div>
          {statsLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-red-600">{stats?.totalSent || '0.0000'} ETH</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Received</div>
          {statsLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-green-600">{stats?.totalReceived || '0.0000'} ETH</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Transactions</div>
          {statsLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-blue-600">{stats?.transactionCount || 0}</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Pending</div>
          {statsLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingTransactions || 0}</div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Notifications</div>
              <div className="text-sm text-gray-500">
                Receive notifications when you send or receive tips
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              disabled={notificationPrefs.loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationPrefs.enabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${notificationPrefs.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationPrefs.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <TransactionHistory userFid={userFid} />
      </div>
    </div>
  );
}