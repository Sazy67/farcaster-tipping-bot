import { Web3Wallet } from '@walletconnect/web3wallet';

export class FarcasterWalletConnect {
  private static instance: FarcasterWalletConnect;
  private web3wallet: any = null;
  private projectId: string;

  constructor() {
    this.projectId = process.env.NEXT_PUBLIC_FARCASTER_WC_PROJECT_ID || 'wc_secret_e9e013890648fa50208e33fedab2f3c15ca762e44df543c7fd3bd5d8_68eb8feb';
  }

  static getInstance(): FarcasterWalletConnect {
    if (!FarcasterWalletConnect.instance) {
      FarcasterWalletConnect.instance = new FarcasterWalletConnect();
    }
    return FarcasterWalletConnect.instance;
  }

  async initialize() {
    try {
      if (this.web3wallet) {
        return this.web3wallet;
      }

      // Basit initialization - WalletConnect v2 için
      console.log('Initializing Farcaster WalletConnect with project ID:', this.projectId);
      
      // Mock initialization for now
      this.web3wallet = {
        projectId: this.projectId,
        initialized: true,
      };

      return this.web3wallet;
    } catch (error) {
      console.error('WalletConnect initialization error:', error);
      throw error;
    }
  }

  async connectToFarcaster(): Promise<{
    fid: string;
    username: string;
    displayName: string;
    pfpUrl?: string;
    walletAddress: string;
  }> {
    try {
      if (!this.web3wallet) {
        await this.initialize();
      }

      // Farcaster Connect URI oluştur
      const uri = await this.generateFarcasterConnectURI();
      
      // QR kod veya deep link ile bağlantı
      const connectionResult = await this.handleFarcasterConnection(uri);
      
      return connectionResult;
    } catch (error) {
      console.error('Farcaster connection error:', error);
      throw error;
    }
  }

  private async generateFarcasterConnectURI(): Promise<string> {
    // Farcaster özel connect URI formatı
    const baseUrl = 'https://warpcast.com/~/sign-in-with-farcaster';
    const params = new URLSearchParams({
      client_id: this.projectId,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
      response_type: 'code',
      scope: 'read write',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  private async handleFarcasterConnection(uri: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Popup window açma
      const popup = window.open(uri, 'farcaster-auth', 'width=500,height=600');
      
      // Message listener
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'FARCASTER_AUTH_SUCCESS') {
          const userData = event.data.data;
          resolve({
            fid: userData.fid.toString(),
            username: userData.username,
            displayName: userData.displayName,
            pfpUrl: userData.pfpUrl,
            walletAddress: userData.custodyAddress,
          });
          popup?.close();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'FARCASTER_AUTH_ERROR') {
          reject(new Error('Farcaster authentication failed'));
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Popup kapatılma kontrolü
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Authentication popup was closed'));
        }
      }, 1000);
    });
  }

  private async onSessionProposal(event: any) {
    console.log('Session proposal:', event);
    // Session proposal handling
  }

  private async onSessionRequest(event: any) {
    console.log('Session request:', event);
    // Session request handling
  }

  private async onSessionDelete(event: any) {
    console.log('Session deleted:', event);
    // Session delete handling
  }

  async disconnect() {
    if (this.web3wallet) {
      console.log('Disconnecting Farcaster wallet...');
      this.web3wallet = null;
    }
  }

  // Demo mode fallback
  async connectDemo(): Promise<{
    fid: string;
    username: string;
    displayName: string;
    pfpUrl?: string;
    walletAddress: string;
  }> {
    // Simulated connection for demo
    return {
      fid: '62192',
      username: 'suatayaz',
      displayName: 'Suatayaz',
      pfpUrl: undefined,
      walletAddress: '0x1234567890123456789012345678901234567890',
    };
  }
}