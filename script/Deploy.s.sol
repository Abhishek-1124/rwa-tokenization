// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

import "../src/Admin.sol";
import "../src/AssetRegistry.sol";
import "../src/FractionalToken.sol";
import "../src/Marketplace.sol";
import "../src/IncomeDistributor.sol";
import "../src/HtsAdapter.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        Admin admin = new Admin();
        AssetRegistry registry = new AssetRegistry(address(admin));
        FractionalToken token = new FractionalToken(address(admin), address(registry));
        Marketplace market = new Marketplace(address(token), address(admin), address(registry));
        IncomeDistributor distributor = new IncomeDistributor(address(token), address(admin));

        // Wire income distributor into ERC-1155 transfers (Phase 2B)
        token.setIncomeDistributor(address(distributor));

        // Optional Phase 2C: HTS adapter
        HtsAdapter hts = new HtsAdapter(address(admin));

        vm.stopBroadcast();
    }
}
