import { Contract } from 'ethers';
import { useMemo } from 'react';
import { useWallet } from '../context/Web3Context';
import { MARKETPLACE_ABI } from '../config/contracts';
import { useContractAddresses } from './useContractAddresses';

export type Listing = {
  seller: string;
  assetId: bigint;
  amountRemaining: bigint;
  pricePerUnit: bigint;
  active: boolean;
};

export type Offer = {
  bidder: string;
  listingId: bigint;
  amount: bigint;
  pricePerUnit: bigint;
  active: boolean;
};

export function useMarketplaceContract() {
  const { provider, signer } = useWallet();
  const { addresses } = useContractAddresses();

  const getAddress = () => {
    const addr = addresses.marketplace;
    if (!addr) throw new Error('Marketplace address not set');
    return addr;
  };

  const readContract = useMemo(() => {
    if (!provider || !addresses.marketplace) return null;
    return new Contract(addresses.marketplace, MARKETPLACE_ABI, provider);
  }, [provider, addresses.marketplace]);

  const writeContract = useMemo(() => {
    if (!signer || !addresses.marketplace) return null;
    return new Contract(addresses.marketplace, MARKETPLACE_ABI, signer);
  }, [signer, addresses.marketplace]);

  const getReadContract = () => readContract;
  const getWriteContract = () => writeContract;

  const listingCount = async (): Promise<bigint> => {
    if (!readContract) return 0n;
    return await readContract.listingCount();
  };

  const getListing = async (id: number): Promise<Listing | null> => {
    if (!readContract) return null;
    const [seller, assetId, amountRemaining, pricePerUnit, active] = await readContract.listings(id);
    return { seller, assetId, amountRemaining, pricePerUnit, active };
  };

  const offerCount = async (): Promise<bigint> => {
    if (!readContract) return 0n;
    return await readContract.offerCount();
  };

  const getOffer = async (id: number): Promise<Offer | null> => {
    if (!readContract) return null;
    const [bidder, listingId, amount, pricePerUnit, active] = await readContract.offers(id);
    return { bidder, listingId, amount, pricePerUnit, active };
  };

  const list = async (assetId: number, amount: number, pricePerUnitWei: bigint): Promise<bigint> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.list(assetId, amount, pricePerUnitWei);
    await tx.wait();
    // listingId is returned but ethers v6 return handling can vary; easiest is to read listingCount after.
    return await listingCount();
  };

  const makeOffer = async (listingId: number, amount: number, pricePerUnitWei: bigint): Promise<bigint> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const total = BigInt(amount) * pricePerUnitWei;
    const tx = await writeContract.makeOffer(listingId, amount, pricePerUnitWei, { value: total });
    await tx.wait();
    return await offerCount();
  };

  const cancelOffer = async (offerId: number): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.cancelOffer(offerId);
    await tx.wait();
  };

  const acceptOffer = async (offerId: number): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.acceptOffer(offerId);
    await tx.wait();
  };

  const cancel = async (listingId: number): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.cancel(listingId);
    await tx.wait();
  };

  const updatePrice = async (listingId: number, newPricePerUnitWei: bigint): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.updatePrice(listingId, newPricePerUnitWei);
    await tx.wait();
  };

  const buy = async (listingId: number, amount: number, valueWei: bigint): Promise<void> => {
    if (!writeContract) throw new Error('Wallet not connected');
    const tx = await writeContract.buy(listingId, amount, { value: valueWei });
    await tx.wait();
  };

  return {
    getAddress,
    getReadContract,
    getWriteContract,
    listingCount,
    getListing,
    list,
    cancel,
    updatePrice,
    buy,
    offerCount,
    getOffer,
    makeOffer,
    cancelOffer,
    acceptOffer,
  };
}


