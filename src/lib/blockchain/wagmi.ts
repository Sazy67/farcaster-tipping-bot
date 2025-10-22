import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { config } from '../config';

// Wagmi configuration for Base network
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Farcaster Tipping Bot',
      appLogoUrl: '/logo.png',
    }),
  ],
  transports: {
    [base.id]: http(config.baseNetwork.rpcUrl),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}