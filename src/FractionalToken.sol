// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

interface IAdminRoles {
    function isIssuer(address) external view returns (bool);
    function isManagerForToken(address _manager, uint256 _tokenId) external view returns (bool);
    function owner() external view returns (address);
}

interface IAssetRegistry {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract FractionalToken is ERC1155 {
    mapping(uint256 => uint256) public totalShares;

    IAdminRoles public immutable admin;
    IAssetRegistry public immutable registry;

    event FractionsMinted(uint256 indexed assetId, address indexed to, uint256 shares, address indexed caller);
    event IncomeDistributorSet(address indexed distributor);

    address public incomeDistributor;

    constructor(address _admin, address _registry) ERC1155("") {
        require(_admin != address(0) && _registry != address(0), "Invalid address");
        admin = IAdminRoles(_admin);
        registry = IAssetRegistry(_registry);
    }

    function setIncomeDistributor(address distributor) external {
        require(msg.sender == admin.owner(), "Not admin");
        incomeDistributor = distributor;
        emit IncomeDistributorSet(distributor);
    }

    function mintFractions(uint256 assetId, uint256 shares, address owner) external {
        require(totalShares[assetId] == 0, "Already fractionalized");
        require(owner != address(0), "Invalid owner");
        require(shares > 0, "Invalid shares");

        // Ensure the asset exists and is controlled by the caller (or a manager).
        address assetOwner = registry.ownerOf(assetId);
        bool isTokenManager = admin.isManagerForToken(msg.sender, assetId);
        require(assetOwner == msg.sender || isTokenManager, "Not authorized");
        // If caller isn't the asset owner, ensure they are at least an issuer (platform staff path).
        if (assetOwner != msg.sender) {
            require(admin.isIssuer(msg.sender), "Not issuer");
        }

        totalShares[assetId] = shares;
        _mint(owner, assetId, shares, "");
        emit FractionsMinted(assetId, owner, shares, msg.sender);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal virtual override {
        address dist = incomeDistributor;

        uint256[] memory oldFromBalances;
        uint256[] memory oldToBalances;
        if (dist != address(0)) {
            // Capture pre-update balances for accurate income accounting without calling out before state changes.
            oldFromBalances = new uint256[](ids.length);
            oldToBalances = new uint256[](ids.length);
            for (uint256 i = 0; i < ids.length; i++) {
                uint256 id = ids[i];
                oldFromBalances[i] = from == address(0) ? 0 : balanceOf(from, id);
                oldToBalances[i] = to == address(0) ? 0 : balanceOf(to, id);
            }
        }

        super._update(from, to, ids, values);

        if (dist != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                uint256 id = ids[i];
                uint256 value = values[i];

                uint256 oldFrom = oldFromBalances[i];
                uint256 oldTo = oldToBalances[i];

                uint256 newFrom = from == address(0) ? 0 : (oldFrom - value);
                uint256 newTo = to == address(0) ? 0 : (oldTo + value);

                // Notify distributor (best effort; should not block transfers)
                (bool ok, ) = dist.call(
                    abi.encodeWithSignature(
                        "onBalanceChange(address,address,uint256,uint256,uint256,uint256,uint256)",
                        from,
                        to,
                        id,
                        oldFrom,
                        newFrom,
                        oldTo,
                        newTo
                    )
                );
                ok; // silence warning
            }
        }
    }
}
