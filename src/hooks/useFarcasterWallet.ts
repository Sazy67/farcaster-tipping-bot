'use client';

import { useState, useEffect, useCallback } from 'react';
import { FarcasterWalletService, FarcasterWalletInfo } from '@/lib/farcaster/wallet';

export interface UseFarcasterWalletReturn {
  walletInfo: FarcasterWalletInfo | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  refreshWallet: () => Promise<void>;
  checkBalance: (requiredAmount: string) => Promise<{
    hasBalance: boolean;
    currentBalance: string;
  }>;
}

export function useFarcasterWallet(fid?: string): UseFarcasterWalletReturn {
  const [walletInfo, setWalletInfo] = useState<FarcasterWalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    if (!fid) {
      setWalletInfo(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const info = await FarcasterWalletService.getWalletInfo(fid);
      setWalletInfo(info);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get wallet info';
      setError(errorMessage);
      setWalletInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  const checkBalance = useCallback(async (requiredAmount: string) => {
    if (!fid) {
      return { hasBalance: false, currentBalance: '0' };
    }

    try {
      const requiredAmountBigInt = BigInt(Math.floor(parseFloat(requiredAmount) * 1e18));
      const result = await FarcasterWalletService.checkSufficientBalance(fid, requiredAmountBigInt);
      
      return {
        hasBalance: result.hasBalance,
        currentBalance: result.currentBalance,
      };
    } catch (err) {
      console.error('Failed to check balance:', err);
      return { hasBalance: false, currentBalance: '0' };
    }
  }, [fid]);

  // Load wallet info when fid changes
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return {
    walletInfo,
    isLoading,
    error,
    isConnected: walletInfo?.isConnected ?? false,
    refreshWallet,
    checkBalance,
  };
}