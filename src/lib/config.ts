export const config = {
  // Base Network Configuration
  baseNetwork: {
    chainId: parseInt(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '8453'),
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    name: 'Base',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },

  // Platform Configuration
  platform: {
    walletAddress: process.env.PLATFORM_WALLET_ADDRESS || '',
    feePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '20'),
    maxTipAmount: '0.1', // Max 0.1 ETH per tip
    rateLimitPerMinute: 10,
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Farcaster
  farcaster: {
    hubUrl: process.env.FARCASTER_HUB_URL || 'https://hub.farcaster.xyz',
    developerFid: process.env.NEXT_PUBLIC_FARCASTER_DEVELOPER_FID || '',
  },

  // Security
  security: {
    nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
} as const;