import { Contract, parseEther } from 'ethers';
import { useWallet } from '../context/Web3Context';
import { INCOME_DISTRIBUTOR_ABI } from '../config/contracts';
import { useContractAddresses } from './useContractAddresses';

export function useIncomeDistributorContract() {
  const { provider, signer, address } = useWallet();
  const { addresses } = useContractAddresses();

  const getAddress = () => {
    const addr = addresses.incomeDistributor;
    if (!addr) throw new Error('IncomeDistributor address not set');
    return addr;
  };

  const getReadContract = () => {
    if (!provider) return null;
    return new Contract(getAddress(), INCOME_DISTRIBUTOR_ABI, provider);
  };

  const getWriteContract = () => {
    if (!signer) return null;
    return new Contract(getAddress(), INCOME_DISTRIBUTOR_ABI, signer);
  };

  const pending = async (assetId: number, account?: string): Promise<bigint> => {
    const c = getReadContract();
    if (!c) return 0n;
    const who = account || address;
    if (!who) return 0n;
    return await c.pending(who, assetId);
  };

  const claim = async (assetId: number): Promise<void> => {
    const c = getWriteContract();
    if (!c) throw new Error('Wallet not connected');
    const tx = await c.claim(assetId);
    await tx.wait();
  };

  const depositIncome = async (assetId: number, amountEth: string): Promise<void> => {
    const c = getWriteContract();
    if (!c) throw new Error('Wallet not connected');
    const value = parseEther(amountEth);
    const tx = await c.depositIncome(assetId, { value });
    await tx.wait();
  };

  return { getAddress, pending, claim, depositIncome };
}


