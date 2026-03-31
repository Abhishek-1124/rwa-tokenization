pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";
import "../src/AssetRegistry.sol";

contract AssetRegistryTest is Test {
    Admin admin;
    AssetRegistry registry;

    address owner;
    address issuer1 = address(0x1);
    address issuer2 = address(0x2);
    address nonIssuer = address(0x3);

    string constant IPFS_HASH_1 = "ipfs://QmTest1234567890abcdef";
    string constant IPFS_HASH_2 = "ipfs://QmTest0987654321fedcba";
    string constant EMPTY_HASH = "";

    function setUp() public {
        owner = address(this);
        admin = new Admin();
        registry = new AssetRegistry(address(admin));

        admin.addIssuer(issuer1);
        admin.addIssuer(issuer2);
    }


    function testConstructorSetsAdminContract() public view {
        assertEq(address(registry.admin()), address(admin));
    }

    function testConstructorSetsName() public view {
        assertEq(registry.name(), "RWA Asset");
    }

    function testConstructorSetsSymbol() public view {
        assertEq(registry.symbol(), "RWA");
    }

    function testInitialAssetCountIsZero() public view {
        assertEq(registry.assetCount(), 0);
    }


    function testIssuerCanCreateAsset() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        assertEq(registry.assetCount(), 1);
    }

    function testCreateAssetMintsNFT() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        assertEq(registry.ownerOf(1), issuer1);
    }

    function testCreateAssetStoresIPFSHash() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        assertEq(registry.assetIPFS(1), IPFS_HASH_1);
    }

    function testCreateAssetIncrementsCount() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);
        assertEq(registry.assetCount(), 1);

        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_2);
        assertEq(registry.assetCount(), 2);
    }

    function testNonIssuerCannotCreateAsset() public {
        vm.prank(nonIssuer);
        vm.expectRevert("Not issuer");
        registry.createAsset(IPFS_HASH_1);
    }

    function testOwnerCanCreateAssetAsIssuer() public {
        registry.createAsset(IPFS_HASH_1);
        assertEq(registry.assetCount(), 1);
    }

    function testMultipleIssuersCanCreateAssets() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer2);
        registry.createAsset(IPFS_HASH_2);

        assertEq(registry.assetCount(), 2);
        assertEq(registry.ownerOf(1), issuer1);
        assertEq(registry.ownerOf(2), issuer2);
    }

    function testCreateAssetWithEmptyHash() public {
        vm.prank(issuer1);
        registry.createAsset(EMPTY_HASH);

        assertEq(registry.assetIPFS(1), EMPTY_HASH);
    }

    function testRemovedIssuerCannotCreateAsset() public {
        admin.removeIssuer(issuer1);

        vm.prank(issuer1);
        vm.expectRevert("Not issuer");
        registry.createAsset(IPFS_HASH_1);
    }

    function testNewlyAddedIssuerCanCreateAsset() public {
        address newIssuer = address(0x100);
        admin.addIssuer(newIssuer);

        vm.prank(newIssuer);
        registry.createAsset(IPFS_HASH_1);

        assertEq(registry.assetCount(), 1);
        assertEq(registry.ownerOf(1), newIssuer);
    }


    function testBalanceOf() public {
        vm.startPrank(issuer1);
        registry.createAsset(IPFS_HASH_1);
        registry.createAsset(IPFS_HASH_2);
        vm.stopPrank();

        assertEq(registry.balanceOf(issuer1), 2);
        assertEq(registry.balanceOf(issuer2), 0);
    }

    function testTransferFrom() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer1);
        registry.transferFrom(issuer1, issuer2, 1);

        assertEq(registry.ownerOf(1), issuer2);
    }

    function testApproveAndTransfer() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer1);
        registry.approve(issuer2, 1);

        vm.prank(issuer2);
        registry.transferFrom(issuer1, issuer2, 1);

        assertEq(registry.ownerOf(1), issuer2);
    }

    function testSetApprovalForAll() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer1);
        registry.setApprovalForAll(issuer2, true);

        assertTrue(registry.isApprovedForAll(issuer1, issuer2));

        vm.prank(issuer2);
        registry.transferFrom(issuer1, issuer2, 1);

        assertEq(registry.ownerOf(1), issuer2);
    }

    function testSafeTransferFrom() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer1);
        registry.safeTransferFrom(issuer1, issuer2, 1);

        assertEq(registry.ownerOf(1), issuer2);
    }

    function testGetApproved() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer1);
        registry.approve(issuer2, 1);

        assertEq(registry.getApproved(1), issuer2);
    }


    function testIPFSHashRemainsAfterTransfer() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer1);
        registry.transferFrom(issuer1, nonIssuer, 1);

        assertEq(registry.assetIPFS(1), IPFS_HASH_1);
    }

    function testNonIssuerCanReceiveAsset() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        vm.prank(issuer1);
        registry.transferFrom(issuer1, nonIssuer, 1);

        assertEq(registry.ownerOf(1), nonIssuer);
    }


    function testCreateManyAssets() public {
        vm.startPrank(issuer1);
        for (uint256 i = 0; i < 10; i++) {
            registry.createAsset(string(abi.encodePacked("ipfs://hash", vm.toString(i))));
        }
        vm.stopPrank();

        assertEq(registry.assetCount(), 10);
        assertEq(registry.balanceOf(issuer1), 10);
    }

    function testEachAssetHasUniqueId() public {
        vm.startPrank(issuer1);
        registry.createAsset(IPFS_HASH_1);
        registry.createAsset(IPFS_HASH_1); // Same hash, different ID
        vm.stopPrank();

        assertEq(registry.ownerOf(1), issuer1);
        assertEq(registry.ownerOf(2), issuer1);
        assertEq(registry.assetIPFS(1), IPFS_HASH_1);
        assertEq(registry.assetIPFS(2), IPFS_HASH_1);
    }


    function testFuzzCreateAsset(string memory ipfsHash) public {
        vm.prank(issuer1);
        registry.createAsset(ipfsHash);

        assertEq(registry.assetCount(), 1);
        assertEq(registry.assetIPFS(1), ipfsHash);
    }

    function testFuzzMultipleAssets(uint8 count) public {
        vm.assume(count > 0 && count <= 100);

        vm.startPrank(issuer1);
        for (uint8 i = 0; i < count; i++) {
            registry.createAsset(IPFS_HASH_1);
        }
        vm.stopPrank();

        assertEq(registry.assetCount(), count);
        assertEq(registry.balanceOf(issuer1), count);
    }


    function testCreateAssetWithLongIPFSHash() public {
        string memory longHash = "ipfs://QmVeryLongHashThatIsLongerThanUsualButShouldStillWorkCorrectlyAndBeStoredProperly1234567890";

        vm.prank(issuer1);
        registry.createAsset(longHash);

        assertEq(registry.assetIPFS(1), longHash);
    }

    function testQueryNonExistentAssetIPFS() public view {
        assertEq(registry.assetIPFS(999), "");
    }

    function testOwnerOfNonExistentTokenReverts() public {
        vm.expectRevert();
        registry.ownerOf(999);
    }


    function testIssuerStatusChangesAffectAssetCreation() public {
        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_1);

        admin.removeIssuer(issuer1);

        vm.prank(issuer1);
        vm.expectRevert("Not issuer");
        registry.createAsset(IPFS_HASH_2);

        admin.addIssuer(issuer1);

        vm.prank(issuer1);
        registry.createAsset(IPFS_HASH_2);

        assertEq(registry.assetCount(), 2);
    }
}
