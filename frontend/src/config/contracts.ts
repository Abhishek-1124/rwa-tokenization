// =============================================================================
// Contract Configuration
// =============================================================================
// This file contains the deployed contract addresses and ABIs.
// Update these values after deploying new contracts.
// =============================================================================

// -----------------------------------------------------------------------------
// ADMIN CONTRACT ADDRESS
// -----------------------------------------------------------------------------
// HOW TO UPDATE:
// 1. Deploy the contract: forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --private-key $ADMIN_PK
// 2. Find the Admin contract address in the deployment output
// 3. Update the address below
//
// CURRENT DEPLOYMENT:
// - Network: Hedera Testnet (Chain ID: 296)
// - Deployed by: 0x2Fb1Bc0E7A4118dFfF78Df69941D6F1b1971120f
// - Date: December 18, 2024 (Timestamp: 1766126380506)
// - Git Commit: f11ddf4
// -----------------------------------------------------------------------------
export const ADMIN_CONTRACT_ADDRESS = "0x7db0d1b6a97fbc9f011ca1f3736df89d2a7c3258";

// -----------------------------------------------------------------------------
// NETWORK CONFIGURATION
// -----------------------------------------------------------------------------
// Expected network for contract deployment
// All contracts are deployed on Hedera Testnet
// -----------------------------------------------------------------------------
export const EXPECTED_CHAIN_ID = 296; // Hedera Testnet

export const HEDERA_TESTNET_CONFIG = {
  chainId: '0x128', // 296 in hexadecimal
  chainName: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 18,
  },
  rpcUrls: ['https://testnet.hashio.io/api'],
  blockExplorerUrls: ['https://hashscan.io/testnet'],
};

// -----------------------------------------------------------------------------
// ADMIN CONTRACT ABI
// -----------------------------------------------------------------------------
// This ABI defines the functions available in the Admin smart contract.
// Only update this if you modify the Admin.sol contract.
//
// FUNCTIONS:
// - owner()                    : Get the contract owner address
// - isIssuer(address)          : Check if address is an issuer
// - isManager(address)         : Check if address is a manager
// - addIssuer(address)         : Add a new issuer (owner only)
// - removeIssuer(address)      : Remove an issuer (owner only)
// - addManager(address)        : Add a new manager (owner only)
// - removeManager(address)     : Remove a manager (owner only)
// - setManagerForToken()       : Assign manager to specific token (owner only)
// - isManagerForToken()        : Check if address manages specific token
// - pauseMarketplace(bool)     : Pause/resume marketplace (owner only)
// - transferOwnership(address) : Transfer contract ownership (owner only)
// -----------------------------------------------------------------------------
export const ADMIN_ABI = [
  // Read functions (no gas cost)
  "function owner() view returns (address)",
  "function isIssuer(address) view returns (bool)",
  "function isManager(address) view returns (bool)",
  "function managerForToken(address, uint256) view returns (bool)",
  "function marketplacePaused() view returns (bool)",
  "function isManagerForToken(address, uint256) view returns (bool)",

  // Write functions (requires gas)
  "function addIssuer(address)",
  "function removeIssuer(address)",
  "function addManager(address)",
  "function removeManager(address)",
  "function setManagerForToken(address, uint256, bool)",
  "function pauseMarketplace(bool)",
  "function transferOwnership(address)",

  // Events (for tracking state changes)
  "event IssuerAdded(address indexed issuer)",
  "event IssuerRemoved(address indexed issuer)",
  "event ManagerAdded(address indexed manager)",
  "event ManagerRemoved(address indexed manager)",
  "event TokenManagerSet(address indexed manager, uint256 indexed tokenId, bool status)",
  "event MarketplacePaused(bool paused)"
];

// =============================================================================
// Other contract addresses (AssetRegistry / FractionalToken / Marketplace)
// =============================================================================
// These are optional defaults. In the UI we allow overriding via localStorage so
// you can paste the latest deployed addresses without rebuilding the frontend.

export type ContractAddresses = {
  admin: string;
  assetRegistry: string;
  fractionalToken: string;
  marketplace: string;
  incomeDistributor: string;
  htsAdapter: string;
};

export const DEFAULT_CONTRACT_ADDRESSES: ContractAddresses = {
  admin: ADMIN_CONTRACT_ADDRESS,
  assetRegistry: "",
  fractionalToken: "",
  marketplace: "",
  incomeDistributor: "",
  htsAdapter: "",
};

// -----------------------------------------------------------------------------
// AssetRegistry ABI
// -----------------------------------------------------------------------------
export const ASSET_REGISTRY_ABI = [
  // Reads
  "function assetCount() view returns (uint256)",
  "function assetIPFS(uint256) view returns (string)",
  "function assetExists(uint256) view returns (bool)",
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)",
  // Writes
  "function createAsset(string metadataURI)",
  "function setAssetRoyalty(uint256 assetId, address receiver, uint96 royaltyBps)",
  // Events
  "event AssetCreated(uint256 indexed assetId, address indexed issuer, string metadataURI, address royaltyReceiver, uint96 royaltyBps)",
  "event AssetRoyaltyUpdated(uint256 indexed assetId, address indexed receiver, uint96 royaltyBps)",
];

// -----------------------------------------------------------------------------
// FractionalToken ABI
// -----------------------------------------------------------------------------
export const FRACTIONAL_TOKEN_ABI = [
  // Reads
  "function totalShares(uint256) view returns (uint256)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  // Writes
  "function mintFractions(uint256 assetId, uint256 shares, address owner)",
  "function setApprovalForAll(address operator, bool approved)",
  // Events
  "event FractionsMinted(uint256 indexed assetId, address indexed to, uint256 shares, address indexed caller)",
];

// -----------------------------------------------------------------------------
// Marketplace ABI
// -----------------------------------------------------------------------------
export const MARKETPLACE_ABI = [
  // Reads
  "function listingCount() view returns (uint256)",
  "function listings(uint256) view returns (address seller, uint256 assetId, uint256 amountRemaining, uint256 pricePerUnit, bool active)",
  "function offerCount() view returns (uint256)",
  "function offers(uint256) view returns (address bidder, uint256 listingId, uint256 amount, uint256 pricePerUnit, bool active)",
  // Writes
  "function list(uint256 assetId, uint256 amount, uint256 pricePerUnit) returns (uint256 listingId)",
  "function cancel(uint256 listingId)",
  "function updatePrice(uint256 listingId, uint256 newPricePerUnit)",
  "function buy(uint256 listingId, uint256 amount) payable",
  "function makeOffer(uint256 listingId, uint256 amount, uint256 pricePerUnit) payable returns (uint256 offerId)",
  "function cancelOffer(uint256 offerId)",
  "function acceptOffer(uint256 offerId)",
  // Events
  "event Listed(uint256 indexed listingId, address indexed seller, uint256 indexed assetId, uint256 amount, uint256 pricePerUnit)",
  "event ListingCancelled(uint256 indexed listingId)",
  "event ListingPriceUpdated(uint256 indexed listingId, uint256 oldPricePerUnit, uint256 newPricePerUnit)",
  "event Purchased(uint256 indexed listingId, address indexed buyer, uint256 indexed assetId, uint256 amount, uint256 totalPrice)",
  "event RoyaltyPaid(uint256 indexed assetId, address indexed receiver, uint256 amount)",
  "event OfferMade(uint256 indexed offerId, uint256 indexed listingId, address indexed bidder, uint256 amount, uint256 pricePerUnit)",
  "event OfferCancelled(uint256 indexed offerId)",
  "event OfferAccepted(uint256 indexed offerId, uint256 indexed listingId, address indexed seller, address bidder, uint256 amount, uint256 totalPrice)",
];

// -----------------------------------------------------------------------------
// IncomeDistributor ABI (Phase 2B)
// -----------------------------------------------------------------------------
export const INCOME_DISTRIBUTOR_ABI = [
  // Reads
  "function pending(address account, uint256 assetId) view returns (uint256)",
  // Writes
  "function depositIncome(uint256 assetId) payable",
  "function claim(uint256 assetId)",
  // Events
  "event IncomeDeposited(uint256 indexed assetId, address indexed depositor, uint256 amount, uint256 accIncomePerShare)",
  "event Claimed(uint256 indexed assetId, address indexed account, uint256 amount)",
];
