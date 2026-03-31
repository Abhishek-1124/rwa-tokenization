import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { BrowserProvider, type Signer } from 'ethers';
import type { WalletContextType, User } from '../types';
import { EXPECTED_CHAIN_ID, HEDERA_TESTNET_CONFIG } from '../config/contracts';

// Move non-component exports to a separate file if needed for Fast Refresh compliance

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Moved useWallet to utils/contextUtils.ts for Fast Refresh compliance

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const switchToHederaTestnet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HEDERA_TESTNET_CONFIG.chainId }],
      });
    } catch (switchError: unknown) {
      // Chain not added to MetaMask, try adding it
      if (switchError.code === 4902) {
        try {
          if (window.ethereum) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [HEDERA_TESTNET_CONFIG],
            });
          }
        } catch (addError) {
          console.error('Failed to add Hedera Testnet:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to Hedera Testnet:', switchError);
        throw switchError;
      }
    }
  };

  const connectWallet = React.useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask.');
      }

      const web3Provider = new BrowserProvider(window.ethereum);

      // Request permissions to force account picker popup (allows switching accounts)
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      await web3Provider.send("eth_requestAccounts", []);

      // Check network and prompt to switch if needed
      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      console.log('Current Chain ID:', currentChainId);
      console.log('Expected Chain ID:', EXPECTED_CHAIN_ID);

      if (currentChainId !== EXPECTED_CHAIN_ID) {
        console.warn(`Wrong network detected. Please switch to Hedera Testnet (Chain ID: ${EXPECTED_CHAIN_ID})`);
        await switchToHederaTestnet();
        // Reload to get fresh provider after network switch
        window.location.reload();
        return;
      }

      const web3Signer = await web3Provider.getSigner();
      const walletAddress = await web3Signer.getAddress();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(walletAddress);
      setIsConnected(true);

      // Create user object
      const newUser: User = {
        address: walletAddress,
        connectedAt: new Date(),
        role: 'user', // Default role, can be updated based on contract checks
      };
      setUser(newUser);

      // Store connection state and user info
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
    setUser(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('user');
  };

  // Auto-connect on load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      const storedUser = localStorage.getItem('user');
      if (wasConnected && window.ethereum) {
        try {
          const web3Provider = new BrowserProvider(window.ethereum);
          const accounts = await web3Provider.send("eth_accounts", []) as string[];

          if (accounts.length > 0) {
            const web3Signer = await web3Provider.getSigner();
            const walletAddress = await web3Signer.getAddress();

            // Check network
            const network = await web3Provider.getNetwork();
            setChainId(Number(network.chainId));

            setProvider(web3Provider);
            setSigner(web3Signer);
            setAddress(walletAddress);
            setIsConnected(true);

            // Restore or create user object
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              // Update the connectedAt to be a Date object
              setUser({
                ...parsedUser,
                connectedAt: new Date(parsedUser.connectedAt),
              });
            } else {
              const newUser: User = {
                address: walletAddress,
                connectedAt: new Date(),
                role: 'user',
              };
              setUser(newUser);
              localStorage.setItem('user', JSON.stringify(newUser));
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('user');
        }
      }
    };

    autoConnect();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accountsArray = accounts as string[];
        if (accountsArray.length === 0) {
          disconnectWallet();
        } else if (accountsArray[0] !== address) {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address, connectWallet]);

  const value: WalletContextType = {
    address,
    isConnected,
    provider,
    signer,
    chainId,
    user,
    connectWallet,
    disconnectWallet,
    switchToHederaTestnet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
