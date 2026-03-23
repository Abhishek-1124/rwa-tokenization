// =============================================================================
// Admin Authentication Configuration
// =============================================================================
// This file contains the login credentials for the Admin Dashboard.
// Change these values to secure your admin panel.
//
// NOTE: This is a simple UI-level protection. The real security comes from:
// - Smart contract's onlyOwner modifier
// - Connected wallet must be the contract owner to execute transactions
//
// HOW TO CHANGE CREDENTIALS:
// 1. Update the username and password below
// 2. Share new credentials securely with your team
// 3. Restart the frontend server
// =============================================================================

export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};
