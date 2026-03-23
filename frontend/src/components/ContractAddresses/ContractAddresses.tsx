import React, { useMemo, useState } from 'react';
import { ADMIN_CONTRACT_ADDRESS } from '../../config/contracts';
import { useContractAddresses } from '../../hooks/useContractAddresses';
import './ContractAddresses.css';

const isProbablyAddress = (v: string) => /^0x[a-fA-F0-9]{40}$/.test(v.trim());

export const ContractAddresses: React.FC = () => {
  const { addresses, setAddresses, resetAddresses } = useContractAddresses();

  const [assetRegistry, setAssetRegistry] = useState(addresses.assetRegistry);
  const [fractionalToken, setFractionalToken] = useState(addresses.fractionalToken);
  const [marketplace, setMarketplace] = useState(addresses.marketplace);
  const [incomeDistributor, setIncomeDistributor] = useState(addresses.incomeDistributor);
  const [htsAdapter, setHtsAdapter] = useState(addresses.htsAdapter);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const invalids = useMemo(() => {
    const bad: string[] = [];
    if (assetRegistry && !isProbablyAddress(assetRegistry)) bad.push('AssetRegistry');
    if (fractionalToken && !isProbablyAddress(fractionalToken)) bad.push('FractionalToken');
    if (marketplace && !isProbablyAddress(marketplace)) bad.push('Marketplace');
    if (incomeDistributor && !isProbablyAddress(incomeDistributor)) bad.push('IncomeDistributor');
    if (htsAdapter && !isProbablyAddress(htsAdapter)) bad.push('HtsAdapter');
    return bad;
  }, [assetRegistry, fractionalToken, marketplace, incomeDistributor, htsAdapter]);

  const handleSave = () => {
    setMessage(null);
    if (invalids.length > 0) {
      setMessage({ type: 'error', text: `Invalid address format: ${invalids.join(', ')}` });
      return;
    }
    setAddresses({
      assetRegistry: assetRegistry.trim(),
      fractionalToken: fractionalToken.trim(),
      marketplace: marketplace.trim(),
      incomeDistributor: incomeDistributor.trim(),
      htsAdapter: htsAdapter.trim(),
    });
    setMessage({ type: 'success', text: 'Saved contract addresses.' });
  };

  const handleReset = () => {
    resetAddresses();
    setAssetRegistry('');
    setFractionalToken('');
    setMarketplace('');
    setIncomeDistributor('');
    setHtsAdapter('');
    setMessage({ type: 'success', text: 'Reset to defaults.' });
  };

  return (
    <div className="addr-card">
      <div className="addr-header">
        <h3 className="addr-title">Contract Addresses</h3>
        <button className="addr-reset" onClick={handleReset}>Reset</button>
      </div>

      {message && <div className={`addr-msg ${message.type}`}>{message.text}</div>}

      <div className="addr-grid">
        <div className="addr-field">
          <label className="addr-label">Admin (read-only)</label>
          <input className="addr-input" value={ADMIN_CONTRACT_ADDRESS} disabled />
        </div>

        <div className="addr-field">
          <label className="addr-label">AssetRegistry</label>
          <input
            className="addr-input"
            value={assetRegistry}
            onChange={(e) => setAssetRegistry(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">FractionalToken</label>
          <input
            className="addr-input"
            value={fractionalToken}
            onChange={(e) => setFractionalToken(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">Marketplace</label>
          <input
            className="addr-input"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">IncomeDistributor (Phase 2B)</label>
          <input
            className="addr-input"
            value={incomeDistributor}
            onChange={(e) => setIncomeDistributor(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="addr-field">
          <label className="addr-label">HtsAdapter (Phase 2C)</label>
          <input
            className="addr-input"
            value={htsAdapter}
            onChange={(e) => setHtsAdapter(e.target.value)}
            placeholder="0x..."
          />
        </div>
      </div>

      <div className="addr-actions">
        <button className="addr-save" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
};

export default ContractAddresses;


