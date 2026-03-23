# Dev Guide (short)

## Prereqs

- Foundry installed (`forge`, `cast`)
- Node.js + npm
- MetaMask configured for Hedera EVM Testnet (chainId `296`)

## Contracts (Foundry)

### Build & test locally

```bash
cd /Users/govindmehta/Raw-takenization/RAW-Tokenization
forge build
forge test
```

### Deploy to Hedera testnet

This repo uses Foundry scripts:

```bash
cd /Users/govindmehta/Raw-takenization/RAW-Tokenization
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $ADMIN_PK
```

The deploy script creates (in order):

- `Admin`
- `AssetRegistry(admin)`
- `FractionalToken(admin, assetRegistry)`
- `Marketplace(fractionalToken, admin, assetRegistry)`

After deploy, read the addresses from the broadcast output (or `broadcast/Deploy.s.sol/296/run-latest.json`).

## Frontend

### Install & run

```bash
cd /Users/govindmehta/Raw-takenization/RAW-Tokenization/frontend
npm ci
npm run dev
```

### IPFS (Pinata) env vars (Phase 2A)

To enable the “Upload to IPFS” button on `/issuer`, set:

- `VITE_PINATA_JWT`: Pinata JWT with permission to pin files and JSON

Example:

```bash
export VITE_PINATA_JWT="YOUR_PINATA_JWT"
```

### Contract addresses

- **Admin** address is currently hardcoded in `frontend/src/config/contracts.ts` as `ADMIN_CONTRACT_ADDRESS`.
- **AssetRegistry / FractionalToken / Marketplace** addresses are set in the UI:
  - Open `/issuer` or `/marketplace`
  - Use the **Contract Addresses** card to paste addresses
  - They are saved in browser `localStorage` (`rwa.contract.addresses.v1`)


