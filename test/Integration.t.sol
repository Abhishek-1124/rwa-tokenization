pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";
import "../src/AssetRegistry.sol";
import "../src/FractionalToken.sol";
import "../src/Marketplace.sol";

contract TokenReceiver {
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    receive() external payable {}
}

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

        admin = new Admin();
        registry = new AssetRegistry(address(admin));
        token = new FractionalToken(address(admin), address(registry));
        marketplace = new Marketplace(address(token), address(admin), address(registry));

        issuerContract = new TokenReceiver();
        buyer1Contract = new TokenReceiver();
        buyer2Contract = new TokenReceiver();

        issuer = address(issuerContract);
        buyer1 = address(buyer1Contract);
        buyer2 = address(buyer2Contract);

        admin.addIssuer(issuer);
        admin.addManager(manager);

        vm.deal(buyer1, 100 ether);
        vm.deal(buyer2, 100 ether);
        vm.deal(issuer, 100 ether);
    }


    function testCompleteAssetTokenizationFlow() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        assertEq(registry.assetCount(), 1);
        assertEq(registry.ownerOf(1), issuer);

        token.mintFractions(1, 1000, issuer);
        assertEq(token.totalShares(1), 1000);
        assertEq(token.balanceOf(issuer, 1), 1000);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0, 1);

        assertEq(token.balanceOf(issuer, 1), 500);
        assertEq(token.balanceOf(buyer1, 1), 500);
    }

    function testMultipleBuyersFlow() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 300, 1 ether);

        vm.prank(issuer);
        marketplace.list(1, 400, 2 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0, 1);

        vm.prank(buyer2);
        marketplace.buy{value: 2 ether}(1, 1);

        assertEq(token.balanceOf(issuer, 1), 300); // 1000 - 300 - 400
        assertEq(token.balanceOf(buyer1, 1), 300);
        assertEq(token.balanceOf(buyer2, 1), 400);
    }

    function testSecondaryMarketTrading() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0, 1);

        vm.prank(buyer1);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(buyer1);
        marketplace.list(1, 250, 0.5 ether);

        vm.prank(buyer2);
        marketplace.buy{value: 0.5 ether}(0, 1);
        marketplace.buy{value: 1 ether}(1, 1);
        marketplace.buy{value: 2 ether}(2, 1);

        assertEq(token.balanceOf(issuer, 1), 500);
        assertEq(token.balanceOf(buyer1, 1), 250);
        assertEq(token.balanceOf(buyer2, 1), 250);
    }


    function testOnlyIssuerCanCreateAssets() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);

        vm.prank(manager);
        vm.expectRevert("Not issuer");
        registry.createAsset("ipfs://another-hash");

        vm.prank(nonParticipant);
        vm.expectRevert("Not issuer");
        registry.createAsset("ipfs://another-hash");
    }

    function testRoleChangesAffectAccess() public {
        address newIssuer = address(0x100);
        admin.addIssuer(newIssuer);

        vm.prank(newIssuer);
        registry.createAsset(IPFS_HASH);

        admin.removeIssuer(newIssuer);

        vm.prank(newIssuer);
        vm.expectRevert("Not issuer");
        registry.createAsset("ipfs://hash2");
    }


    function testMarketplacePauseBlocksTrading() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        admin.pauseMarketplace(true);

        vm.prank(buyer1);
        vm.expectRevert("Marketplace paused");
        marketplace.buy{value: 1 ether}(0, 1);

        admin.pauseMarketplace(false);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0, 1);

        assertEq(token.balanceOf(buyer1, 1), 500);
    }

    function testCanListWhilePaused() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        admin.pauseMarketplace(true);

        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        (address seller, uint256 assetId, uint256 amount, uint256 price, bool active) = marketplace.listings(0);
        assertEq(seller, issuer);
    }


    function testOwnershipTransferAffectsAllContracts() public {
        address newOwner = address(0x200);

        admin.transferOwnership(newOwner);

        vm.expectRevert("Not admin");
        admin.addIssuer(address(0x300));

        vm.prank(newOwner);
        admin.addIssuer(address(0x300));
        assertTrue(admin.isIssuer(address(0x300)));

        vm.prank(newOwner);
        admin.pauseMarketplace(true);
        assertTrue(admin.marketplacePaused());
    }


    function testTokenSpecificManagerAccess() public {
        address tokenManager = address(0x400);

        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        admin.setManagerForToken(tokenManager, 1, true);

        assertTrue(admin.isManagerForToken(tokenManager, 1));
        assertFalse(admin.isManagerForToken(tokenManager, 2));
    }

    function testGlobalManagerHasAccessToAllTokens() public {
        vm.startPrank(issuer);
        registry.createAsset(IPFS_HASH);
        registry.createAsset("ipfs://hash2");
        registry.createAsset("ipfs://hash3");
        vm.stopPrank();

        token.mintFractions(1, 1000, issuer);
        token.mintFractions(2, 1000, issuer);
        token.mintFractions(3, 1000, issuer);

        assertTrue(admin.isManagerForToken(manager, 1));
        assertTrue(admin.isManagerForToken(manager, 2));
        assertTrue(admin.isManagerForToken(manager, 3));
    }


    function testCreateMultiAssetPortfolio() public {
        vm.startPrank(issuer);
        registry.createAsset("ipfs://property1");
        registry.createAsset("ipfs://property2");
        registry.createAsset("ipfs://property3");
        vm.stopPrank();

        assertEq(registry.assetCount(), 3);

        token.mintFractions(1, 100, issuer);
        token.mintFractions(2, 500, issuer);
        token.mintFractions(3, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.startPrank(issuer);
        marketplace.list(1, 50, 0.5 ether);
        marketplace.list(2, 250, 1 ether);
        marketplace.list(3, 500, 2 ether);
        vm.stopPrank();

        vm.startPrank(buyer1);
        marketplace.buy{value: 0.5 ether}(0, 1);
        marketplace.buy{value: 1 ether}(1, 2);
        marketplace.buy{value: 2 ether}(2, 3);
        vm.stopPrank();

        assertEq(token.balanceOf(buyer1, 1), 50);
        assertEq(token.balanceOf(buyer1, 2), 250);
        assertEq(token.balanceOf(buyer1, 3), 500);
    }


    function testFullAssetLifecycle() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);

        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 400, 1 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0, 1);

        vm.prank(issuer);
        marketplace.list(1, 300, 1.5 ether);

        vm.prank(buyer2);
        marketplace.buy{value: 1.5 ether}(1, 1);

        vm.prank(buyer1);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(buyer1);
        marketplace.list(1, 200, 0.8 ether);

        vm.prank(buyer2);
        marketplace.buy{value: 0.8 ether}(2, 1);

        assertEq(token.balanceOf(issuer, 1), 300);
        assertEq(token.balanceOf(buyer1, 1), 200);
        assertEq(token.balanceOf(buyer2, 1), 500); // 300 + 200

        uint256 totalDistributed = token.balanceOf(issuer, 1) +
            token.balanceOf(buyer1, 1) +
            token.balanceOf(buyer2, 1);
        assertEq(totalDistributed, token.totalShares(1));
    }


    function testAssetTransferDoesNotAffectFractionalTokens() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 1000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        vm.prank(issuer);
        marketplace.list(1, 500, 1 ether);

        vm.prank(buyer1);
        marketplace.buy{value: 1 ether}(0, 1);

        vm.prank(issuer);
        registry.transferFrom(issuer, buyer2, 1);

        assertEq(registry.ownerOf(1), buyer2);

        assertEq(token.balanceOf(issuer, 1), 500);
        assertEq(token.balanceOf(buyer1, 1), 500);
        assertEq(token.balanceOf(buyer2, 1), 0);
    }

    function testMultipleIssuersIndependent() public {
        address issuer2 = address(0x500);
        admin.addIssuer(issuer2);

        vm.prank(issuer);
        registry.createAsset("ipfs://issuer1-asset");

        vm.prank(issuer2);
        registry.createAsset("ipfs://issuer2-asset");

        assertEq(registry.ownerOf(1), issuer);
        assertEq(registry.ownerOf(2), issuer2);

        token.mintFractions(1, 1000, issuer);
        token.mintFractions(2, 2000, issuer2);

        assertEq(token.balanceOf(issuer, 1), 1000);
        assertEq(token.balanceOf(issuer2, 2), 2000);
    }


    function testManyListingsAndPurchases() public {
        vm.prank(issuer);
        registry.createAsset(IPFS_HASH);
        token.mintFractions(1, 10000, issuer);

        vm.prank(issuer);
        token.setApprovalForAll(address(marketplace), true);

        for (uint256 i = 0; i < 10; i++) {
            vm.prank(issuer);
            marketplace.list(1, 100, 0.1 ether);
        }

        for (uint256 i = 0; i < 10; i++) {
            vm.prank(buyer1);
            marketplace.buy{value: 0.1 ether}(i, 1);
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
