pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";
import "../src/AssetRegistry.sol";
import "../src/FractionalToken.sol";

contract RWATest is Test {
    Admin admin;
    AssetRegistry registry;
    FractionalToken token;

    address issuer = address(0x1);

    function setUp() public {
        admin = new Admin();
        registry = new AssetRegistry(address(admin));
        token = new FractionalToken(address(admin), address(registry));

        admin.addIssuer(issuer);
    }

    function testIssuerCanCreateAsset() public {
        vm.prank(issuer);

        registry.createAsset("ipfs://test-hash");

        assertEq(registry.assetCount(), 1);
    }

    function testFractionalizationWorks() public {
        vm.prank(issuer);
        registry.createAsset("ipfs://test-hash");

        token.mintFractions(1, 1000, issuer);

        assertEq(token.totalShares(1), 1000);
        assertEq(token.balanceOf(issuer, 1), 1000);
    }
}
