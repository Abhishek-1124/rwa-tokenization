# RWA Tokenization Platform

A Real-World Asset (RWA) tokenization platform built on Hedera Testnet. This platform allows tokenizing real-world assets as NFTs and creating fractional ownership through ERC1155 tokens.

## Project Structure

```
RAW-Tokenization/
├── src/                    # Smart contracts (Solidity)
│   ├── Admin.sol          # Role management & access control
│   ├── AssetRegistry.sol  # RWA asset registration (ERC721)
│   ├── FractionalToken.sol # Fractional tokens (ERC1155)
│   └── Marketplace.sol    # Trading fractional tokens
├── frontend/              # React frontend application
│   └── src/
│       ├── components/    # UI components
│       ├── config/        # Contract addresses & auth config
│       ├── context/       # React contexts (Web3, Auth)
│       ├── hooks/         # Custom hooks
│       └── pages/         # Page components
├── script/                # Deployment scripts
├── test/                  # Smart contract tests
└── .env                   # Environment configuration
```

## Smart Contracts

| Contract | Description |
|----------|-------------|
| **Admin.sol** | Manages roles (Owner, Issuer, Manager) and marketplace pause |
| **AssetRegistry.sol** | ERC721 contract for registering RWA assets |
| **FractionalToken.sol** | ERC1155 contract for fractional ownership |
| **Marketplace.sol** | Buy/sell fractional tokens |

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Owner** | Add/remove issuers, Add/remove managers, Pause marketplace, Transfer ownership |
| **Issuer** | Create new RWA assets in AssetRegistry |
| **Manager** | Manage specific tokens (for royalty distribution) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [MetaMask](https://metamask.io/) browser extension
- Hedera Testnet HBAR (get from [Hedera Faucet](https://portal.hedera.com/faucet))

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
