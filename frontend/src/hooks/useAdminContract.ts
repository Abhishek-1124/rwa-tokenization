import { Contract } from 'ethers';
import { useWallet } from '../context/Web3Context';
import { ADMIN_CONTRACT_ADDRESS, ADMIN_ABI } from '../config/contracts';

export function useAdminContract() {
  const { provider, signer } = useWallet();

  const getReadContract = () => {
    if (!provider) return null;
    return new Contract(ADMIN_CONTRACT_ADDRESS, ADMIN_ABI, provider);
  };

  const getWriteContract = () => {
    if (!signer) return null;
    return new Contract(ADMIN_CONTRACT_ADDRESS, ADMIN_ABI, signer);
  };

  // Read functions
  const getOwner = async (): Promise<string | null> => {
    const contract = getReadContract();
    if (!contract) return null;
    try {
      return await contract.owner();
    } catch (error) {
      console.error('Error getting owner:', error);
      return null;
    }
  };

  const checkIsIssuer = async (address: string): Promise<boolean> => {
    const contract = getReadContract();
    if (!contract) return false;
    try {
      return await contract.isIssuer(address);
    } catch (error) {
      console.error('Error checking issuer:', error);
      return false;
    }
  };

  const checkIsManager = async (address: string): Promise<boolean> => {
    const contract = getReadContract();
    if (!contract) return false;
    try {
      return await contract.isManager(address);
    } catch (error) {
      console.error('Error checking manager:', error);
      return false;
    }
  };

  const checkIsManagerForToken = async (address: string, tokenId: number): Promise<boolean> => {
    const contract = getReadContract();
    if (!contract) return false;
    try {
      return await contract.isManagerForToken(address, tokenId);
    } catch (error) {
      console.error('Error checking token manager:', error);
      return false;
    }
  };

  const getMarketplacePaused = async (): Promise<boolean> => {
    const contract = getReadContract();
    if (!contract) return false;
    try {
      return await contract.marketplacePaused();
    } catch (error) {
      console.error('Error getting marketplace status:', error);
      return false;
    }
  };

  // Write functions
  const addIssuer = async (address: string): Promise<boolean> => {
    const contract = getWriteContract();
    if (!contract) throw new Error('Wallet not connected');
    try {
      const tx = await contract.addIssuer(address);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error adding issuer:', error);
      throw error;
    }
  };

  const removeIssuer = async (address: string): Promise<boolean> => {
    const contract = getWriteContract();
    if (!contract) throw new Error('Wallet not connected');
    try {
      const tx = await contract.removeIssuer(address);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error removing issuer:', error);
      throw error;
    }
  };

  const addManager = async (address: string): Promise<boolean> => {
    const contract = getWriteContract();
    if (!contract) throw new Error('Wallet not connected');
    try {
      const tx = await contract.addManager(address);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error adding manager:', error);
      throw error;
    }
  };

  const removeManager = async (address: string): Promise<boolean> => {
    const contract = getWriteContract();
    if (!contract) throw new Error('Wallet not connected');
    try {
      const tx = await contract.removeManager(address);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error removing manager:', error);
      throw error;
    }
  };

  const setManagerForToken = async (address: string, tokenId: number, status: boolean): Promise<boolean> => {
    const contract = getWriteContract();
    if (!contract) throw new Error('Wallet not connected');
    try {
      const tx = await contract.setManagerForToken(address, tokenId, status);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error setting token manager:', error);
      throw error;
    }
  };

  const pauseMarketplace = async (pause: boolean): Promise<boolean> => {
    const contract = getWriteContract();
    if (!contract) throw new Error('Wallet not connected');
    try {
      const tx = await contract.pauseMarketplace(pause);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Error pausing marketplace:', error);
      throw error;
    }
  };

  return {
    // Read functions
    getOwner,
    checkIsIssuer,
    checkIsManager,
    checkIsManagerForToken,
    getMarketplacePaused,
    // Write functions
    addIssuer,
    removeIssuer,
    addManager,
    removeManager,
    setManagerForToken,
    pauseMarketplace,
  };
}
