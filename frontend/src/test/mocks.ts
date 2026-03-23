import { vi } from 'vitest';

// Mock ethers module
export const mockContract = {
  owner: vi.fn(),
  isIssuer: vi.fn(),
  isManager: vi.fn(),
  isManagerForToken: vi.fn(),
  marketplacePaused: vi.fn(),
  addIssuer: vi.fn(),
  removeIssuer: vi.fn(),
  addManager: vi.fn(),
  removeManager: vi.fn(),
  setManagerForToken: vi.fn(),
  pauseMarketplace: vi.fn(),
};

export const mockSigner = {
  getAddress: vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
};

export const mockProvider = {
  getSigner: vi.fn().mockResolvedValue(mockSigner),
  send: vi.fn(),
};

export const createMockWalletContext = (overrides = {}) => ({
  address: null,
  isConnected: false,
  provider: null,
  signer: null,
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  ...overrides,
});

export const createMockAuthContext = (overrides = {}) => ({
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

// Mock transaction
export const mockTransaction = {
  wait: vi.fn().mockResolvedValue({ status: 1 }),
};

// Helper to setup contract mock responses
export const setupContractMocks = (contractMock: typeof mockContract) => {
  contractMock.owner.mockResolvedValue('0xOwnerAddress');
  contractMock.isIssuer.mockResolvedValue(false);
  contractMock.isManager.mockResolvedValue(false);
  contractMock.isManagerForToken.mockResolvedValue(false);
  contractMock.marketplacePaused.mockResolvedValue(false);
  contractMock.addIssuer.mockResolvedValue(mockTransaction);
  contractMock.removeIssuer.mockResolvedValue(mockTransaction);
  contractMock.addManager.mockResolvedValue(mockTransaction);
  contractMock.removeManager.mockResolvedValue(mockTransaction);
  contractMock.setManagerForToken.mockResolvedValue(mockTransaction);
  contractMock.pauseMarketplace.mockResolvedValue(mockTransaction);
};

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockContract).forEach(fn => fn.mockReset());
  mockSigner.getAddress.mockReset();
  mockProvider.getSigner.mockReset();
  mockProvider.send.mockReset();
  mockTransaction.wait.mockReset();
};
