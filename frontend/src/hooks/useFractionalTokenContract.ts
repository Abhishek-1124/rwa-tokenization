import { Contract } from 'ethers';
import { useMemo } from 'react';
import { useWallet } from '../context/Web3Context';
import { FRACTIONAL_TOKEN_ABI } from '../config/contracts';
import { useContractAddresses } from './useContractAddresses';

export function useFractionalTokenContract() {
  const { provider, signer } = useWallet();
  const { addresses } = useContractAddresses();

  const getAddress = () => {
    const addr = addresses.fractionalToken;
    if (!addr) throw new Error('FractionalToken address not set');
    return addr;
  };

  const readContract = useMemo(() => {
    if (!provider || !addresses.fractionalToken) return null;
    return new Contract(addresses.fractionalToken, FRACTIONAL_TOKEN_ABI, provider);
  }, [provider, addresses.fractionalToken]);

  const writeContract = useMemo(() => {
    if (!signer || !addresses.fractionalToken) return null;
    return new Contract(addresses.fractionalToken, FRACTIONAL_TOKEN_ABI, signer);
  }, [signer, addresses.fractionalToken]);

  const totalShares = async (assetId: number): Promise<bigint> => {
    if (!readContract) return 0n;
    return await readContract.totalShares(assetId);
  };

  const balanceOf = async (account: string, assetId: number): Promise<bigint> => {
    if (!readContract) return 0n;
    return await readContract.balanceOf(account, assetId);
  };

  const isApprovedForAll = async (account: string, operator: string): Promise<boolean> => {
    if (!readContract) return false;
    return await readContract.isApprovedForAll(account, operator);
  };

  const setApprovalForAll = async (operator: string, approved: boolean): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.setApprovalForAll(operator, approved);
    await tx.wait();
  };

  const mintFractions = async (assetId: number, shares: number, owner: string): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.mintFractions(assetId, shares, owner);
    await tx.wait();
  };

  const getReadContract = () => readContract;
  const getWriteContract = () => writeContract;

  return {
    getAddress,
    getReadContract,
    getWriteContract,
    totalShares,
    balanceOf,
    isApprovedForAll,
    setApprovalForAll,
    mintFractions,
  };
}


