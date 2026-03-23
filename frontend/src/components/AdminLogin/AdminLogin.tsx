import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminLogin.css';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = login(username, password);

    if (success) {
      onLoginSuccess();
    } else {
      setError('Invalid username or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <header className="header">
        <div className="header-container">
          <span className="logo-text">Flagship</span>
          <a href="/" className="nav-link">Back to Home</a>
        </div>
      </header>

      <main className="main">
        <div className="main-container">
          <h1 className="hero-title">Admin Portal</h1>

          <div className="login-card">
            <div className="login-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 10C10.34 10 9 8.66 9 7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7C15 8.66 13.66 10 12 10Z" fill="currentColor"/>
                <path d="M12 14C7.58 14 4 15.79 4 18V20H20V18C20 15.79 16.42 14 12 14Z" fill="currentColor"/>
              </svg>
            </div>

            <h2 className="login-title">Admin Login</h2>
            <p className="login-subtitle">Enter your credentials to access the admin dashboard</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  placeholder="Enter username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter password"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
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

export default AdminLogin;
