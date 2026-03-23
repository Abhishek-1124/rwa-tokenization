// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";
import "../src/AssetRegistry.sol";
import "../src/FractionalToken.sol";
import "../src/Marketplace.sol";

contract MarketplaceFlowTest is Test {
    Admin admin;
    AssetRegistry registry;
    FractionalToken token;
    Marketplace market;

    address issuer = address(0xA11CE);
    address buyer = address(0xB0B);

    function setUp() public {
        admin = new Admin();
        registry = new AssetRegistry(address(admin));
        token = new FractionalToken(address(admin), address(registry));
        market = new Marketplace(address(token), address(admin), address(registry));

        // Admin owner (this test contract) assigns issuer role
        admin.addIssuer(issuer);

        vm.deal(issuer, 100 ether);
        vm.deal(buyer, 100 ether);
    }

    function testListBuyPaysRoyaltyAndTransfersFractions() public {
        // Issuer creates asset and mints fractions to self
        vm.startPrank(issuer);
        registry.createAsset("ipfs://metadata");
        token.mintFractions(1, 1000, issuer);
        token.setApprovalForAll(address(market), true);

        // List 10 fractions at 1 ether per fraction
        uint256 listingId = market.list(1, 10, 1 ether);
        vm.stopPrank();

        assertEq(listingId, 1);
        assertEq(token.balanceOf(address(market), 1), 10);
        assertEq(token.balanceOf(issuer, 1), 990);

        // Buy 2 fractions: total price 2 ether, royalty is 5% => 0.1 ether
        uint256 issuerBalBefore = issuer.balance;
        uint256 buyerBalBefore = buyer.balance;

        vm.prank(buyer);
        market.buy{value: 2 ether}(listingId, 2);

        // Fractions moved
        assertEq(token.balanceOf(buyer, 1), 2);
        assertEq(token.balanceOf(address(market), 1), 8);

        // ETH paid: buyer spent 2 ether
        assertEq(buyerBalBefore - buyer.balance, 2 ether);

        // Issuer (seller and royalty receiver) gets full 2 ether (1.9 seller + 0.1 royalty)
        assertEq(issuer.balance - issuerBalBefore, 2 ether);
    }
}


