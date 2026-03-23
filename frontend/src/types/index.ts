import type { BrowserProvider, Signer } from 'ethers';

export interface User {
  address: string;
  connectedAt: Date;
  role: 'user' | 'admin' | 'issuer' | 'manager';
}

export interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  provider: BrowserProvider | null;
  signer: Signer | null;
  chainId: number | null;
  user: User | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToHederaTestnet: () => Promise<void>;
}

// Extend Window interface for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
