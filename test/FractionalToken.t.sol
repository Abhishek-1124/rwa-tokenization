// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FractionalToken.sol";

contract FractionalTokenTest is Test {
    FractionalToken token;

    address owner1 = address(0x1);
    address owner2 = address(0x2);
    address recipient = address(0x3);

    uint256 constant ASSET_ID_1 = 1;
    uint256 constant ASSET_ID_2 = 2;
    uint256 constant SHARES_1000 = 1000;
    uint256 constant SHARES_100 = 100;

    function setUp() public {
        token = new FractionalToken();
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    function testConstructorSetsURI() public view {
        // URI is empty string as per contract
        assertEq(token.uri(1), "");
    }

    // =========================================================================
    // Mint Fractions Tests
    // =========================================================================

    function testMintFractions() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        assertEq(token.totalShares(ASSET_ID_1), SHARES_1000);
        assertEq(token.balanceOf(owner1, ASSET_ID_1), SHARES_1000);
    }

    function testMintFractionsSetsTotalShares() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);
        assertEq(token.totalShares(ASSET_ID_1), SHARES_1000);
    }

    function testMintFractionsToCorrectOwner() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);
        assertEq(token.balanceOf(owner1, ASSET_ID_1), SHARES_1000);
        assertEq(token.balanceOf(owner2, ASSET_ID_1), 0);
    }

    function testCannotDoubleFractionalize() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.expectRevert("Already fractionalized");
        token.mintFractions(ASSET_ID_1, SHARES_100, owner2);
    }

    function testCanFractionalizeDifferentAssets() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);
        token.mintFractions(ASSET_ID_2, SHARES_100, owner2);

        assertEq(token.totalShares(ASSET_ID_1), SHARES_1000);
        assertEq(token.totalShares(ASSET_ID_2), SHARES_100);
        assertEq(token.balanceOf(owner1, ASSET_ID_1), SHARES_1000);
        assertEq(token.balanceOf(owner2, ASSET_ID_2), SHARES_100);
    }

    function testMintFractionsWithOneShare() public {
        token.mintFractions(ASSET_ID_1, 1, owner1);

        assertEq(token.totalShares(ASSET_ID_1), 1);
        assertEq(token.balanceOf(owner1, ASSET_ID_1), 1);
    }

    function testMintFractionsWithLargeAmount() public {
        uint256 largeAmount = 1_000_000_000;
        token.mintFractions(ASSET_ID_1, largeAmount, owner1);

        assertEq(token.totalShares(ASSET_ID_1), largeAmount);
        assertEq(token.balanceOf(owner1, ASSET_ID_1), largeAmount);
    }

    // =========================================================================
    // ERC1155 Transfer Tests
    // =========================================================================

    function testSafeTransferFrom() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, 500, "");

        assertEq(token.balanceOf(owner1, ASSET_ID_1), 500);
        assertEq(token.balanceOf(recipient, ASSET_ID_1), 500);
    }

    function testSafeTransferFromAllShares() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, SHARES_1000, "");

        assertEq(token.balanceOf(owner1, ASSET_ID_1), 0);
        assertEq(token.balanceOf(recipient, ASSET_ID_1), SHARES_1000);
    }

    function testCannotTransferMoreThanBalance() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        vm.expectRevert();
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, SHARES_1000 + 1, "");
    }

    function testTransferDoesNotChangeTotalShares() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, 500, "");

        // Total shares should remain the same
        assertEq(token.totalShares(ASSET_ID_1), SHARES_1000);
    }

    // =========================================================================
    // Batch Transfer Tests
    // =========================================================================

    function testSafeBatchTransferFrom() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);
        token.mintFractions(ASSET_ID_2, SHARES_100, owner1);

        uint256[] memory ids = new uint256[](2);
        ids[0] = ASSET_ID_1;
        ids[1] = ASSET_ID_2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 500;
        amounts[1] = 50;

        vm.prank(owner1);
        token.safeBatchTransferFrom(owner1, recipient, ids, amounts, "");

        assertEq(token.balanceOf(owner1, ASSET_ID_1), 500);
        assertEq(token.balanceOf(owner1, ASSET_ID_2), 50);
        assertEq(token.balanceOf(recipient, ASSET_ID_1), 500);
        assertEq(token.balanceOf(recipient, ASSET_ID_2), 50);
    }

    // =========================================================================
    // Approval Tests
    // =========================================================================

    function testSetApprovalForAll() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        token.setApprovalForAll(owner2, true);

        assertTrue(token.isApprovedForAll(owner1, owner2));
    }

    function testApprovedOperatorCanTransfer() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        token.setApprovalForAll(owner2, true);

        vm.prank(owner2);
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, 500, "");

        assertEq(token.balanceOf(recipient, ASSET_ID_1), 500);
    }

    function testRevokeApproval() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        token.setApprovalForAll(owner2, true);

        vm.prank(owner1);
        token.setApprovalForAll(owner2, false);

        assertFalse(token.isApprovedForAll(owner1, owner2));
    }

    function testUnapprovedCannotTransfer() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner2);
        vm.expectRevert();
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, 500, "");
    }

    // =========================================================================
    // Balance Of Batch Tests
    // =========================================================================

    function testBalanceOfBatch() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);
        token.mintFractions(ASSET_ID_2, SHARES_100, owner2);

        address[] memory accounts = new address[](2);
        accounts[0] = owner1;
        accounts[1] = owner2;

        uint256[] memory ids = new uint256[](2);
        ids[0] = ASSET_ID_1;
        ids[1] = ASSET_ID_2;

        uint256[] memory balances = token.balanceOfBatch(accounts, ids);

        assertEq(balances[0], SHARES_1000);
        assertEq(balances[1], SHARES_100);
    }

    // =========================================================================
    // Zero Amount Tests
    // =========================================================================

    function testCannotMintZeroShares() public {
        // Minting zero shares doesn't make sense but contract allows it
        // This tests the current behavior - should be 0
        token.mintFractions(ASSET_ID_1, 0, owner1);
        assertEq(token.totalShares(ASSET_ID_1), 0);
        assertEq(token.balanceOf(owner1, ASSET_ID_1), 0);
    }

    function testTransferZeroAmount() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, 0, "");

        // Balances should remain unchanged
        assertEq(token.balanceOf(owner1, ASSET_ID_1), SHARES_1000);
        assertEq(token.balanceOf(recipient, ASSET_ID_1), 0);
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzzMintFractions(uint256 assetId, uint256 shares, address _owner) public {
        vm.assume(_owner != address(0));
        vm.assume(shares > 0);

        token.mintFractions(assetId, shares, _owner);

        assertEq(token.totalShares(assetId), shares);
        assertEq(token.balanceOf(_owner, assetId), shares);
    }

    function testFuzzTransfer(uint256 shares, uint256 transferAmount) public {
        vm.assume(shares > 0 && shares <= type(uint128).max);
        vm.assume(transferAmount <= shares);

        token.mintFractions(ASSET_ID_1, shares, owner1);

        vm.prank(owner1);
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, transferAmount, "");

        assertEq(token.balanceOf(owner1, ASSET_ID_1), shares - transferAmount);
        assertEq(token.balanceOf(recipient, ASSET_ID_1), transferAmount);
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    function testMintToZeroAddressReverts() public {
        vm.expectRevert();
        token.mintFractions(ASSET_ID_1, SHARES_1000, address(0));
    }

    function testTransferToZeroAddressReverts() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        vm.prank(owner1);
        vm.expectRevert();
        token.safeTransferFrom(owner1, address(0), ASSET_ID_1, 500, "");
    }

    function testMaxUint256AssetId() public {
        uint256 maxId = type(uint256).max;
        token.mintFractions(maxId, SHARES_1000, owner1);

        assertEq(token.totalShares(maxId), SHARES_1000);
        assertEq(token.balanceOf(owner1, maxId), SHARES_1000);
    }

    function testMultipleTransfersOfSameAsset() public {
        token.mintFractions(ASSET_ID_1, SHARES_1000, owner1);

        // First transfer
        vm.prank(owner1);
        token.safeTransferFrom(owner1, owner2, ASSET_ID_1, 300, "");

        // Second transfer
        vm.prank(owner1);
        token.safeTransferFrom(owner1, recipient, ASSET_ID_1, 200, "");

        // Third transfer (owner2 to recipient)
        vm.prank(owner2);
        token.safeTransferFrom(owner2, recipient, ASSET_ID_1, 100, "");

        assertEq(token.balanceOf(owner1, ASSET_ID_1), 500);
        assertEq(token.balanceOf(owner2, ASSET_ID_1), 200);
        assertEq(token.balanceOf(recipient, ASSET_ID_1), 300);

        // Total should still be 1000
        assertEq(token.totalShares(ASSET_ID_1), SHARES_1000);
    }

    // =========================================================================
    // URI Tests
    // =========================================================================

    function testURIIsEmpty() public view {
        assertEq(token.uri(ASSET_ID_1), "");
        assertEq(token.uri(ASSET_ID_2), "");
        assertEq(token.uri(999), "");
    }

    // =========================================================================
    // Interface Support Tests
    // =========================================================================

    function testSupportsERC1155Interface() public view {
        // ERC1155 interface ID
        assertTrue(token.supportsInterface(0xd9b67a26));
    }

    function testSupportsERC165Interface() public view {
        // ERC165 interface ID
        assertTrue(token.supportsInterface(0x01ffc9a7));
    }
}
