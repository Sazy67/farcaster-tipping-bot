import { createPublicClient, createWalletClient, http, Chain } from 'viem';
import { base } from 'viem/chains';
import { config } from '../config';

// Base network configuration
export const baseChain: Chain = {
  ...base,
  rpcUrls: {
    default: {
      http: [config.baseNetwork.rpcUrl],
    },
    public: {
      http: [config.baseNetwork.rpcUrl],
    },
  },
};

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: baseChain,
  transport: http(config.baseNetwork.rpcUrl),
});

// Wallet client factory for transaction signing
export const createWalletClientForAddress = (account: `0x${string}`) => {
  return createWalletClient({
    account,
    chain: baseChain,
    transport: http(config.baseNetwork.rpcUrl),
  });
};

// Network validation utilities
export const validateNetwork = async (): Promise<boolean> => {
  try {
    const chainId = await publicClient.getChainId();
    return chainId === config.baseNetwork.chainId;
  } catch (error) {
    console.error('Network validation failed:', error);
    return false;
  }
};

// Gas estimation utilities
export const estimateGasForTransfer = async (
  from: `0x${string}`,
  to: `0x${string}`,
  value: bigint
): Promise<bigint> => {
  try {
    const gasEstimate = await publicClient.estimateGas({
      account: from,
      to,
      value,
    });
    
    // Add 20% buffer for gas estimation
    return (gasEstimate * BigInt(120)) / BigInt(100);
  } catch (error) {
    console.error('Gas estimation failed:', error);
    // Return a default gas limit if estimation fails
    return BigInt(21000);
  }
};

// Get current gas price
export const getCurrentGasPrice = async (): Promise<bigint> => {
  try {
    const gasPrice = await publicClient.getGasPrice();
    return gasPrice;
  } catch (error) {
    console.error('Failed to get gas price:', error);
    // Return a default gas price (20 gwei)
    return BigInt(20000000000);
  }
};

// Check if address has sufficient balance
export const checkBalance = async (
  address: `0x${string}`,
  requiredAmount: bigint
): Promise<{ hasBalance: boolean; currentBalance: bigint }> => {
  try {
    const balance = await publicClient.getBalance({ address });
    return {
      hasBalance: balance >= requiredAmount,
      currentBalance: balance,
    };
  } catch (error) {
    console.error('Balance check failed:', error);
    return {
      hasBalance: false,
      currentBalance: BigInt(0),
    };
  }
};

// Format ETH amounts for display
export const formatEthAmount = (amount: bigint, decimals: number = 4): string => {
  const ethAmount = Number(amount) / 1e18;
  return ethAmount.toFixed(decimals);
};

// Parse ETH amounts from string
export const parseEthAmount = (amount: string): bigint => {
  const ethAmount = parseFloat(amount);
  return BigInt(Math.floor(ethAmount * 1e18));
};