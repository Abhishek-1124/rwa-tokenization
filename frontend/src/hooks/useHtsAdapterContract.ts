import { Contract } from 'ethers';
import { useWallet } from '../context/Web3Context';
import { useContractAddresses } from './useContractAddresses';

export const HTS_ADAPTER_ABI = [
  "function mintAndTransferFungible(address token, address to, uint64 amount)",
];

export function useHtsAdapterContract() {
  const { signer } = useWallet();
  const { addresses } = useContractAddresses();

  const getAddress = () => {
    const addr = addresses.htsAdapter;
    if (!addr) throw new Error('HtsAdapter address not set');
    return addr;
  };

  const getWriteContract = () => {
    if (!signer) return null;
    return new Contract(getAddress(), HTS_ADAPTER_ABI, signer);
  };

  const mintAndTransferFungible = async (tokenAddress: string, to: string, amount: bigint): Promise<void> => {
    const c = getWriteContract();
    if (!c) throw new Error('Wallet not connected');
    const tx = await c.mintAndTransferFungible(tokenAddress, to, amount);
    await tx.wait();
  };

  return { getAddress, mintAndTransferFungible };
}


