import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { useAdminContract } from '../../hooks/useAdminContract';
import { useAssetRegistryContract } from '../../hooks/useAssetRegistryContract';
import { useFractionalTokenContract } from '../../hooks/useFractionalTokenContract';
import ContractAddresses from '../../components/ContractAddresses/ContractAddresses';
import { pinFileToIPFS, pinJSONToIPFS } from '../../utils/pinata';
import { useContractAddresses } from '../../hooks/useContractAddresses';
import { useHtsAdapterContract } from '../../hooks/useHtsAdapterContract';
import './Issuer.css';

const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const Issuer: React.FC = () => {
  const { address, isConnected, connectWallet } = useWallet();
  const { checkIsIssuer } = useAdminContract();
  const assetRegistry = useAssetRegistryContract();
  const fractional = useFractionalTokenContract();
  const { addresses } = useContractAddresses();
  const hts = useHtsAdapterContract();

  const issuerCheckRef = useRef(false);

  const [isIssuer, setIsIssuer] = useState<boolean>(false);
  const [issuerCheckError, setIssuerCheckError] = useState<string | null>(null);

  const [metadataURI, setMetadataURI] = useState('ipfs://');
  const [createResult, setCreateResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdAssetId, setCreatedAssetId] = useState<number | null>(null);

  // IPFS upload (Phase 2A)
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetCategory, setAssetCategory] = useState<'property' | 'art' | 'carbon' | 'agri'>('property');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<{ status: 'idle' | 'uploading' | 'done'; text?: string }>({ status: 'idle' });
  const [docIpfs, setDocIpfs] = useState<string | null>(null);
  const [metaIpfs, setMetaIpfs] = useState<string | null>(null);

  const [verifyAssetId, setVerifyAssetId] = useState<string>('1');
  const [verifyResult, setVerifyResult] = useState<{ owner: string; uri: string } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [fractionAssetId, setFractionAssetId] = useState<string>('1');
  const [shares, setShares] = useState<string>('1000');
  const [recipient, setRecipient] = useState<string>('');
  const [fractionStatus, setFractionStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fractionInfo, setFractionInfo] = useState<{ totalShares: bigint; balance: bigint } | null>(null);

  // HTS (Phase 2C)
  const [htsTokenAddress, setHtsTokenAddress] = useState('');
  const [htsRecipient, setHtsRecipient] = useState('');
  const [htsAmount, setHtsAmount] = useState('1');
  const [htsMsg, setHtsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const effectiveRecipient = useMemo(() => recipient.trim() || address || '', [recipient, address]);
  const canUseHts = Boolean(addresses.htsAdapter);

  useEffect(() => {
    const run = async () => {
      if (!isConnected || !address || issuerCheckRef.current) return;
      issuerCheckRef.current = true;
      setIssuerCheckError(null);
      try {
        const ok = await checkIsIssuer(address);
        setIsIssuer(ok);
      } catch (e) {
        setIssuerCheckError(e instanceof Error ? e.message : 'Failed to check issuer status');
      } finally {
        issuerCheckRef.current = false;
      }
    };
    const timer = setTimeout(run, 100);
    return () => clearTimeout(timer);
  }, [isConnected, address, checkIsIssuer]);

  useEffect(() => {
    // default recipient to connected wallet for convenience
    if (address && !recipient) setRecipient(address);
  }, [address]);

  const handleCreateAsset = useCallback(async () => {
    setCreateResult(null);
    if (!isConnected) return;
    try {
      await assetRegistry.createAsset(metadataURI.trim());
      const count = await assetRegistry.getAssetCount();
      const id = Number(count);
      setCreatedAssetId(id);
      setCreateResult({ type: 'success', text: `Asset created: #${id}` });
    } catch (e) {
      setCreateResult({ type: 'error', text: e instanceof Error ? e.message : 'Failed to create asset' });
    }
  }, [isConnected, assetRegistry, metadataURI]);

  const handleUploadToIPFS = useCallback(async () => {
    setCreateResult(null);
    setUploadState({ status: 'uploading', text: 'Uploading document to IPFS…' });
    try {
      if (!docFile) throw new Error('Select a PDF/document first');
      const doc = await pinFileToIPFS(docFile, docFile.name);
      setDocIpfs(doc.ipfsUri);

      setUploadState({ status: 'uploading', text: 'Uploading metadata JSON to IPFS…' });
      const metadata = {
        name: assetName || 'RWA Asset',
        description: assetDescription || 'Tokenized real-world asset',
        category: assetCategory,
        document: {
          uri: doc.ipfsUri,
          gateway: doc.gatewayUrl,
          mimeType: docFile.type || 'application/pdf',
          filename: docFile.name,
        },
        createdAt: new Date().toISOString(),
      };
      const meta = await pinJSONToIPFS(metadata, `${metadata.name}-metadata`);
      setMetaIpfs(meta.ipfsUri);

      // Set the on-chain metadata URI to the metadata JSON
      setMetadataURI(meta.ipfsUri);
      setUploadState({ status: 'done', text: 'Uploaded. Metadata URI is ready to mint on-chain.' });
    } catch (e) {
      setUploadState({ status: 'idle' });
      setCreateResult({ type: 'error', text: e instanceof Error ? e.message : 'IPFS upload failed' });
    }
  }, [docFile, assetName, assetDescription, assetCategory]);

  const handleVerify = useCallback(async () => {
    setVerifyError(null);
    setVerifyResult(null);
    try {
      const id = Number(verifyAssetId);
      const exists = await assetRegistry.assetExists(id);
      if (!exists) {
        setVerifyError('Asset does not exist');
        return;
      }
      const owner = await assetRegistry.getOwnerOf(id);
      const uri = await assetRegistry.getAssetURI(id);
      setVerifyResult({ owner, uri });
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : 'Failed to verify asset');
    }
  }, [verifyAssetId, assetRegistry]);

  const refreshFractions = useCallback(async (id: number) => {
    if (!address) return;
    const [t, b] = await Promise.all([
      fractional.totalShares(id),
      fractional.balanceOf(address, id),
    ]);
    setFractionInfo({ totalShares: t, balance: b });
  }, [address, fractional]);

  const handleMintFractions = useCallback(async () => {
    setFractionStatus(null);
    try {
      const id = Number(fractionAssetId);
      const s = Number(shares);
      const to = effectiveRecipient;
      await fractional.mintFractions(id, s, to);
      setFractionStatus({ type: 'success', text: `Minted ${s} fractions for asset #${id}` });
      await refreshFractions(id);
    } catch (e) {
      setFractionStatus({ type: 'error', text: e instanceof Error ? e.message : 'Failed to mint fractions' });
    }
  }, [fractionAssetId, shares, effectiveRecipient, fractional, refreshFractions]);

  return (
    <div className="issuer-page">
      <header className="issuer-header">
        <div className="container issuer-header-inner">
          <span className="issuer-logo">Flagship</span>
          <nav className="issuer-nav">
            <Link to="/" className="issuer-link">Home</Link>
            <Link to="/marketplace" className="issuer-link">Marketplace</Link>
            <Link to="/admin" className="issuer-link">Admin</Link>
          </nav>
        </div>
      </header>

      <main className="container issuer-main">
        <h1 className="issuer-title">Issuer Console</h1>

        <div className="issuer-card">
          <h3 className="issuer-card-title">Wallet & Role</h3>
          {!isConnected ? (
            <button className="btn-primary" onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <>
              <div className="issuer-meta">
                <div><span className="issuer-label">Connected:</span> {truncate(address!)}</div>
                <div><span className="issuer-label">Issuer:</span> {isIssuer ? 'Yes' : 'No'}</div>
              </div>
              {issuerCheckError && <div className="issuer-error">{issuerCheckError}</div>}
              {!isIssuer && <div className="issuer-warning">You must be an issuer (Admin assigns issuer role) to create assets.</div>}
            </>
          )}
        </div>

        <ContractAddresses />

        <div className="issuer-grid">
          <div className="issuer-card">
            <h3 className="issuer-card-title">Step 5 (Phase 2A) — Upload Docs + Metadata to IPFS</h3>
            <p className="issuer-help">
              Upload a PDF/document and generate metadata JSON. Requires <code>VITE_PINATA_JWT</code> in your frontend env.
            </p>

            <label className="issuer-label">Category</label>
            <select
              className="issuer-input"
              value={assetCategory}
              onChange={(e) => setAssetCategory(e.target.value as typeof assetCategory)}
            >
              <option value="property">Property</option>
              <option value="art">Art</option>
              <option value="carbon">Carbon credits</option>
              <option value="agri">Agricultural produce</option>
            </select>

            <label className="issuer-label">Asset name</label>
            <input className="issuer-input" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="e.g., Plot #42 Deed" />

            <label className="issuer-label">Description</label>
            <input className="issuer-input" value={assetDescription} onChange={(e) => setAssetDescription(e.target.value)} placeholder="Short description" />

            <label className="issuer-label">Document (PDF)</label>
            <input
              className="issuer-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />

            <button className="issuer-btn" onClick={handleUploadToIPFS} disabled={!docFile || uploadState.status === 'uploading'}>
              {uploadState.status === 'uploading' ? (uploadState.text || 'Uploading…') : 'Upload to IPFS'}
            </button>

            {docIpfs && (
              <div className="issuer-result">
                <div><span className="issuer-label">Doc URI:</span> <code>{docIpfs}</code></div>
              </div>
            )}
            {metaIpfs && (
              <div className="issuer-result">
                <div><span className="issuer-label">Metadata URI:</span> <code>{metaIpfs}</code></div>
              </div>
            )}
          </div>

          <div className="issuer-card">
            <h3 className="issuer-card-title">Step 6 — Create Asset On-Chain</h3>
            <p className="issuer-help">Paste your metadata URI/CID (Step 5). Example: <code>ipfs://&lt;CID&gt;</code></p>

            {createResult && <div className={`issuer-msg ${createResult.type}`}>{createResult.text}</div>}

            <label className="issuer-label">Metadata URI</label>
            <input
              className="issuer-input"
              value={metadataURI}
              onChange={(e) => setMetadataURI(e.target.value)}
              placeholder="ipfs://..."
              disabled={!isConnected || !isIssuer}
            />
            <button className="issuer-btn" onClick={handleCreateAsset} disabled={!isConnected || !isIssuer || !metadataURI.trim()}>
              Create Asset
            </button>
            {createdAssetId && (
              <div className="issuer-note">Created assetId: <strong>#{createdAssetId}</strong></div>
            )}
          </div>

          <div className="issuer-card">
            <h3 className="issuer-card-title">Step 7 — Verify Asset Data</h3>
            {verifyError && <div className="issuer-error">{verifyError}</div>}
            {verifyResult && (
              <div className="issuer-result">
                <div><span className="issuer-label">Owner:</span> {truncate(verifyResult.owner)}</div>
                <div><span className="issuer-label">URI:</span> <code>{verifyResult.uri || '(empty)'}</code></div>
              </div>
            )}
            <label className="issuer-label">Asset ID</label>
            <input className="issuer-input" value={verifyAssetId} onChange={(e) => setVerifyAssetId(e.target.value)} />
            <button className="issuer-btn secondary" onClick={handleVerify} disabled={!verifyAssetId.trim()}>
              Verify
            </button>
          </div>

          <div className="issuer-card">
            <h3 className="issuer-card-title">Step 8 — Mint Fractions (ERC-1155)</h3>
            {fractionStatus && <div className={`issuer-msg ${fractionStatus.type}`}>{fractionStatus.text}</div>}

            <label className="issuer-label">Asset ID</label>
            <input className="issuer-input" value={fractionAssetId} onChange={(e) => setFractionAssetId(e.target.value)} />

            <label className="issuer-label">Shares</label>
            <input className="issuer-input" value={shares} onChange={(e) => setShares(e.target.value)} />

            <label className="issuer-label">Recipient</label>
            <input className="issuer-input" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." />

            <button
              className="issuer-btn"
              onClick={handleMintFractions}
              disabled={!isConnected || !fractionAssetId.trim() || !shares.trim() || !effectiveRecipient}
            >
              Mint Fractions
            </button>

            <button
              className="issuer-btn secondary"
              onClick={() => refreshFractions(Number(fractionAssetId))}
              disabled={!isConnected || !fractionAssetId.trim() || !address}
            >
              Step 9 — Verify Fraction Balance
            </button>

            {fractionInfo && (
              <div className="issuer-result">
                <div><span className="issuer-label">Total Shares:</span> {fractionInfo.totalShares.toString()}</div>
                <div><span className="issuer-label">Your Balance:</span> {fractionInfo.balance.toString()}</div>
              </div>
            )}
          </div>

          <div className="issuer-card">
            <h3 className="issuer-card-title">Phase 2C — HTS Mint (optional)</h3>
            <p className="issuer-help">
              Optional Hedera Token Service path via `HtsAdapter`. Requires deployed adapter address and a Hedera HTS token
              configured with this contract as treasury/supply key (Hedera-specific setup).
            </p>

            {!canUseHts ? (
              <div className="issuer-warning">Set the HtsAdapter address in the Contract Addresses panel to enable this.</div>
            ) : (
              <>
                {htsMsg && <div className={`issuer-msg ${htsMsg.type}`}>{htsMsg.text}</div>}

                <label className="issuer-label">HTS Token (EVM address)</label>
                <input className="issuer-input" value={htsTokenAddress} onChange={(e) => setHtsTokenAddress(e.target.value)} placeholder="0x..." />

                <label className="issuer-label">Recipient</label>
                <input className="issuer-input" value={htsRecipient} onChange={(e) => setHtsRecipient(e.target.value)} placeholder="0x..." />

                <label className="issuer-label">Amount (uint64)</label>
                <input className="issuer-input" value={htsAmount} onChange={(e) => setHtsAmount(e.target.value)} />

                <button
                  className="issuer-btn"
                  onClick={async () => {
                    setHtsMsg(null);
                    try {
                      await hts.mintAndTransferFungible(htsTokenAddress, htsRecipient, BigInt(htsAmount));
                      setHtsMsg({ type: 'success', text: 'HTS mint+transfer submitted.' });
                    } catch (e) {
                      setHtsMsg({ type: 'error', text: e instanceof Error ? e.message : 'HTS mint failed' });
                    }
                  }}
                  disabled={!isConnected || !isIssuer || !htsTokenAddress || !htsRecipient || !htsAmount}
                >
                  Mint & Transfer via HTS
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Issuer;


