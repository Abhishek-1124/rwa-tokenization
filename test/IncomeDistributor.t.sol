// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";
import "../src/AssetRegistry.sol";
import "../src/FractionalToken.sol";
import "../src/IncomeDistributor.sol";

contract IncomeDistributorTest is Test {
    Admin admin;
    AssetRegistry registry;
    FractionalToken token;
    IncomeDistributor dist;

    address issuer = address(0xA11CE);
    address buyer = address(0xB0B);

    function setUp() public {
        admin = new Admin();
        registry = new AssetRegistry(address(admin));
        token = new FractionalToken(address(admin), address(registry));
        dist = new IncomeDistributor(address(token), address(admin));
        token.setIncomeDistributor(address(dist));

        admin.addIssuer(issuer);
        vm.deal(issuer, 100 ether);
        vm.deal(buyer, 100 ether);
    }

    function testDepositBeforeTransferDoesNotLeakToBuyer() public {
        // Create asset and fractions
        vm.startPrank(issuer);
        registry.createAsset("ipfs://meta");
        token.mintFractions(1, 1000, issuer);

        // Deposit 10 ETH income while issuer holds all shares
        dist.depositIncome{value: 10 ether}(1);

        // Transfer 100 shares to buyer AFTER deposit
        token.safeTransferFrom(issuer, buyer, 1, 100, "");
        vm.stopPrank();

        // Buyer should NOT be able to claim from the pre-transfer deposit
        uint256 buyerPending = dist.pending(buyer, 1);
        assertEq(buyerPending, 0);

        // Issuer should be able to claim full 10 ETH (credited on transfer hook)
        uint256 issuerPending = dist.pending(issuer, 1);
        assertEq(issuerPending, 10 ether);

        uint256 before = issuer.balance;
        vm.prank(issuer);
        dist.claim(1);
        assertEq(issuer.balance - before, 10 ether);
    }

    function testDepositAfterTransferSplitsProRata() public {
        vm.startPrank(issuer);
        registry.createAsset("ipfs://meta");
        token.mintFractions(1, 1000, issuer);
        token.safeTransferFrom(issuer, buyer, 1, 200, "");
        vm.stopPrank();

        // Deposit 10 ETH income: issuer has 800 shares, buyer has 200 shares
        vm.prank(issuer);
        dist.depositIncome{value: 10 ether}(1);

        assertEq(dist.pending(issuer, 1), 8 ether);
        assertEq(dist.pending(buyer, 1), 2 ether);
    }
}


