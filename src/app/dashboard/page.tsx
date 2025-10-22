'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  recipient?: string;
  sender?: string;
  txHash: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSent: '0.0000',
    totalReceived: '0.0000',
    transactionCount: 0,
  });

  useEffect(() => {
    // Mock transaction data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'sent',
        amount: '0.001',
        recipient: 'vitalik',
        txHash: '0xabc123...',
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'received',
        amount: '0.005',
        sender: 'dwr',
        txHash: '0xdef456...',
        status: 'completed',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        type: 'sent',
        amount: '0.002',
        recipient: 'jessepollak',
        txHash: '0xghi789...',
        status: 'pending',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    setTimeout(() => {
      setTransactions(mockTransactions);
      
      const sent = mockTransactions
        .filter(tx => tx.type === 'sent')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      const received = mockTransactions
        .filter(tx => tx.type === 'received')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      setStats({
        totalSent: sent.toFixed(4),
        totalReceived: received.toFixed(4),
        transactionCount: mockTransactions.length,
      });
      
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'sent' ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Kontrol Paneli</h1>
              <p className="text-gray-600 mt-2">
                Bahşiş işlemlerinizi görüntüleyin ve yönetin
              </p>
            </div>
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              ← Ana Sayfa
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Toplam Gönderilen</div>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.totalSent} ETH</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Toplam Alınan</div>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.totalReceived} ETH</div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">Toplam İşlem</div>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">{stats.transactionCount}</div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">İşlem Geçmişi</h2>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-500">Henüz işlem geçmişi yok</p>
                <Link
                  href="/"
                  className="inline-block mt-4 text-blue-600 hover:text-blue-800"
                >
                  İlk bahşişinizi gönderin →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'sent' ? 'bg-red-100' : 'bg-green-100'
                      }`}>
                        {tx.type === 'sent' ? '↗️' : '↙️'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {tx.type === 'sent' ? `@${tx.recipient} kullanıcısına gönderildi` : `@${tx.sender} kullanıcısından alındı`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(tx.timestamp).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getTypeColor(tx.type)}`}>
                        {tx.type === 'sent' ? '-' : '+'}{tx.amount} ETH
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                          {tx.status === 'completed' ? 'Tamamlandı' : tx.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                        </span>
                        <a
                          href={`https://basescan.org/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          TX ↗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              💰 Yeni Bahşiş Gönder
            </Link>
            <Link
              href="/api/health"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              🔍 Sistem Durumu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}