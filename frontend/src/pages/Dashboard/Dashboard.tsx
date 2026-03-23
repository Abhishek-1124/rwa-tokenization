import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { address, isConnected, disconnectWallet } = useWallet();
  const navigate = useNavigate();

  // Redirect to home if not connected
  React.useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnectWallet();
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-text">Flagship Designer</span>
          </div>
          <nav className="nav">
            <a href="/" className="nav-link">Home</a>
            <a href="/admin" className="nav-link">Admin</a>
            {isConnected && (
              <button onClick={handleDisconnect} className="disconnect-button">
                Disconnect
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="main-container">
          <h1 className="dashboard-title">User Dashboard</h1>

          {isConnected ? (
            <div className="dashboard-content">
              <div className="welcome-card">
                <h2 className="welcome-title">Welcome to Your Dashboard!</h2>
                <div className="user-info">
                  <div className="info-row">
                    <span className="info-label">Connected Wallet:</span>
                    <span className="info-value">{address}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Short Address:</span>
                    <span className="info-value">{truncateAddress(address!)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className="status-badge active">Active User</span>
                  </div>
                </div>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <h3>Your Assets</h3>
                  <p>View and manage your fractional ownership tokens</p>
                  <button className="feature-btn">View Assets</button>
                </div>

                <div className="feature-card">
                  <h3>Marketplace</h3>
                  <p>Browse and trade tokenized assets</p>
                  <button className="feature-btn" onClick={() => navigate('/marketplace')}>Browse Marketplace</button>
                </div>

                <div className="feature-card">
                  <h3>Transactions</h3>
                  <p>View your transaction history</p>
                  <button className="feature-btn">View History</button>
                </div>

                <div className="feature-card">
                  <h3>Settings</h3>
                  <p>Manage your account preferences</p>
                  <button className="feature-btn">Open Settings</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="not-connected">
              <p>Please connect your wallet to access the dashboard</p>
              <button onClick={() => navigate('/')} className="connect-prompt-btn">
                Go to Home
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-badge">
            <div className="badge-icon">⬢</div>
            <div className="badge-text">
              <span className="badge-label">WEB3 COMPATIBLE • HASHGRAPH NETWORK</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
