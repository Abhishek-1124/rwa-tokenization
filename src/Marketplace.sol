// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FractionalToken.sol";
import "./Admin.sol";
import "./AssetRegistry.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ERC1155Holder, ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 assetId;
        uint256 amountRemaining;
        uint256 pricePerUnit; // wei per fraction unit
        bool active;
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    FractionalToken public token;
    Admin public admin;
    AssetRegistry public registry;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed assetId,
        uint256 amount,
        uint256 pricePerUnit
    );
    event ListingCancelled(uint256 indexed listingId);
    event ListingPriceUpdated(uint256 indexed listingId, uint256 oldPricePerUnit, uint256 newPricePerUnit);
    event Purchased(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 indexed assetId,
        uint256 amount,
        uint256 totalPrice
    );
    event RoyaltyPaid(uint256 indexed assetId, address indexed receiver, uint256 amount);

    struct Offer {
        address bidder;
        uint256 listingId;
        uint256 amount;
        uint256 pricePerUnit;
        bool active;
    }

    uint256 public offerCount;
    mapping(uint256 => Offer) public offers;

    event OfferMade(uint256 indexed offerId, uint256 indexed listingId, address indexed bidder, uint256 amount, uint256 pricePerUnit);
    event OfferCancelled(uint256 indexed offerId);
    event OfferAccepted(uint256 indexed offerId, uint256 indexed listingId, address indexed seller, address bidder, uint256 amount, uint256 totalPrice);

    constructor(address _token, address _admin, address _registry) {
        token = FractionalToken(_token);
        admin = Admin(_admin);
        registry = AssetRegistry(_registry);
    }

    function list(uint256 assetId, uint256 amount, uint256 pricePerUnit) external nonReentrant returns (uint256 listingId) {
        require(!admin.marketplacePaused(), "Marketplace paused");
        require(amount > 0, "Invalid amount");
        require(pricePerUnit > 0, "Invalid price");

        // Ensure underlying asset exists (helps UI and prevents garbage ids).
        require(registry.assetExists(assetId), "Asset not found");

        // Seller must approve marketplace to transfer their ERC1155 fractions into escrow.
        require(token.isApprovedForAll(msg.sender, address(this)), "Approve marketplace first");

        // Escrow the fractions in the marketplace for safer fills/cancellations.
        token.safeTransferFrom(msg.sender, address(this), assetId, amount, "");

        listingId = ++listingCount;
        listings[listingId] = Listing({
            seller: msg.sender,
            assetId: assetId,
            amountRemaining: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });

        emit Listed(listingId, msg.sender, assetId, amount, pricePerUnit);
    }

    function cancel(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Inactive listing");
        require(msg.sender == l.seller, "Not seller");

        l.active = false;

        uint256 remaining = l.amountRemaining;
        l.amountRemaining = 0;

        if (remaining > 0) {
            token.safeTransferFrom(address(this), l.seller, l.assetId, remaining, "");
        }

        emit ListingCancelled(listingId);
    }

    function updatePrice(uint256 listingId, uint256 newPricePerUnit) external {
        Listing storage l = listings[listingId];
        require(l.active, "Inactive listing");
        require(msg.sender == l.seller, "Not seller");
        require(newPricePerUnit > 0, "Invalid price");

        uint256 old = l.pricePerUnit;
        l.pricePerUnit = newPricePerUnit;
        emit ListingPriceUpdated(listingId, old, newPricePerUnit);
    }

    function buy(uint256 listingId, uint256 amount) external payable nonReentrant {
        require(!admin.marketplacePaused(), "Marketplace paused");
        require(amount > 0, "Invalid amount");

        Listing storage l = listings[listingId];
        require(l.active, "Inactive listing");
        require(amount <= l.amountRemaining, "Not enough liquidity");

        uint256 totalPrice = amount * l.pricePerUnit;
        require(msg.value == totalPrice, "Wrong price");

        // Effects first
        l.amountRemaining -= amount;
        if (l.amountRemaining == 0) {
            l.active = false;
        }

        // Transfer fractions from escrow to buyer
        token.safeTransferFrom(address(this), msg.sender, l.assetId, amount, "");

        // Royalties on secondary sales (uses ERC2981 data from AssetRegistry)
        (address royaltyReceiver, uint256 royaltyAmount) = registry.royaltyInfo(l.assetId, totalPrice);
        uint256 sellerAmount = totalPrice - royaltyAmount;

        if (royaltyAmount > 0) {
            (bool royaltyOk, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyOk, "Royalty transfer failed");
            emit RoyaltyPaid(l.assetId, royaltyReceiver, royaltyAmount);
        }

        (bool sellerOk, ) = payable(l.seller).call{value: sellerAmount}("");
        require(sellerOk, "ETH transfer failed");

        emit Purchased(listingId, msg.sender, l.assetId, amount, totalPrice);
    }

    function makeOffer(uint256 listingId, uint256 amount, uint256 pricePerUnit) external payable nonReentrant returns (uint256 offerId) {
        require(!admin.marketplacePaused(), "Marketplace paused");
        require(amount > 0, "Invalid amount");
        require(pricePerUnit > 0, "Invalid price");

        Listing storage l = listings[listingId];
        require(l.active, "Inactive listing");
        require(amount <= l.amountRemaining, "Not enough liquidity");

        uint256 totalPrice = amount * pricePerUnit;
        require(msg.value == totalPrice, "Wrong price");

        offerId = ++offerCount;
        offers[offerId] = Offer({
            bidder: msg.sender,
            listingId: listingId,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });

        emit OfferMade(offerId, listingId, msg.sender, amount, pricePerUnit);
    }

    function cancelOffer(uint256 offerId) external nonReentrant {
        Offer storage o = offers[offerId];
        require(o.active, "Inactive offer");
        require(o.bidder == msg.sender, "Not bidder");

        o.active = false;

        uint256 refund = o.amount * o.pricePerUnit;
        (bool ok, ) = payable(o.bidder).call{value: refund}("");
        require(ok, "ETH transfer failed");

        emit OfferCancelled(offerId);
    }

    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage o = offers[offerId];
        require(o.active, "Inactive offer");

        Listing storage l = listings[o.listingId];
        require(l.active, "Inactive listing");
        require(msg.sender == l.seller, "Not seller");
        require(o.amount <= l.amountRemaining, "Not enough liquidity");

        // Effects
        o.active = false;
        l.amountRemaining -= o.amount;
        if (l.amountRemaining == 0) l.active = false;

        uint256 totalPrice = o.amount * o.pricePerUnit;

        // Transfer fractions from escrow to bidder
        token.safeTransferFrom(address(this), o.bidder, l.assetId, o.amount, "");

        // Royalties
        (address royaltyReceiver, uint256 royaltyAmount) = registry.royaltyInfo(l.assetId, totalPrice);
        uint256 sellerAmount = totalPrice - royaltyAmount;
        if (royaltyAmount > 0) {
            (bool royaltyOk, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyOk, "Royalty transfer failed");
            emit RoyaltyPaid(l.assetId, royaltyReceiver, royaltyAmount);
        }

        (bool sellerOk, ) = payable(l.seller).call{value: sellerAmount}("");
        require(sellerOk, "ETH transfer failed");

        emit OfferAccepted(offerId, o.listingId, l.seller, o.bidder, o.amount, totalPrice);
    }
}
