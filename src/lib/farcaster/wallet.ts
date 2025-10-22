import { checkBalance, publicClient } from '../blockchain/config';

export interface FarcasterWalletInfo {
  address: `0x${string}`;
  fid: string;
  isConnected: boolean;
  balance?: string;
}

export class FarcasterWalletService {
  /**
   * Get wallet information from Farcaster user data
   * In a real implementation, this would integrate with Farcaster's API
   * to get the user's connected wallet address
   */
  static async getWalletInfo(fid: string): Promise<FarcasterWalletInfo | null> {
    try {
      // This is a placeholder implementation
      // In production, you would call Farcaster's API to get the user's wallet
      const walletAddress = await this.getFarcasterUserWallet(fid);
      
      if (!walletAddress) {
        return null;
      }

      const balanceInfo = await checkBalance(walletAddress, BigInt(0));
      
      return {
        address: walletAddress,
        fid,
        isConnected: true,
        balance: (Number(balanceInfo.currentBalance) / 1e18).toFixed(4),
      };
    } catch (error) {
      console.error('Failed to get Farcaster wallet info:', error);
      return null;
    }
  }

  /**
   * Get Farcaster user's connected wallet address
   * This would integrate with Farcaster Hub API in production
   */
  private static async getFarcasterUserWallet(fid: string): Promise<`0x${string}` | null> {
    try {
      // Placeholder implementation
      // In production, this would call:
      // 1. Farcaster Hub API to get user data
      // 2. Extract verified addresses from user's profile
      // 3. Return the primary wallet address
      
      // For now, return null to indicate no wallet found
      // This will be implemented when integrating with actual Farcaster API
      return null;
    } catch (error) {
      console.error('Failed to get Farcaster user wallet:', error);
      return null;
    }
  }

  /**
   * Validate that a wallet address belongs to a Farcaster user
   */
  static async validateWalletOwnership(
    fid: string, 
    walletAddress: `0x${string}`
  ): Promise<boolean> {
    try {
      const userWallet = await this.getFarcasterUserWallet(fid);
      return userWallet?.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Failed to validate wallet ownership:', error);
      return false;
    }
  }

  /**
   * Check if user has sufficient balance for a transaction
   */
  static async checkSufficientBalance(
    fid: string,
    requiredAmount: bigint
  ): Promise<{ hasBalance: boolean; currentBalance: string; walletAddress?: string }> {
    try {
      const walletInfo = await this.getWalletInfo(fid);
      
      if (!walletInfo) {
        return {
          hasBalance: false,
          currentBalance: '0',
        };
      }

      const balanceInfo = await checkBalance(walletInfo.address, requiredAmount);
      
      return {
        hasBalance: balanceInfo.hasBalance,
        currentBalance: (Number(balanceInfo.currentBalance) / 1e18).toFixed(4),
        walletAddress: walletInfo.address,
      };
    } catch (error) {
      console.error('Failed to check balance:', error);
      return {
        hasBalance: false,
        currentBalance: '0',
      };
    }
  }

  /**
   * Get wallet connection status for a Farcaster user
   */
  static async getConnectionStatus(fid: string): Promise<{
    isConnected: boolean;
    walletAddress?: string;
    networkValid?: boolean;
  }> {
    try {
      const walletInfo = await this.getWalletInfo(fid);
      
      if (!walletInfo) {
        return { isConnected: false };
      }

      // Verify the wallet is on the correct network
      const chainId = await publicClient.getChainId();
      const networkValid = chainId === 8453; // Base mainnet

      return {
        isConnected: true,
        walletAddress: walletInfo.address,
        networkValid,
      };
    } catch (error) {
      console.error('Failed to get connection status:', error);
      return { isConnected: false };
    }
  }
}