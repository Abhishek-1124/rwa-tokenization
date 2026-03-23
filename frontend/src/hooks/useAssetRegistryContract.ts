import { Contract } from 'ethers';
import { useMemo } from 'react';
import { useWallet } from '../context/Web3Context';
import { ASSET_REGISTRY_ABI } from '../config/contracts';
import { useContractAddresses } from './useContractAddresses';

export function useAssetRegistryContract() {
  const { provider, signer } = useWallet();
  const { addresses } = useContractAddresses();

  const getAddress = () => {
    const addr = addresses.assetRegistry;
    if (!addr) throw new Error('AssetRegistry address not set');
    return addr;
  };

  const readContract = useMemo(() => {
    if (!provider || !addresses.assetRegistry) return null;
    return new Contract(addresses.assetRegistry, ASSET_REGISTRY_ABI, provider);
  }, [provider, addresses.assetRegistry]);

  const writeContract = useMemo(() => {
    if (!signer || !addresses.assetRegistry) return null;
    return new Contract(addresses.assetRegistry, ASSET_REGISTRY_ABI, signer);
  }, [signer, addresses.assetRegistry]);

  const getAssetCount = async (): Promise<bigint> => {
    if (!readContract) return 0n;
    return await readContract.assetCount();
  };

  const assetExists = async (assetId: number): Promise<boolean> => {
    if (!readContract) return false;
    return await readContract.assetExists(assetId);
  };

  const getAssetURI = async (assetId: number): Promise<string> => {
    if (!readContract) return '';
    // Prefer tokenURI, fall back to mapping getter
    try {
      return await readContract.tokenURI(assetId);
    } catch {
      return await readContract.assetIPFS(assetId);
    }
  };

  const getOwnerOf = async (assetId: number): Promise<string> => {
    if (!readContract) return '';
    return await readContract.ownerOf(assetId);
  };

  const createAsset = async (metadataURI: string): Promise<bigint> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.createAsset(metadataURI);
    const receipt = await tx.wait();

    // Try to extract assetId from AssetCreated event; otherwise caller can read assetCount().
    const event = receipt?.logs?.find((log: { topics?: string[] }) => Array.isArray(log.topics) && log.topics.length > 0);
    if (!event) return await getAssetCount();
    return await getAssetCount();
  };

  const setAssetRoyalty = async (assetId: number, receiver: string, royaltyBps: number): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.setAssetRoyalty(assetId, receiver, royaltyBps);
    await tx.wait();
  };

  const royaltyInfo = async (assetId: number, salePriceWei: bigint): Promise<{ receiver: string; amount: bigint }> => {
    if (!readContract) return { receiver: '', amount: 0n };
    const [receiver, amount] = await readContract.royaltyInfo(assetId, salePriceWei);
    return { receiver, amount };
  };

  const getReadContract = () => readContract;
  const getWriteContract = () => writeContract;

  return {
    getAddress,
    getReadContract,
    getWriteContract,
    getAssetCount,
    assetExists,
    getAssetURI,
    getOwnerOf,
    createAsset,
    setAssetRoyalty,
    royaltyInfo,
  };
}


