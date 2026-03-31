import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletProvider, useWallet } from './Web3Context';

vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn().mockImplementation(() => ({
      getNetwork: vi.fn().mockResolvedValue({ chainId: 1n }),
      send: vi.fn().mockResolvedValue(null),
    })),
  },
}));

// Test component to access context
const TestComponent = () => {
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  return (
    <div>
      <span data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</span>
      <span data-testid="address">{address || 'no-address'}</span>
      <button onClick={connectWallet} data-testid="connect-btn">Connect</button>
      <button onClick={disconnectWallet} data-testid="disconnect-btn">Disconnect</button>
    </div>
  );
};

describe('Web3Context', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
    (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (window.ethereum.request as ReturnType<typeof vi.fn>).mockReset();
    (window.ethereum.on as ReturnType<typeof vi.fn>).mockReset();
    (window.ethereum.removeListener as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('WalletProvider', () => {
    it('provides default disconnected state', () => {
      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('address')).toHaveTextContent('no-address');
    });

    it('sets up event listeners on mount', () => {
      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      expect(window.ethereum.on).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
      expect(window.ethereum.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });

    it('removes event listeners on unmount', () => {
      const { unmount } = render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      unmount();

      expect(window.ethereum.removeListener).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
      expect(window.ethereum.removeListener).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });
  });

  describe('auto-connect', () => {
    it('auto-connects if previously connected and accounts available', async () => {
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });

    it('does not auto-connect if not previously connected', async () => {
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      // Wait a bit and verify still disconnected
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    });

    it('does not auto-connect if no accounts returned', async () => {
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    });

    it('clears localStorage if auto-connect fails', async () => {
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Connection failed'));

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('walletConnected');
      });
    });
  });

  describe('connectWallet', () => {
    it('connects wallet and sets address', async () => {
      const user = userEvent.setup();
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'wallet_requestPermissions') {
          return [];
        }
        if (method === 'eth_requestAccounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await user.click(screen.getByTestId('connect-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });
    });

    it('stores connection state in localStorage', async () => {
      const user = userEvent.setup();
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'wallet_requestPermissions') {
          return [];
        }
        if (method === 'eth_requestAccounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await user.click(screen.getByTestId('connect-btn'));

      await waitFor(() => {
        expect(window.localStorage.setItem).toHaveBeenCalledWith('walletConnected', 'true');
      });
    });

    it('throws error when no wallet is found', async () => {
      const originalEthereum = window.ethereum;
      // @ts-expect-error - Temporarily remove ethereum
      delete window.ethereum;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const ErrorTestComponent = () => {
        const { connectWallet } = useWallet();
        const [error, setError] = React.useState<string | null>(null);

        const handleConnect = async () => {
          try {
            await connectWallet();
          } catch (e) {
            setError((e as Error).message);
          }
        };

        return (
          <div>
            <button onClick={handleConnect} data-testid="connect-btn">Connect</button>
            <span data-testid="error">{error || 'no-error'}</span>
          </div>
        );
      };

      const user = userEvent.setup();
      const React = await import('react');

      render(
        <WalletProvider>
          <ErrorTestComponent />
        </WalletProvider>
      );

      await user.click(screen.getByTestId('connect-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No wallet found');
      });

      // Restore
      Object.defineProperty(window, 'ethereum', { value: originalEthereum, writable: true });
      consoleSpy.mockRestore();
    });
  });

  describe('disconnectWallet', () => {
    it('disconnects wallet and clears address', async () => {
      const user = userEvent.setup();
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      // Wait for auto-connect
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Disconnect
      await user.click(screen.getByTestId('disconnect-btn'));

      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('address')).toHaveTextContent('no-address');
    });

    it('removes connection state from localStorage', async () => {
      const user = userEvent.setup();
      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      await user.click(screen.getByTestId('disconnect-btn'));

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('walletConnected');
    });
  });

  describe('account changes', () => {
    it('handles account change to new account', async () => {
      let accountsChangedHandler: ((accounts: string[]) => void) | null = null;

      (window.ethereum.on as ReturnType<typeof vi.fn>).mockImplementation((event: string, handler: (accounts: string[]) => void) => {
        if (event === 'accountsChanged') {
          accountsChangedHandler = handler;
        }
      });

      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [mockAddress];
        }
        if (method === 'wallet_requestPermissions') {
          return [];
        }
        return null;
      });

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate account change
      const newAddress = '0x0987654321098765432109876543210987654321';
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
          return [newAddress];
        }
        if (method === 'wallet_requestPermissions') {
          return [];
        }
        return null;
      });

      act(() => {
        accountsChangedHandler?.([newAddress]);
      });

      // Should trigger reconnect
      await waitFor(() => {
        expect(window.ethereum.request).toHaveBeenCalled();
      });
    });

    it('disconnects when all accounts removed', async () => {
      let accountsChangedHandler: ((accounts: string[]) => void) | null = null;

      (window.ethereum.on as ReturnType<typeof vi.fn>).mockImplementation((event: string, handler: (accounts: string[]) => void) => {
        if (event === 'accountsChanged') {
          accountsChangedHandler = handler;
        }
      });

      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <TestComponent />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
      });

      // Simulate all accounts removed
      act(() => {
        accountsChangedHandler?.([]);
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
      });
    });
  });

  describe('useWallet hook', () => {
    it('throws error when used outside WalletProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useWallet must be used within a WalletProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('provider and signer', () => {
    it('provides provider when connected', async () => {
      let hasProvider = false;

      const ProviderTestComponent = () => {
        const { provider, isConnected } = useWallet();
        hasProvider = !!provider;
        return (
          <span data-testid="status">{isConnected ? 'connected' : 'disconnected'}</span>
        );
      };

      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <ProviderTestComponent />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('connected');
      });

      expect(hasProvider).toBe(true);
    });

    it('provides signer when connected', async () => {
      let hasSigner = false;

      const SignerTestComponent = () => {
        const { signer, isConnected } = useWallet();
        hasSigner = !!signer;
        return (
          <span data-testid="status">{isConnected ? 'connected' : 'disconnected'}</span>
        );
      };

      (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('true');
      (window.ethereum.request as ReturnType<typeof vi.fn>).mockImplementation(async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') {
          return [mockAddress];
        }
        return null;
      });

      render(
        <WalletProvider>
          <SignerTestComponent />
        </WalletProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('connected');
      });

      expect(hasSigner).toBe(true);
    });
  });
});
