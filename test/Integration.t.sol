// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";
import "../src/AssetRegistry.sol";
import "../src/FractionalToken.sol";
import "../src/Marketplace.sol";

// Helper contract for receiving ERC1155 tokens
contract TokenReceiver {
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    receive() external payable {}
}

/**
 * @title Integration Tests
 * @notice End-to-end tests for the complete RWA tokenization flow
 */
contract IntegrationTest is Test {
    Admin admin;
    AssetRegistry registry;
    FractionalToken token;
    Marketplace marketplace;

    address owner;
    TokenReceiver issuerContract;
    TokenReceiver buyer1Contract;
    TokenReceiver buyer2Contract;
    address issuer;
    address manager = address(0x2);
    address buyer1;
    address buyer2;
    address nonParticipant = address(0x5);

    string constant IPFS_HASH = "ipfs://QmTestAssetHash123456789";

    function setUp() public {
        owner = address(this);

        // Deploy all contracts
        admin = new Admin();
        registry = new AssetRegistry(address(admin));
        token = new FractionalToken();
        marketplace = new Marketplace(address(token), address(admin));

        // Create contracts that can receive ERC1155 tokens
        issuerContract = new TokenReceiver();
        buyer1Contract = new TokenReceiver();
        buyer2Contract = new TokenReceiver();

        issuer = address(issuerContract);
        buyer1 = address(buyer1Contract);
        buyer2 = address(buyer2Contract);

        // Setup roles
        admin.addIssuer(issuer);
        admin.addManager(manager);

        // Fund buyers and issuer
        vm.deal(buyer1, 100 ether);
        vm.deal(buyer2, 100 ether);
        vm.deal(issuer, 100 ether);
    }

    // =========================================================================
    // Complete Flow Tests
    // =========================================================================

    function testCompleteAssetTokenizationFlow() public {
        // Step 1: Issuer creates an asset
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        assertEq(registry.assetCount(), 1);
        assertEq(registry.ownerOf(1), issuer);

        // Step 2: Fractionalize the asset
        token.mintFractions(1, 1000, issuer);
        assertEq(token.totalShares(1), 1000);
        assertEq(token.balanceOf(issuer, 1), 1000);

        // Step 3: Issuer approves marketplace
        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        // Step 4: Issuer lists tokens on marketplace
        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        // Step 5: Buyer purchases tokens
        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0);

        // Verify final state
        assertEq(token.balanceOf(issuer, 1), 500);
        assertEq(token.balanceOf(buyer1, 1), 500);
    }

    function testMultipleBuyersFlow() public {
        // Create and fractionalize asset
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        // Approve and list
        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 300, 1 ether);

        vm.prank(issuer);
        marketplace.list(1, 400, 2 ether);

        // Two buyers purchase
        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0);

        vm.prank(buyer2);
        marketplace.buy{value: 2 ether}(1);

        // Verify distribution
        assertEq(token.balanceOf(issuer, 1), 300); // 1000 - 300 - 400
        assertEq(token.balanceOf(buyer1, 1), 300);
        assertEq(token.balanceOf(buyer2, 1), 400);
    }

    function testSecondaryMarketTrading() public {
        // Initial tokenization
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        // Primary sale
        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0);

        // Secondary market: buyer1 sells to buyer2
        vm.prank(buyer1);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(buyer1);
        marketplace.list(1, 250, 0.5 ether);

        vm.prank(buyer2);
        marketplace.buy{value: 0.5 ether}(1);

        // Final distribution
        assertEq(token.balanceOf(issuer, 1), 500);
        assertEq(token.balanceOf(buyer1, 1), 250);
        assertEq(token.balanceOf(buyer2, 1), 250);
    }

    // =========================================================================
    // Access Control Integration Tests
    // =========================================================================

    function testOnlyIssuerCanCreateAssets() public {
        // Issuer can create
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);

        // Manager cannot create (only issuer role matters)
        vm.prank(manager);
        vm.expectRevert("Not issuer");
        registry.createAsset("ipfs://another-hash");

        // Non-participant cannot create
        vm.prank(nonParticipant);
        vm.expectRevert("Not issuer");
        registry.createAsset("ipfs://another-hash");
    }

    function testRoleChangesAffectAccess() public {
        // Add issuer and create asset
        address newIssuer = address(0x100);
        admin.addIssuer(newIssuer);

        vm.prank(newIssuer);
        registry.createAsset(IPFS_HASH);

        // Remove issuer role
        admin.removeIssuer(newIssuer);

        // Can no longer create
        vm.prank(newIssuer);
        vm.expectRevert("Not issuer");
        registry.createAsset("ipfs://hash2");
    }

    // =========================================================================
    // Marketplace Pause Integration Tests
    // =========================================================================

    function testMarketplacePauseBlocksTrading() public {
        // Setup
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        // Pause marketplace
        admin.pauseMarketplace(true);

        // Cannot buy when paused
        vm.prank(buyer1);
        vm.expectRevert("Marketplace paused");
        marketplace.buy{value: 1 ether}(0);

        // Resume marketplace
        admin.pauseMarketplace(false);

        // Can buy after resume
        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0);

        assertEq(token.balanceOf(buyer1, 1), 500);
    }

    function testCanListWhilePaused() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        // Pause marketplace
        admin.pauseMarketplace(true);

        // Can still list while paused
        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        (address seller, , , ) = marketplace.listings(0);
        assertEq(seller, issuer);
    }

    // =========================================================================
    // Ownership Transfer Integration Tests
    // =========================================================================

    function testOwnershipTransferAffectsAllContracts() public {
        address newOwner = address(0x200);

        // Transfer ownership
        admin.transferOwnership(newOwner);

        // Old owner cannot perform admin actions
        vm.expectRevert("Not admin");
        admin.addIssuer(address(0x300));

        // New owner can perform admin actions
        vm.prank(newOwner);
        admin.addIssuer(address(0x300));
        assertTrue(admin.isIssuer(address(0x300)));

        // New owner can pause marketplace
        vm.prank(newOwner);
        admin.pauseMarketplace(true);
        assertTrue(admin.marketplacePaused());
    }

    // =========================================================================
    // Token Manager Integration Tests
    // =========================================================================

    function testTokenSpecificManagerAccess() public {
        address tokenManager = address(0x400);

        // Create and fractionalize asset
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        // Set manager for specific token
        admin.setManagerForToken(tokenManager, 1, true);

        // Verify
        assertTrue(admin.isManagerForToken(tokenManager, 1));
        assertFalse(admin.isManagerForToken(tokenManager, 2));
    }

    function testGlobalManagerHasAccessToAllTokens() public {
        // Create multiple assets
        vm.startPrank(issuer);
        registry.createAsset(IPFS_HASH);
        registry.createAsset("ipfs://hash2");
        registry.createAsset("ipfs://hash3");
        vm.stopPrank();

        // Fractionalize all
        token.mintFractions(1, 1000, issuer);
        token.mintFractions(2, 1000, issuer);
        token.mintFractions(3, 1000, issuer);

        // Global manager has access to all
        assertTrue(admin.isManagerForToken(manager, 1));
        assertTrue(admin.isManagerForToken(manager, 2));
        assertTrue(admin.isManagerForToken(manager, 3));
    }

    // =========================================================================
    // Multi-Asset Portfolio Tests
    // =========================================================================

    function testCreateMultiAssetPortfolio() public {
        // Create multiple assets
        vm.startPrank(issuer);
        registry.createAsset("ipfs://property1");
        registry.createAsset("ipfs://property2");
        registry.createAsset("ipfs://property3");
        vm.stopPrank();

        assertEq(registry.assetCount(), 3);

        // Fractionalize each with different shares
        token.mintFractions(1, 100, issuer);
        token.mintFractions(2, 500, issuer);
        token.mintFractions(3, 1000, issuer);

        // Approve marketplace
        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        // List all on marketplace
        vm.startPrank(issuer);
        marketplace.list(1, 50, 0.5 ether);
        marketplace.list(2, 250, 1 ether);
        marketplace.list(3, 500, 2 ether);
        vm.stopPrank();

        // Buyer creates diversified portfolio
        vm.startPrank(buyer1);
        marketplace.buy{value: 0.5 ether}(0);
        marketplace.buy{value: 1 ether}(1);
        marketplace.buy{value: 2 ether}(2);
        vm.stopPrank();

        // Verify portfolio
        assertEq(token.balanceOf(buyer1, 1), 50);
        assertEq(token.balanceOf(buyer1, 2), 250);
        assertEq(token.balanceOf(buyer1, 3), 500);
    }

    // =========================================================================
    // Full Lifecycle Tests
    // =========================================================================

    function testFullAssetLifecycle() public {
        // Phase 1: Asset Creation
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);

        // Phase 2: Fractionalization
        token.mintFractions(1, 1000, issuer);

        // Phase 3: Primary Market Sale
        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 400, 1 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0);

        // Phase 4: More primary sales
        vm.prank(issuer);
        marketplace.list(1, 300, 1.5 ether);

        vm.prank(buyer2);
        marketplace.buy{value: 1.5 ether}(1);

        // Phase 5: Secondary market
        vm.prank(buyer1);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(buyer1);
        marketplace.list(1, 200, 0.8 ether);

        vm.prank(buyer2);
        marketplace.buy{value: 0.8 ether}(2);

        // Final state
        assertEq(token.balanceOf(issuer, 1), 300);
        assertEq(token.balanceOf(buyer1, 1), 200);
        assertEq(token.balanceOf(buyer2, 1), 500); // 300 + 200

        // Total shares preserved
        uint256 totalDistributed = token.balanceOf(issuer, 1) +
            token.balanceOf(buyer1, 1) +
            token.balanceOf(buyer2, 1);
        assertEq(totalDistributed, token.totalShares(1));
    }

    // =========================================================================
    // Edge Case Integration Tests
    // =========================================================================

    function testAssetTransferDoesNotAffectFractionalTokens() public {
        // Create and fractionalize
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        // Sell some fractions
        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0);

        // Transfer the NFT to buyer2
        vm.prank(issuer);
        registry.transferFrom(issuer, buyer2, 1);

        // Verify NFT ownership changed
        assertEq(registry.ownerOf(1), buyer2);

        // But fractional tokens remain with original holders
        assertEq(token.balanceOf(issuer, 1), 500);
        assertEq(token.balanceOf(buyer1, 1), 500);
        assertEq(token.balanceOf(buyer2, 1), 0);
    }

    function testMultipleIssuersIndependent() public {
        address issuer2 = address(0x500);
        admin.addIssuer(issuer2);

        // Each issuer creates their own asset
        vm.prank(issuer);
        registry.createAsset("ipfs://issuer1-asset");

        vm.prank(issuer2);
        registry.createAsset("ipfs://issuer2-asset");

        // Each owns their own NFT
        assertEq(registry.ownerOf(1), issuer);
        assertEq(registry.ownerOf(2), issuer2);

        // Fractionalize independently
        token.mintFractions(1, 1000, issuer);
        token.mintFractions(2, 2000, issuer2);

        // Each issuer owns their fractions
        assertEq(token.balanceOf(issuer, 1), 1000);
        assertEq(token.balanceOf(issuer2, 2), 2000);
    }

    // =========================================================================
    // Stress Tests
    // =========================================================================

    function testManyListingsAndPurchases() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 10000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        // Create 10 listings
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(issuer);
            marketplace.list(1, 100, 0.1 ether);
        }

        // Buy all listings
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(buyer1);
            marketplace.buy{value: 0.1 ether}(i);
        }

        assertEq(token.balanceOf(buyer1, 1), 1000);
        assertEq(token.balanceOf(issuer, 1), 9000);
    }

    function testManyAssetsFromSingleIssuer() public {
        vm.startPrank(issuer);
        for (uint256 i = 0; i < 10; i++) {
            registry.createAsset(string(abi.encodePacked("ipfs://asset-", vm.toString(i))));
        }
        vm.stopPrank();

        assertEq(registry.assetCount(), 10);
        assertEq(registry.balanceOf(issuer), 10);
    }
}
