import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdminContract } from './useAdminContract';
import { Contract } from 'ethers';
// ...existing code...

describe('useAdminContract', () => {
  const mockOwnerAddress = '0xOwnerAddress123';
  const mockTestAddress = '0xTestAddress456';

  let mockContractInstance: {
    owner: ReturnType<typeof vi.fn>;
    isIssuer: ReturnType<typeof vi.fn>;
    isManager: ReturnType<typeof vi.fn>;
    isManagerForToken: ReturnType<typeof vi.fn>;
    marketplacePaused: ReturnType<typeof vi.fn>;
    addIssuer: ReturnType<typeof vi.fn>;
    removeIssuer: ReturnType<typeof vi.fn>;
    addManager: ReturnType<typeof vi.fn>;
    removeManager: ReturnType<typeof vi.fn>;
    setManagerForToken: ReturnType<typeof vi.fn>;
    pauseMarketplace: ReturnType<typeof vi.fn>;
  };

  const mockTransaction = {
    wait: vi.fn().mockResolvedValue({ status: 1 }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockContractInstance = {
      owner: vi.fn().mockResolvedValue(mockOwnerAddress),
      isIssuer: vi.fn().mockResolvedValue(false),
      isManager: vi.fn().mockResolvedValue(false),
      isManagerForToken: vi.fn().mockResolvedValue(false),
      marketplacePaused: vi.fn().mockResolvedValue(false),
      addIssuer: vi.fn().mockResolvedValue(mockTransaction),
      removeIssuer: vi.fn().mockResolvedValue(mockTransaction),
      addManager: vi.fn().mockResolvedValue(mockTransaction),
      removeManager: vi.fn().mockResolvedValue(mockTransaction),
      setManagerForToken: vi.fn().mockResolvedValue(mockTransaction),
      pauseMarketplace: vi.fn().mockResolvedValue(mockTransaction),
    };

    (Contract as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockContractInstance);
  });

  describe('Read Functions', () => {
    describe('getOwner', () => {
      it('returns owner address', async () => {
        const { result } = renderHook(() => useAdminContract());

        const owner = await result.current.getOwner();

        expect(owner).toBe(mockOwnerAddress);
        expect(mockContractInstance.owner).toHaveBeenCalled();
      });

      it('returns null when provider is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: null,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        const owner = await result.current.getOwner();

        expect(owner).toBe(null);
      });

      it('returns null on error', async () => {
        mockContractInstance.owner.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAdminContract());

        const owner = await result.current.getOwner();

        expect(owner).toBe(null);
        consoleSpy.mockRestore();
      });
    });

    describe('checkIsIssuer', () => {
      it('returns true when address is issuer', async () => {
        mockContractInstance.isIssuer.mockResolvedValue(true);

        const { result } = renderHook(() => useAdminContract());

        const isIssuer = await result.current.checkIsIssuer(mockTestAddress);

        expect(isIssuer).toBe(true);
        expect(mockContractInstance.isIssuer).toHaveBeenCalledWith(mockTestAddress);
      });

      it('returns false when address is not issuer', async () => {
        mockContractInstance.isIssuer.mockResolvedValue(false);

        const { result } = renderHook(() => useAdminContract());

        const isIssuer = await result.current.checkIsIssuer(mockTestAddress);

        expect(isIssuer).toBe(false);
      });

      it('returns false when provider is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: null,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        const isIssuer = await result.current.checkIsIssuer(mockTestAddress);

        expect(isIssuer).toBe(false);
      });

      it('returns false on error', async () => {
        mockContractInstance.isIssuer.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAdminContract());

        const isIssuer = await result.current.checkIsIssuer(mockTestAddress);

        expect(isIssuer).toBe(false);
        consoleSpy.mockRestore();
      });
    });

    describe('checkIsManager', () => {
      it('returns true when address is manager', async () => {
        mockContractInstance.isManager.mockResolvedValue(true);

        const { result } = renderHook(() => useAdminContract());

        const isManager = await result.current.checkIsManager(mockTestAddress);

        expect(isManager).toBe(true);
        expect(mockContractInstance.isManager).toHaveBeenCalledWith(mockTestAddress);
      });

      it('returns false when address is not manager', async () => {
        mockContractInstance.isManager.mockResolvedValue(false);

        const { result } = renderHook(() => useAdminContract());

        const isManager = await result.current.checkIsManager(mockTestAddress);

        expect(isManager).toBe(false);
      });

      it('returns false on error', async () => {
        mockContractInstance.isManager.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAdminContract());

        const isManager = await result.current.checkIsManager(mockTestAddress);

        expect(isManager).toBe(false);
        consoleSpy.mockRestore();
      });
    });

    describe('checkIsManagerForToken', () => {
      it('returns true when address is manager for token', async () => {
        mockContractInstance.isManagerForToken.mockResolvedValue(true);

        const { result } = renderHook(() => useAdminContract());

        const isManagerForToken = await result.current.checkIsManagerForToken(mockTestAddress, 1);

        expect(isManagerForToken).toBe(true);
        expect(mockContractInstance.isManagerForToken).toHaveBeenCalledWith(mockTestAddress, 1);
      });

      it('returns false when address is not manager for token', async () => {
        mockContractInstance.isManagerForToken.mockResolvedValue(false);

        const { result } = renderHook(() => useAdminContract());

        const isManagerForToken = await result.current.checkIsManagerForToken(mockTestAddress, 1);

        expect(isManagerForToken).toBe(false);
      });

      it('returns false on error', async () => {
        mockContractInstance.isManagerForToken.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAdminContract());

        const isManagerForToken = await result.current.checkIsManagerForToken(mockTestAddress, 1);

        expect(isManagerForToken).toBe(false);
        consoleSpy.mockRestore();
      });
    });

    describe('getMarketplacePaused', () => {
      it('returns true when marketplace is paused', async () => {
        mockContractInstance.marketplacePaused.mockResolvedValue(true);

        const { result } = renderHook(() => useAdminContract());

        const isPaused = await result.current.getMarketplacePaused();

        expect(isPaused).toBe(true);
        expect(mockContractInstance.marketplacePaused).toHaveBeenCalled();
      });

      it('returns false when marketplace is not paused', async () => {
        mockContractInstance.marketplacePaused.mockResolvedValue(false);

        const { result } = renderHook(() => useAdminContract());

        const isPaused = await result.current.getMarketplacePaused();

        expect(isPaused).toBe(false);
      });

      it('returns false on error', async () => {
        mockContractInstance.marketplacePaused.mockRejectedValue(new Error('Network error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAdminContract());

        const isPaused = await result.current.getMarketplacePaused();

        expect(isPaused).toBe(false);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Write Functions', () => {
    describe('addIssuer', () => {
      it('adds issuer and waits for transaction', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.addIssuer(mockTestAddress);

        expect(success).toBe(true);
        expect(mockContractInstance.addIssuer).toHaveBeenCalledWith(mockTestAddress);
        expect(mockTransaction.wait).toHaveBeenCalled();
      });

      it('throws error when signer is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: mockProvider,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        await expect(result.current.addIssuer(mockTestAddress)).rejects.toThrow('Wallet not connected');
      });

      it('throws error on transaction failure', async () => {
        const error = new Error('Transaction failed');
        mockContractInstance.addIssuer.mockRejectedValue(error);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const { result } = renderHook(() => useAdminContract());

        await expect(result.current.addIssuer(mockTestAddress)).rejects.toThrow('Transaction failed');
        consoleSpy.mockRestore();
      });
    });

    describe('removeIssuer', () => {
      it('removes issuer and waits for transaction', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.removeIssuer(mockTestAddress);

        expect(success).toBe(true);
        expect(mockContractInstance.removeIssuer).toHaveBeenCalledWith(mockTestAddress);
        expect(mockTransaction.wait).toHaveBeenCalled();
      });

      it('throws error when signer is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: mockProvider,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        await expect(result.current.removeIssuer(mockTestAddress)).rejects.toThrow('Wallet not connected');
      });
    });

    describe('addManager', () => {
      it('adds manager and waits for transaction', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.addManager(mockTestAddress);

        expect(success).toBe(true);
        expect(mockContractInstance.addManager).toHaveBeenCalledWith(mockTestAddress);
        expect(mockTransaction.wait).toHaveBeenCalled();
      });

      it('throws error when signer is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: mockProvider,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        await expect(result.current.addManager(mockTestAddress)).rejects.toThrow('Wallet not connected');
      });
    });

    describe('removeManager', () => {
      it('removes manager and waits for transaction', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.removeManager(mockTestAddress);

        expect(success).toBe(true);
        expect(mockContractInstance.removeManager).toHaveBeenCalledWith(mockTestAddress);
        expect(mockTransaction.wait).toHaveBeenCalled();
      });

      it('throws error when signer is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: mockProvider,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        await expect(result.current.removeManager(mockTestAddress)).rejects.toThrow('Wallet not connected');
      });
    });

    describe('setManagerForToken', () => {
      it('sets manager for token and waits for transaction', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.setManagerForToken(mockTestAddress, 1, true);

        expect(success).toBe(true);
        expect(mockContractInstance.setManagerForToken).toHaveBeenCalledWith(mockTestAddress, 1, true);
        expect(mockTransaction.wait).toHaveBeenCalled();
      });

      it('removes manager for token when status is false', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.setManagerForToken(mockTestAddress, 1, false);

        expect(success).toBe(true);
        expect(mockContractInstance.setManagerForToken).toHaveBeenCalledWith(mockTestAddress, 1, false);
      });

      it('throws error when signer is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: mockProvider,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        await expect(result.current.setManagerForToken(mockTestAddress, 1, true)).rejects.toThrow('Wallet not connected');
      });
    });

    describe('pauseMarketplace', () => {
      it('pauses marketplace and waits for transaction', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.pauseMarketplace(true);

        expect(success).toBe(true);
        expect(mockContractInstance.pauseMarketplace).toHaveBeenCalledWith(true);
        expect(mockTransaction.wait).toHaveBeenCalled();
      });

      it('unpauses marketplace when pause is false', async () => {
        const { result } = renderHook(() => useAdminContract());

        const success = await result.current.pauseMarketplace(false);

        expect(success).toBe(true);
        expect(mockContractInstance.pauseMarketplace).toHaveBeenCalledWith(false);
      });

      it('throws error when signer is not available', async () => {
        const { useWallet } = await import('../context/Web3Context');
        (useWallet as ReturnType<typeof vi.fn>).mockReturnValueOnce({
          provider: mockProvider,
          signer: null,
        });

        const { result } = renderHook(() => useAdminContract());

        await expect(result.current.pauseMarketplace(true)).rejects.toThrow('Wallet not connected');
      });
    });
  });

  describe('Contract Instance Creation', () => {
    it('creates read contract with provider', async () => {
      const { result } = renderHook(() => useAdminContract());

      await result.current.getOwner();

      expect(Contract).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        mockProvider
      );
    });

    it('creates write contract with signer', async () => {
      const { result } = renderHook(() => useAdminContract());

      await result.current.addIssuer(mockTestAddress);

      expect(Contract).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        mockSigner
      );
    });
  });
});
