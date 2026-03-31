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

        admin.addIssuer(issuer);

        vm.deal(issuer, 100 ether);
        vm.deal(buyer, 100 ether);
    }

    function testListBuyPaysRoyaltyAndTransfersFractions() public {
        vm.startPrank(issuer);
        registry.createAsset("ipfs://metadata");
        token.mintFractions(1, 1000, issuer);
        token.setApprovalForAll(address(market), true);

        uint256 listingId = market.list(1, 10, 1 ether);
        vm.stopPrank();

        assertEq(listingId, 1);
        assertEq(token.balanceOf(address(market), 1), 10);
        assertEq(token.balanceOf(issuer, 1), 990);

        uint256 issuerBalBefore = issuer.balance;
        uint256 buyerBalBefore = buyer.balance;

        vm.prank(buyer);
        market.buy{value: 2 ether}(listingId, 2);

        assertEq(token.balanceOf(buyer, 1), 2);
        assertEq(token.balanceOf(address(market), 1), 8);

        assertEq(buyerBalBefore - buyer.balance, 2 ether);

        assertEq(issuer.balance - issuerBalBefore, 2 ether);
    }
}


