import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CONTRACT_ADDRESSES, type ContractAddresses } from '../config/contracts';

const STORAGE_KEY = 'rwa.contract.addresses.v1';

function safeParse(json: string | null): Partial<ContractAddresses> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Partial<ContractAddresses>;
  } catch {
    return {};
  }
}

function loadAddresses(): ContractAddresses {
  if (typeof window === 'undefined') return DEFAULT_CONTRACT_ADDRESSES;
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return { ...DEFAULT_CONTRACT_ADDRESSES, ...stored };
}

export function useContractAddresses() {
  const [addresses, setAddressesState] = useState<ContractAddresses>(() => loadAddresses());

  useEffect(() => {
    // Keep in sync if user has multiple tabs open
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setAddressesState(loadAddresses());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setAddresses = useCallback((patch: Partial<ContractAddresses>) => {
    const next = { ...loadAddresses(), ...patch };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAddressesState(next);
    return next;
  }, []);

  const resetAddresses = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAddressesState(DEFAULT_CONTRACT_ADDRESSES);
  }, []);

  return { addresses, setAddresses, resetAddresses };
}


