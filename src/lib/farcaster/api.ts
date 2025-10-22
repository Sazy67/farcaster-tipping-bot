import { config } from '../config';

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  verifiedAddresses: string[];
}

export interface FarcasterCast {
  hash: string;
  author: FarcasterUser;
  text: string;
  timestamp: number;
}

export class FarcasterAPI {
  private static readonly HUB_URL = config.farcaster.hubUrl;

  /**
   * Get user information by FID
   */
  static async getUserByFid(fid: string): Promise<FarcasterUser | null> {
    try {
      // This is a placeholder implementation
      // In production, you would call the Farcaster Hub API
      const response = await fetch(`${this.HUB_URL}/v1/userDataByFid?fid=${fid}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Parse the response and extract user information
      // This would need to be adapted based on the actual Hub API response format
      return {
        fid: parseInt(fid),
        username: data.username || '',
        displayName: data.displayName || '',
        pfpUrl: data.pfpUrl,
        verifiedAddresses: data.verifiedAddresses || [],
      };
    } catch (error) {
      console.error('Failed to get user by FID:', error);
      return null;
    }
  }

  /**
   * Get cast information by hash
   */
  static async getCastByHash(hash: string): Promise<FarcasterCast | null> {
    try {
      // This is a placeholder implementation
      // In production, you would call the Farcaster Hub API
      const response = await fetch(`${this.HUB_URL}/v1/castById?hash=${hash}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Parse the response and extract cast information
      return {
        hash,
        author: {
          fid: data.author.fid,
          username: data.author.username,
          displayName: data.author.displayName,
          pfpUrl: data.author.pfpUrl,
          verifiedAddresses: data.author.verifiedAddresses || [],
        },
        text: data.text,
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error('Failed to get cast by hash:', error);
      return null;
    }
  }

  /**
   * Validate frame signature
   */
  static async validateFrameSignature(
    messageBytes: string,
    signature: string
  ): Promise<boolean> {
    try {
      // This is a placeholder implementation
      // In production, you would validate the signature using Farcaster's cryptographic methods
      
      // For now, return true for development
      // In production, implement proper signature validation
      return true;
    } catch (error) {
      console.error('Failed to validate frame signature:', error);
      return false;
    }
  }

  /**
   * Get user's verified addresses (including wallet addresses)
   */
  static async getUserVerifiedAddresses(fid: string): Promise<string[]> {
    try {
      const user = await this.getUserByFid(fid);
      return user?.verifiedAddresses || [];
    } catch (error) {
      console.error('Failed to get user verified addresses:', error);
      return [];
    }
  }
}