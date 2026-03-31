# RWA // NEXUS - Real World Asset Tokenization Platform

[![Build Status](https://github.com/Abhishek-1124/RWATokenization/actions/workflows/ci.yml/badge.svg)](https://github.com/Abhishek-1124/RWATokenization/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.0-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

A comprehensive Real World Asset (RWA) tokenization platform built on Hedera Hashgraph, enabling fractional ownership of physical assets through blockchain technology.

## 🚀 Features

- **Asset Registry**: Register and manage real-world assets on-chain
- **Fractional Tokenization**: Create ERC-20 tokens representing asset fractions
- **Decentralized Marketplace**: Trade fractional tokens with on-chain transactions
- **Admin Dashboard**: Manage roles, transfer ownership, and oversee platform operations
- **Hedera Integration**: Deployed on Hedera Testnet for fast, secure transactions
- **MetaMask Integration**: Seamless wallet connectivity for users

## 🏗️ Architecture

### Smart Contracts (Solidity)
- **Admin.sol**: Platform administration and role management
- **AssetRegistry.sol**: Asset registration and metadata management
- **FractionalToken.sol**: ERC-20 implementation for asset fractions
- **Marketplace.sol**: On-chain trading functionality
- **HtsAdapter.sol**: Hedera Token Service integration
- **IncomeDistributor.sol**: Revenue distribution mechanisms

### Frontend (React + TypeScript)
- **Admin Dashboard**: Role management and ownership transfer
- **Marketplace**: Browse and trade fractional tokens
- **Issuer Portal**: Register new assets and create tokens
- **Wallet Integration**: MetaMask connection and transaction handling

## 🛠️ Tech Stack

- **Blockchain**: Hedera Hashgraph (Testnet)
- **Smart Contracts**: Solidity ^0.8.0, OpenZeppelin
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS Modules, Tailwind CSS
- **Testing**: Foundry (Solidity), Vitest (Frontend)
- **Deployment**: Foundry scripts

## 📋 Prerequisites

- Node.js 18+
- Foundry (for Solidity development)
- MetaMask wallet
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Abhishek-1124/RWATokenization.git
cd RWATokenization
```

### 2. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Smart Contracts
```bash
foundryup  # Install Foundry if not already installed
forge install
```

### 3. Environment Setup

Create `.env` file in frontend directory:
```env
VITE_HEDERA_NETWORK=testnet
VITE_HEDERA_RPC_URL=https://testnet.hashio.io/api
```

### 4. Deploy Contracts (Optional - Already deployed)
```bash
forge script script/Deploy.s.sol --rpc-url https://testnet.hashio.io/api --broadcast
```

### 5. Start Development Server
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 🔧 Configuration

### Contract Addresses

Update `frontend/src/config/contracts.ts` with deployed contract addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  Admin: "0x...",
  AssetRegistry: "0x...",
  FractionalToken: "0x...",
  Marketplace: "0x...",
  // ... other contracts
};
```

## 🧪 Testing

### Smart Contracts
```bash
forge test
```

### Frontend
```bash
cd frontend
npm test
```

## 📚 Usage Guide

### For Asset Issuers
1. Connect MetaMask wallet
2. Register asset in the Issuer portal
3. Create fractional tokens
4. List tokens on marketplace

### For Investors
1. Connect MetaMask wallet
2. Browse marketplace
3. Purchase fractional tokens
4. Track asset performance

### For Admins
1. Access admin dashboard
2. Manage user roles
3. Transfer ownership if needed
4. Monitor platform activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions or support:
- Open an issue on GitHub
- Check the [documentation](./docs/) folder
- Review the [hackathon report](./docs/HACKATHON_REPORT.md)

## 🙏 Acknowledgments

- Built for hackathons and real-world asset tokenization
- Powered by Hedera Hashgraph
- Inspired by decentralized finance innovations

---

**Demo**: [Live Application](https://your-deployed-url.com)  
**Contracts**: [Hedera Explorer](https://hashscan.io/testnet)

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd RAW-Tokenization

# Install frontend dependencies
cd frontend && npm install
cd ..
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your wallet keys:

```bash
cp .env.example .env
```

Edit `.env` file:
```env
# Your wallet private key (from MetaMask)
ADMIN_PK="0x<your-private-key>"
ADMIN_ADDR="0x<your-wallet-address>"
```

**How to get your private key from MetaMask:**
1. Open MetaMask extension
2. Click three dots (⋮) next to account name
3. Click "Account details"
4. Click "Show private key"
5. Enter your MetaMask password
6. Copy the private key

### 3. Deploy Smart Contracts

```bash
# Build contracts
forge build

# Run tests
forge test

# Deploy to Hedera Testnet
source .env
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $ADMIN_PK
```

After deployment, note the **Admin contract address** from the output.

### 4. Update Frontend Configuration

Update the contract address in `frontend/src/config/contracts.ts`:

```typescript
export const ADMIN_CONTRACT_ADDRESS = "0x<deployed-admin-address>";
```

### 5. Run Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Admin Dashboard

Access the admin panel at: http://localhost:5173/admin

### Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

To change credentials, edit `frontend/src/config/auth.ts`

### Features
- **Wallet Status** - Connect/disconnect MetaMask wallet
- **Marketplace Control** - Pause/resume marketplace trading
- **Issuer Management** - Add/check/remove issuers
- **Manager Management** - Add/check/remove managers
- **Token-Specific Manager** - Assign managers to specific tokens

### Important Notes
- Only the **contract owner** (deployer wallet) can manage roles
- Connect with the same wallet used to deploy the contract
- The wallet address must match the one that deployed the Admin contract

## Configuration Files

### `.env` - Environment Variables

```env
# Network
RPC_URL=https://testnet.hashio.io/api
CHAIN_ID=296

# Admin wallet (CONTRACT OWNER)
ADMIN_PK="0x<private-key>"
ADMIN_ADDR="0x<address>"

# Issuer wallet
ISSUER_PK="0x<private-key>"
ISSUER_ADDR="0x<address>"

# User wallet
USER_PK="0x<private-key>"
USER_ADDR="0x<address>"
```

### `frontend/src/config/contracts.ts` - Contract Configuration

```typescript
// Update this after deploying contracts
export const ADMIN_CONTRACT_ADDRESS = "0x<your-deployed-address>";
```

### `frontend/src/config/auth.ts` - Admin Login Credentials

```typescript
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'  // Change this for security
};
```

## MetaMask Setup for Hedera Testnet

1. Open MetaMask
2. Click network dropdown → "Add network"
3. Click "Add a network manually"
4. Enter:
   - **Network Name:** Hedera Testnet
   - **RPC URL:** https://testnet.hashio.io/api
   - **Chain ID:** 296
   - **Currency Symbol:** HBAR
   - **Block Explorer:** https://hashscan.io/testnet
5. Click "Save"

## Common Issues

### "Only the owner can add/remove issuers"
- You're connected with a different wallet than the contract owner
- Connect with the wallet that deployed the contract

### Transaction fails
- Ensure you have enough HBAR for gas fees
- Get testnet HBAR from [Hedera Faucet](https://portal.hedera.com/faucet)

### Contract address is zero
- Update `ADMIN_CONTRACT_ADDRESS` in `frontend/src/config/contracts.ts`
- Use the address from deployment output

## Team Workflow

### For New Team Members

1. Get the deployed contract addresses from the team
2. Update `frontend/src/config/contracts.ts` with contract addresses
3. Create your own `.env` file with your wallet keys
4. Import the Admin wallet into MetaMask if you need owner access

### Redeploying Contracts

If you redeploy contracts:
1. Run deployment script
2. Update `ADMIN_CONTRACT_ADDRESS` in `frontend/src/config/contracts.ts`
3. Notify team members to update their config

## Foundry Commands

```bash
# Build contracts
forge build

# Run tests
forge test

# Run tests with verbosity
forge test -vvv

# Format code
forge fmt

# Gas snapshots
forge snapshot
```

## License

MIT
