# Implementation Notes (short)

## Goal

Tokenize real-world assets (RWAs) using:

- **ERC-721**: one NFT per asset (property, art, carbon credit batch, etc.)
- **ERC-1155**: fractions/shares of that asset (e.g., 1 asset = 1000 shares)
- **Royalties**: paid automatically on marketplace buys
- **Off-chain docs**: represented by an IPFS-backed metadata URI stored on-chain

## Contracts

### `src/Admin.sol`

- Owner-managed roles:
  - `isIssuer(address)` for asset issuers
  - `isManager(address)` / `isManagerForToken(address, tokenId)` for token-specific managers
- Emergency control:
  - `marketplacePaused` toggled by owner

### `src/AssetRegistry.sol` (ERC-721 + ERC-2981 royalties)

- `createAsset(string metadataURI)` mints a new asset (issuer-only)
- Stores `assetIPFS[assetId]` (treat it as a metadata URI like `ipfs://<CID>`)
- Implements **ERC-2981**:
  - Default royalty: **5%** to the issuer
  - `setAssetRoyalty(assetId, receiver, royaltyBps)` for issuer/manager updates

### `src/FractionalToken.sol` (ERC-1155 fractions)

- Fractions are keyed by the same `assetId` as the ERC-721 tokenId
- `mintFractions(assetId, shares, owner)`:
  - One-time fractionalization (`totalShares[assetId] == 0`)
  - Requires the underlying asset exists
  - Only the asset owner or an Admin-approved manager can mint

### `src/Marketplace.sol`

- Listing model is **escrow-based** (Marketplace holds fractions)
- `list(assetId, amount, pricePerUnit)`:
  - Requires seller has approved Marketplace via `setApprovalForAll`
  - Transfers fractions into escrow
- `buy(listingId, amount)`:
  - Supports partial fills
  - Pays **ERC-2981 royalty** to `AssetRegistry.royaltyInfo(assetId, salePrice)`
  - Pays remaining proceeds to seller
- `cancel(listingId)` lets seller cancel and withdraw remaining escrowed fractions

## Frontend flow (Steps 3–12)

### Step 3 — Admin assigns issuer role

Use `/admin`:

- Connect owner wallet
- Add issuer address via **Issuer Management**

### Step 4 — Verify issuer permission (read)

Use `/admin` (check issuer) or `/issuer` (shows connected wallet issuer status).

### Step 5 — Issuer uploads asset metadata to IPFS

Not integrated to a specific provider in this repo yet.

Current expected input is a **pasted URI**, e.g.:

- `ipfs://<CID>` (recommended)
- `https://<gateway>/ipfs/<CID>`

### Steps 6–9 — Create asset, verify, mint fractions, verify balance

Use `/issuer`:

- Create asset with metadata URI (Step 6)
- Verify owner + URI (Step 7)
- Mint fractions (Step 8)
- Verify fraction balances (Step 9)

### Steps 10–12 — List, buy, verify ownership

Use `/marketplace`:

- Approve marketplace (Step 10 prerequisite)
- List fractions (Step 10)
- Buy fractions (Step 11)
- Check holdings + estimated value (Step 12)


