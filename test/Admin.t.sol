// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";

contract AdminTest is Test {
    Admin admin;

    address owner;
    address issuer1 = address(0x1);
    address issuer2 = address(0x2);
    address manager1 = address(0x3);
    address manager2 = address(0x4);
    address nonOwner = address(0x5);

    // Events to test
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event ManagerAdded(address indexed manager);
    event ManagerRemoved(address indexed manager);
    event TokenManagerSet(address indexed manager, uint256 indexed tokenId, bool status);
    event MarketplacePaused(bool paused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setUp() public {
        owner = address(this);
        admin = new Admin();
    }

    // =========================================================================
    // Constructor Tests
    // =========================================================================

    function testConstructorSetsOwner() public view {
        assertEq(admin.owner(), owner);
    }

    function testConstructorMakesOwnerIssuer() public view {
        assertTrue(admin.isIssuer(owner));
    }

    function testConstructorMakesOwnerManager() public view {
        assertTrue(admin.isManager(owner));
    }

    // =========================================================================
    // Issuer Management Tests
    // =========================================================================

    function testAddIssuer() public {
        admin.addIssuer(issuer1);
        assertTrue(admin.isIssuer(issuer1));
    }

    function testAddIssuerEmitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit IssuerAdded(issuer1);
        admin.addIssuer(issuer1);
    }

    function testAddIssuerFailsForNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert("Not admin");
        admin.addIssuer(issuer1);
    }

    function testAddIssuerFailsForZeroAddress() public {
        vm.expectRevert("Invalid address");
        admin.addIssuer(address(0));
    }

    function testAddIssuerFailsForExistingIssuer() public {
        admin.addIssuer(issuer1);
        vm.expectRevert("Already issuer");
        admin.addIssuer(issuer1);
    }

    function testRemoveIssuer() public {
        admin.addIssuer(issuer1);
        assertTrue(admin.isIssuer(issuer1));

        admin.removeIssuer(issuer1);
        assertFalse(admin.isIssuer(issuer1));
    }

    function testRemoveIssuerEmitsEvent() public {
        admin.addIssuer(issuer1);

        vm.expectEmit(true, false, false, false);
        emit IssuerRemoved(issuer1);
        admin.removeIssuer(issuer1);
    }

    function testRemoveIssuerFailsForNonOwner() public {
        admin.addIssuer(issuer1);

        vm.prank(nonOwner);
        vm.expectRevert("Not admin");
        admin.removeIssuer(issuer1);
    }

    function testRemoveIssuerFailsForZeroAddress() public {
        vm.expectRevert("Invalid address");
        admin.removeIssuer(address(0));
    }

    function testRemoveIssuerFailsForNonIssuer() public {
        vm.expectRevert("Not an issuer");
        admin.removeIssuer(issuer1);
    }

    function testCanAddIssuerAfterRemoval() public {
        admin.addIssuer(issuer1);
        admin.removeIssuer(issuer1);
        admin.addIssuer(issuer1);
        assertTrue(admin.isIssuer(issuer1));
    }

    // =========================================================================
    // Manager Management Tests
    // =========================================================================

    function testAddManager() public {
        admin.addManager(manager1);
        assertTrue(admin.isManager(manager1));
    }

    function testAddManagerEmitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit ManagerAdded(manager1);
        admin.addManager(manager1);
    }

    function testAddManagerFailsForNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert("Not admin");
        admin.addManager(manager1);
    }

    function testAddManagerFailsForZeroAddress() public {
        vm.expectRevert("Invalid address");
        admin.addManager(address(0));
    }

    function testAddManagerFailsForExistingManager() public {
        admin.addManager(manager1);
        vm.expectRevert("Already manager");
        admin.addManager(manager1);
    }

    function testRemoveManager() public {
        admin.addManager(manager1);
        assertTrue(admin.isManager(manager1));

        admin.removeManager(manager1);
        assertFalse(admin.isManager(manager1));
    }

    function testRemoveManagerEmitsEvent() public {
        admin.addManager(manager1);

        vm.expectEmit(true, false, false, false);
        emit ManagerRemoved(manager1);
        admin.removeManager(manager1);
    }

    function testRemoveManagerFailsForNonOwner() public {
        admin.addManager(manager1);

        vm.prank(nonOwner);
        vm.expectRevert("Not admin");
        admin.removeManager(manager1);
    }

    function testRemoveManagerFailsForZeroAddress() public {
        vm.expectRevert("Invalid address");
        admin.removeManager(address(0));
    }

    function testRemoveManagerFailsForNonManager() public {
        vm.expectRevert("Not a manager");
        admin.removeManager(manager1);
    }

    function testCanAddManagerAfterRemoval() public {
        admin.addManager(manager1);
        admin.removeManager(manager1);
        admin.addManager(manager1);
        assertTrue(admin.isManager(manager1));
    }

    // =========================================================================
    // Token-Specific Manager Tests
    // =========================================================================

    function testSetManagerForToken() public {
        admin.setManagerForToken(manager1, 1, true);
        assertTrue(admin.managerForToken(manager1, 1));
    }

    function testSetManagerForTokenEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit TokenManagerSet(manager1, 1, true);
        admin.setManagerForToken(manager1, 1, true);
    }

    function testSetManagerForTokenFailsForNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert("Not admin");
        admin.setManagerForToken(manager1, 1, true);
    }

    function testSetManagerForTokenFailsForZeroAddress() public {
        vm.expectRevert("Invalid address");
        admin.setManagerForToken(address(0), 1, true);
    }

    function testRemoveManagerForToken() public {
        admin.setManagerForToken(manager1, 1, true);
        assertTrue(admin.managerForToken(manager1, 1));

        admin.setManagerForToken(manager1, 1, false);
        assertFalse(admin.managerForToken(manager1, 1));
    }

    function testSetManagerForMultipleTokens() public {
        admin.setManagerForToken(manager1, 1, true);
        admin.setManagerForToken(manager1, 2, true);
        admin.setManagerForToken(manager1, 3, true);

        assertTrue(admin.managerForToken(manager1, 1));
        assertTrue(admin.managerForToken(manager1, 2));
        assertTrue(admin.managerForToken(manager1, 3));
    }

    function testMultipleManagersForSameToken() public {
        admin.setManagerForToken(manager1, 1, true);
        admin.setManagerForToken(manager2, 1, true);

        assertTrue(admin.managerForToken(manager1, 1));
        assertTrue(admin.managerForToken(manager2, 1));
    }

    // =========================================================================
    // isManagerForToken View Function Tests
    // =========================================================================

    function testIsManagerForTokenReturnsTrueForTokenSpecificManager() public {
        admin.setManagerForToken(manager1, 1, true);
        assertTrue(admin.isManagerForToken(manager1, 1));
    }

    function testIsManagerForTokenReturnsTrueForGlobalManager() public {
        admin.addManager(manager1);
        // Global manager should be manager for ANY token
        assertTrue(admin.isManagerForToken(manager1, 1));
        assertTrue(admin.isManagerForToken(manager1, 2));
        assertTrue(admin.isManagerForToken(manager1, 999));
    }

    function testIsManagerForTokenReturnsFalseForNonManager() public {
        assertFalse(admin.isManagerForToken(manager1, 1));
    }

    function testIsManagerForTokenWithBothGlobalAndTokenSpecific() public {
        // Add as global manager
        admin.addManager(manager1);
        // Also add for specific token
        admin.setManagerForToken(manager1, 1, true);

        // Should still return true
        assertTrue(admin.isManagerForToken(manager1, 1));

        // Remove from global
        admin.removeManager(manager1);
        // Should still be true for token 1 (token-specific)
        assertTrue(admin.isManagerForToken(manager1, 1));
        // But false for other tokens
        assertFalse(admin.isManagerForToken(manager1, 2));
    }

    // =========================================================================
    // Marketplace Pause Tests
    // =========================================================================

    function testMarketplaceNotPausedByDefault() public view {
        assertFalse(admin.marketplacePaused());
    }

    function testPauseMarketplace() public {
        admin.pauseMarketplace(true);
        assertTrue(admin.marketplacePaused());
    }

    function testUnpauseMarketplace() public {
        admin.pauseMarketplace(true);
        assertTrue(admin.marketplacePaused());

        admin.pauseMarketplace(false);
        assertFalse(admin.marketplacePaused());
    }

    function testPauseMarketplaceEmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit MarketplacePaused(true);
        admin.pauseMarketplace(true);
    }

    function testUnpauseMarketplaceEmitsEvent() public {
        admin.pauseMarketplace(true);

        vm.expectEmit(false, false, false, true);
        emit MarketplacePaused(false);
        admin.pauseMarketplace(false);
    }

    function testPauseMarketplaceFailsForNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert("Not admin");
        admin.pauseMarketplace(true);
    }

    function testCanTogglePauseMultipleTimes() public {
        admin.pauseMarketplace(true);
        assertTrue(admin.marketplacePaused());

        admin.pauseMarketplace(false);
        assertFalse(admin.marketplacePaused());

        admin.pauseMarketplace(true);
        assertTrue(admin.marketplacePaused());
    }

    // =========================================================================
    // Ownership Transfer Tests
    // =========================================================================

    function testTransferOwnership() public {
        address newOwner = address(0x100);
        admin.transferOwnership(newOwner);
        assertEq(admin.owner(), newOwner);
    }

    function testTransferOwnershipEmitsEvent() public {
        address newOwner = address(0x100);

        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(owner, newOwner);
        admin.transferOwnership(newOwner);
    }

    function testTransferOwnershipFailsForNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert("Not admin");
        admin.transferOwnership(nonOwner);
    }

    function testTransferOwnershipFailsForZeroAddress() public {
        vm.expectRevert("Invalid address");
        admin.transferOwnership(address(0));
    }

    function testNewOwnerCanPerformOwnerActions() public {
        address newOwner = address(0x100);
        admin.transferOwnership(newOwner);

        vm.prank(newOwner);
        admin.addIssuer(issuer1);
        assertTrue(admin.isIssuer(issuer1));
    }

    function testOldOwnerCannotPerformActionsAfterTransfer() public {
        address newOwner = address(0x100);
        admin.transferOwnership(newOwner);

        vm.expectRevert("Not admin");
        admin.addIssuer(issuer1);
    }

    // =========================================================================
    // Multiple Roles Tests
    // =========================================================================

    function testAddressCanBeBothIssuerAndManager() public {
        admin.addIssuer(issuer1);
        admin.addManager(issuer1);

        assertTrue(admin.isIssuer(issuer1));
        assertTrue(admin.isManager(issuer1));
    }

    function testRemoveIssuerDoesNotAffectManager() public {
        admin.addIssuer(issuer1);
        admin.addManager(issuer1);

        admin.removeIssuer(issuer1);

        assertFalse(admin.isIssuer(issuer1));
        assertTrue(admin.isManager(issuer1));
    }

    function testRemoveManagerDoesNotAffectIssuer() public {
        admin.addIssuer(issuer1);
        admin.addManager(issuer1);

        admin.removeManager(issuer1);

        assertTrue(admin.isIssuer(issuer1));
        assertFalse(admin.isManager(issuer1));
    }

    // =========================================================================
    // Fuzz Tests
    // =========================================================================

    function testFuzzAddIssuer(address _issuer) public {
        vm.assume(_issuer != address(0));
        vm.assume(!admin.isIssuer(_issuer));

        admin.addIssuer(_issuer);
        assertTrue(admin.isIssuer(_issuer));
    }

    function testFuzzAddManager(address _manager) public {
        vm.assume(_manager != address(0));
        vm.assume(!admin.isManager(_manager));

        admin.addManager(_manager);
        assertTrue(admin.isManager(_manager));
    }

    function testFuzzSetManagerForToken(address _manager, uint256 _tokenId) public {
        vm.assume(_manager != address(0));

        admin.setManagerForToken(_manager, _tokenId, true);
        assertTrue(admin.managerForToken(_manager, _tokenId));
        assertTrue(admin.isManagerForToken(_manager, _tokenId));
    }

    function testFuzzTransferOwnership(address _newOwner) public {
        vm.assume(_newOwner != address(0));

        admin.transferOwnership(_newOwner);
        assertEq(admin.owner(), _newOwner);
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    function testOwnerCannotAddSelfAsIssuerAgain() public {
        // Owner is already issuer from constructor
        vm.expectRevert("Already issuer");
        admin.addIssuer(owner);
    }

    function testOwnerCannotAddSelfAsManagerAgain() public {
        // Owner is already manager from constructor
        vm.expectRevert("Already manager");
        admin.addManager(owner);
    }

    function testCanRemoveOwnerFromIssuerRole() public {
        admin.removeIssuer(owner);
        assertFalse(admin.isIssuer(owner));
    }

    function testCanRemoveOwnerFromManagerRole() public {
        admin.removeManager(owner);
        assertFalse(admin.isManager(owner));
    }

    function testMaxTokenId() public {
        uint256 maxTokenId = type(uint256).max;
        admin.setManagerForToken(manager1, maxTokenId, true);
        assertTrue(admin.isManagerForToken(manager1, maxTokenId));
    }

    function testZeroTokenId() public {
        admin.setManagerForToken(manager1, 0, true);
        assertTrue(admin.isManagerForToken(manager1, 0));
    }
}
