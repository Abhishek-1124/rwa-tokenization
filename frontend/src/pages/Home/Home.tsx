import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import './Home.css';

// MetaMask Fox SVG Component
const MetaMaskFox = () => (
  <svg width="80" height="80" viewBox="0 0 318 318" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M274.1 35.5L174.6 109.4L193.8 65.3L274.1 35.5Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M44.4 35.5L143.1 110.1L124.7 65.3L44.4 35.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M238.3 206.8L211.8 247.4L268.5 263.1L285 207.7L238.3 206.8Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M33.5 207.7L49.9 263.1L106.6 247.4L80.1 206.8L33.5 207.7Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M103.6 138.2L87.8 162.1L143.8 164.6L141.8 104.3L103.6 138.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M214.9 138.2L176.1 103.6L174.6 164.6L230.5 162.1L214.9 138.2Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M106.6 247.4L140.1 230.9L111.4 208.1L106.6 247.4Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M178.4 230.9L211.8 247.4L207 208.1L178.4 230.9Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M211.8 247.4L178.4 230.9L181.1 253.3L180.8 262.4L211.8 247.4Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M106.6 247.4L137.6 262.4L137.4 253.3L140.1 230.9L106.6 247.4Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M138.3 193.5L110.6 185.2L130.2 176.1L138.3 193.5Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M180.2 193.5L188.3 176.1L208 185.2L180.2 193.5Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M106.6 247.4L111.5 206.8L80.1 207.7L106.6 247.4Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M207 206.8L211.8 247.4L238.3 207.7L207 206.8Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M230.5 162.1L174.6 164.6L180.2 193.5L188.3 176.1L208 185.2L230.5 162.1Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M110.6 185.2L130.2 176.1L138.3 193.5L143.8 164.6L87.8 162.1L110.6 185.2Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M87.8 162.1L111.4 208.1L110.6 185.2L87.8 162.1Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M208 185.2L207 208.1L230.5 162.1L208 185.2Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M143.8 164.6L138.3 193.5L145.1 227.6L146.7 182.7L143.8 164.6Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M174.6 164.6L171.8 182.6L173.4 227.6L180.2 193.5L174.6 164.6Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M180.2 193.5L173.4 227.6L178.4 230.9L207 208.1L208 185.2L180.2 193.5Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M110.6 185.2L111.4 208.1L140.1 230.9L145.1 227.6L138.3 193.5L110.6 185.2Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M180.8 262.4L181.1 253.3L178.6 251.1H139.9L137.4 253.3L137.6 262.4L106.6 247.4L117.4 256.3L139.6 271.5H178.9L201.2 256.3L211.8 247.4L180.8 262.4Z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M178.4 230.9L173.4 227.6H145.1L140.1 230.9L137.4 253.3L139.9 251.1H178.6L181.1 253.3L178.4 230.9Z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M278.3 114.2L286.8 73.4L274.1 35.5L178.4 106.9L214.9 138.2L267.2 152.5L278.8 139.1L273.8 135.4L281.8 128.1L275.6 123.3L283.6 117.2L278.3 114.2Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M31.8 73.4L40.3 114.2L34.9 117.2L42.9 123.3L36.8 128.1L44.8 135.4L39.8 139.1L51.3 152.5L103.6 138.2L140.1 106.9L44.4 35.5L31.8 73.4Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M267.2 152.5L214.9 138.2L230.5 162.1L207 208.1L238.3 207.7H285L267.2 152.5Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M103.6 138.2L51.3 152.5L33.5 207.7H80.1L111.4 208.1L87.8 162.1L103.6 138.2Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M174.6 164.6L178.4 106.9L193.9 65.3H124.7L140.1 106.9L143.8 164.6L145 182.8L145.1 227.6H173.4L173.5 182.8L174.6 164.6Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Home: React.FC = () => {
  const { isConnected, address, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();
  const [hasMetaMask, setHasMetaMask] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');

  React.useEffect(() => {
    setHasMetaMask(typeof window.ethereum !== 'undefined');
  }, []);

  // Redirect to dashboard if already connected
  React.useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  const handleConnect = async () => {
    if (!hasMetaMask) {
      // Open MetaMask install page in a new tab
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement traditional login logic
    console.log('Login with:', email, password);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="home-page">
      {/* Decorative Images */}
      <img
        src="/src/assets/statue.png"
        alt="Statue of Liberty"
        className="decorative-image statue-image"
      />
      <img
        src="/src/assets/land.png"
        alt="Isometric Land"
        className="decorative-image land-image"
      />

      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-text">Flagship Designer</span>
          </div>
          <nav className="nav">
            <a href="/dashboard" className="nav-link dashboard-link">Dashboard</a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="main-container">
          {/* Hero Title */}
          <h1 className="hero-title">
            <span className="hero-primary">Access Fractional Ownership</span>
            <span className="hero-sub">on the HashGraph Network</span>
          </h1>

          {/* Connect Card */}
          <div className="connect-card">
            {!isConnected ? (
              <>
                <h2 className="card-title">Sign in to continue</h2>

                {/* Traditional Login Form */}
                <form className="login-form" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">ID / Email</label>
                    <input
                      type="text"
                      id="email"
                      className="form-input"
                      placeholder="Enter your email or ID"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      id="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="login-button">
                    Login
                  </button>
                </form>

                {/* Divider */}
                <div className="divider">
                  <span className="divider-line"></span>
                  <span className="divider-text">OR</span>
                  <span className="divider-line"></span>
                </div>

                {/* MetaMask Connect */}
                <button className="metamask-button" onClick={handleConnect}>
                  <MetaMaskFox />
                  <span className="metamask-text">
                    Connect with <strong>MetaMask</strong>
                  </span>
                </button>
              </>
            ) : (
              <>
                <p className="connect-subtitle">Wallet Connected</p>
                <div className="connect-content connected">
                  <div className="connect-info">
                    <h2 className="connect-title">Connected!</h2>
                    <p className="wallet-address">{truncateAddress(address!)}</p>
                    <button
                      className="disconnect-button"
                      onClick={disconnectWallet}
                    >
                      Disconnect
                    </button>
                  </div>
                  <div className="metamask-logo">
                    <MetaMaskFox />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

    </div>
  );
};

export default Home;
