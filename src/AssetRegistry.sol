// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

interface IAdmin {
    function isIssuer(address) external view returns (bool);
    function isManagerForToken(address _manager, uint256 _tokenId) external view returns (bool);
}

contract AssetRegistry is ERC721, ERC2981 {
    uint256 public assetCount;
    // Stores the off-chain backing reference. Prefer passing a full URI like:
    // - ipfs://<CID> (metadata JSON)
    // - https://gateway.example/ipfs/<CID>
    mapping(uint256 => string) public assetIPFS;
    IAdmin public admin;

    uint96 public constant DEFAULT_ROYALTY_BPS = 500; // 5% (fee denominator = 10_000)

    event AssetCreated(
        uint256 indexed assetId,
        address indexed issuer,
        string metadataURI,
        address royaltyReceiver,
        uint96 royaltyBps
    );
    event AssetRoyaltyUpdated(uint256 indexed assetId, address indexed receiver, uint96 royaltyBps);

    constructor(address _admin) ERC721("RWA Asset", "RWA") {
        admin = IAdmin(_admin);
    }

    function createAsset(string memory metadataURI) external {
        require(admin.isIssuer(msg.sender), "Not issuer");

        assetCount++;
        _mint(msg.sender, assetCount);
        assetIPFS[assetCount] = metadataURI;

        // Default royalties to the asset issuer.
        _setTokenRoyalty(assetCount, msg.sender, DEFAULT_ROYALTY_BPS);

        emit AssetCreated(assetCount, msg.sender, metadataURI, msg.sender, DEFAULT_ROYALTY_BPS);
    }

    function setAssetRoyalty(uint256 assetId, address receiver, uint96 royaltyBps) external {
        require(admin.isIssuer(msg.sender), "Not issuer");
        require(receiver != address(0), "Invalid receiver");
        require(royaltyBps <= _feeDenominator(), "Royalty too high");

        // Asset owner or designated manager can adjust.
        bool isTokenManager = admin.isManagerForToken(msg.sender, assetId);
        require(ownerOf(assetId) == msg.sender || isTokenManager, "Not authorized");

        _setTokenRoyalty(assetId, receiver, royaltyBps);
        emit AssetRoyaltyUpdated(assetId, receiver, royaltyBps);
    }

    function assetExists(uint256 assetId) external view returns (bool) {
        return _ownerOf(assetId) != address(0);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent asset");
        return assetIPFS[tokenId];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
