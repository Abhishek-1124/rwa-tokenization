import React, { useState, useEffect } from 'react';
import { useWallet } from '../../context/Web3Context';
import { useAuth } from '../../context/AuthContext';
import { useAdminContract } from '../../hooks/useAdminContract';
import { EXPECTED_CHAIN_ID } from '../../config/contracts';
import IssuerManagement from '../RoleManagement/IssuerManagement';
import ManagerManagement from '../RoleManagement/ManagerManagement';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { address, isConnected, chainId, connectWallet, disconnectWallet, switchToHederaTestnet } = useWallet();
  const { logout } = useAuth();
  const { getOwner, getMarketplacePaused, pauseMarketplace } = useAdminContract();

  const [owner, setOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [marketplacePaused, setMarketplacePaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Fetch contract data
  useEffect(() => {
    const fetchData = async () => {
      if (isConnected) {
        const ownerAddress = await getOwner();
        console.log('Contract Owner:', ownerAddress);
        console.log('Connected Address:', address);
        console.log('Addresses match:', address?.toLowerCase() === ownerAddress?.toLowerCase());
        setOwner(ownerAddress);
        setIsOwner(address?.toLowerCase() === ownerAddress?.toLowerCase());

        const paused = await getMarketplacePaused();
        setMarketplacePaused(paused);
      }
    };
    fetchData();
  }, [isConnected, address]);

  const handlePauseToggle = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await pauseMarketplace(!marketplacePaused);
      setMarketplacePaused(!marketplacePaused);
      setStatusMessage({
        type: 'success',
        text: `Marketplace ${!marketplacePaused ? 'paused' : 'resumed'} successfully`
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to update marketplace status'
      });
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    logout();
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="dashboard-page">
      <header className="header">
        <div className="header-container">
          <span className="logo-text">Flagship</span>
          <div className="header-actions">
            <a href="/" className="nav-link">Home</a>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <h1 className="dashboard-title">Admin Dashboard</h1>

          {/* Network Warning Banner */}
          {isConnected && chainId && chainId !== EXPECTED_CHAIN_ID && (
            <div className="status-message error" style={{
              padding: '15px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              color: '#856404'
            }}>
              <span>
                ⚠️ Wrong Network Detected! You're on Chain ID {chainId}. Please switch to Hedera Testnet (Chain ID: {EXPECTED_CHAIN_ID})
              </span>
              <button
                onClick={switchToHederaTestnet}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffc107',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#000'
                }}
              >
                Switch Network
              </button>
            </div>
          )}

          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          {/* Top Cards Row */}
          <div className="cards-row">
            {/* Wallet Status Card */}
            <div className="dashboard-card">
              <h3 className="card-title">Wallet Status</h3>
              {isConnected ? (
                <div className="wallet-info">
                  <div className="wallet-address">{truncateAddress(address!)}</div>
                  <div className="role-badges">
                    {isOwner && <span className="badge badge-owner">Owner</span>}
                  </div>
                  <button onClick={disconnectWallet} className="disconnect-btn">
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="wallet-not-connected">
                  <p>Connect your wallet to manage roles</p>
                  <button onClick={connectWallet} className="connect-btn">
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>

            {/* Marketplace Control Card */}
            <div className="dashboard-card">
              <h3 className="card-title">Marketplace Control</h3>
              <div className="marketplace-status">
                <div className="status-indicator">
                  <span className={`status-dot ${marketplacePaused ? 'paused' : 'active'}`}></span>
                  <span className="status-text">
                    {marketplacePaused ? 'Paused' : 'Active'}
                  </span>
                </div>
                <button
                  onClick={handlePauseToggle}
                  className={`toggle-btn ${marketplacePaused ? 'resume' : 'pause'}`}
                  disabled={!isConnected || !isOwner || isLoading}
                >
                  {isLoading ? 'Processing...' : (marketplacePaused ? 'Resume' : 'Pause')}
                </button>
              </div>
              {!isOwner && isConnected && (
                <p className="warning-text">Only the owner can control the marketplace</p>
              )}
            </div>
          </div>

          {/* Contract Info */}
          {owner && (
            <div className="contract-info">
              <span className="info-label">Contract Owner:</span>
              <span className="info-value">{truncateAddress(owner)}</span>
            </div>
          )}

          {/* Role Management Section */}
          {isConnected ? (
            <div className="role-management-section">
              <IssuerManagement isOwner={isOwner} />
              <ManagerManagement isOwner={isOwner} />

              {/* Token-Specific Manager Card */}
              <TokenManagerCard isOwner={isOwner} />
            </div>
          ) : (
            <div className="connect-prompt">
              <p>Please connect your wallet to manage roles</p>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-badge">
            <div className="badge-icon">W3</div>
            <div className="badge-text">
              <span className="badge-label">Powered by</span>
              <span className="badge-name">Web3 Technology</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Token Manager Card Component
const TokenManagerCard: React.FC<{ isOwner: boolean }> = ({ isOwner }) => {
  const { setManagerForToken, checkIsManagerForToken } = useAdminContract();
  const [managerAddress, setManagerAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleAssign = async () => {
    if (!managerAddress || !tokenId) return;
    setIsLoading(true);
    setMessage(null);
    try {
      await setManagerForToken(managerAddress, parseInt(tokenId), true);
      setMessage({ type: 'success', text: 'Manager assigned to token successfully' });
      setManagerAddress('');
      setTokenId('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign manager to token' });
    }
    setIsLoading(false);
  };

  const handleRemove = async () => {
    if (!managerAddress || !tokenId) return;
    setIsLoading(true);
    setMessage(null);
    try {
      await setManagerForToken(managerAddress, parseInt(tokenId), false);
      setMessage({ type: 'success', text: 'Manager removed from token successfully' });
      setManagerAddress('');
      setTokenId('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove manager from token' });
    }
    setIsLoading(false);
  };

  const handleCheck = async () => {
    if (!managerAddress || !tokenId) return;
    setIsLoading(true);
    setCheckResult(null);
    try {
      const result = await checkIsManagerForToken(managerAddress, parseInt(tokenId));
      setCheckResult(result);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to check manager status' });
    }
    setIsLoading(false);
  };

  return (
    <div className="dashboard-card full-width">
      <h3 className="card-title">Token-Specific Manager</h3>

      {message && (
        <div className={`card-message ${message.type}`}>{message.text}</div>
      )}

      <div className="token-manager-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Manager Address</label>
            <input
              type="text"
              value={managerAddress}
              onChange={(e) => setManagerAddress(e.target.value)}
              placeholder="0x..."
              className="form-input"
              disabled={isLoading}
            />
          </div>
          <div className="form-group token-id-group">
            <label className="form-label">Token ID</label>
            <input
              type="number"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="0"
              className="form-input"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="button-row">
          <button
            onClick={handleAssign}
            className="action-btn assign"
            disabled={!isOwner || isLoading || !managerAddress || !tokenId}
          >
            Assign
          </button>
          <button
            onClick={handleRemove}
            className="action-btn remove"
            disabled={!isOwner || isLoading || !managerAddress || !tokenId}
          >
            Remove
          </button>
          <button
            onClick={handleCheck}
            className="action-btn check"
            disabled={isLoading || !managerAddress || !tokenId}
          >
            Check
          </button>
        </div>

        {checkResult !== null && (
          <div className={`check-result ${checkResult ? 'is-manager' : 'not-manager'}`}>
            {checkResult ? 'Is manager for this token' : 'Not a manager for this token'}
          </div>
        )}
      </div>

      {!isOwner && (
        <p className="warning-text">Only the owner can assign/remove token managers</p>
      )}
    </div>
  );
};

export default AdminDashboard;
