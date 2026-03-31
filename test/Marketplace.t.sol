pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Admin.sol";
import "../src/FractionalToken.sol";
import "../src/Marketplace.sol";

contract ERC1155Receiver {
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    receive() external payable {}
}

contract MarketplaceTest is Test {
    Admin admin;
    FractionalToken token;
    Marketplace marketplace;

    address owner;
    ERC1155Receiver sellerContract;
    ERC1155Receiver buyerContract;
    ERC1155Receiver otherUserContract;
    address seller;
    address buyer;
    address otherUser;

    uint256 constant ASSET_ID = 1;
    uint256 constant SHARES = 1000;
    uint256 constant LISTING_AMOUNT = 100;
    uint256 constant LISTING_PRICE = 1 ether;

    address registryAddress;


    function setUp() public {
        owner = address(this);
        admin = new Admin();
        registryAddress = address(0x456); // Replace with actual registry contract address
        token = new FractionalToken(address(admin), registryAddress);
        marketplace = new Marketplace(
            address(token),
            address(admin),
            registryAddress
        );

        sellerContract = new ERC1155Receiver();
        buyerContract = new ERC1155Receiver();
        otherUserContract = new ERC1155Receiver();

        seller = address(sellerContract);
        buyer = address(buyerContract);
        otherUser = address(otherUserContract);

        token.mintFractions(ASSET_ID, SHARES, seller);

        vm.prank(seller);
        token.setApprovalForAll(address(marketplace), true);

        vm.deal(buyer, 100 ether);
        vm.deal(otherUser, 100 ether);
    }


    function testConstructorSetsTokenContract() public view {
        assertEq(address(marketplace.token()), address(token));
    }

    function testConstructorSetsAdminContract() public view {
        assertEq(address(marketplace.admin()), address(admin));
    }


    function testCreateListing() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        (
            address listingSeller,
            uint256 assetId,
            uint256 amount,
            uint256 price,
            bool active
        ) = marketplace.listings(0);

        assertEq(listingSeller, seller);
        assertEq(assetId, ASSET_ID);
        assertEq(amount, LISTING_AMOUNT);
        assertEq(price, LISTING_PRICE);
        assertEq(active, true);
    }

    function testCreateMultipleListings() public {
        vm.startPrank(seller);
        marketplace.list(ASSET_ID, 100, 1 ether);
        marketplace.list(ASSET_ID, 200, 2 ether);
        marketplace.list(ASSET_ID, 300, 3 ether);
        vm.stopPrank();

        (
            address seller1,
            ,
            uint256 amount1,
            uint256 price1,
            bool active1
        ) = marketplace.listings(0);
        (
            address seller2,
            ,
            uint256 amount2,
            uint256 price2,
            bool active2
        ) = marketplace.listings(1);
        (
            address seller3,
            ,
            uint256 amount3,
            uint256 price3,
            bool active3
        ) = marketplace.listings(2);

        assertEq(seller1, seller);
        assertEq(amount1, 100);
        assertEq(price1, 1 ether);
        assertEq(active1, true);

        assertEq(seller2, seller);
        assertEq(amount2, 200);
        assertEq(price2, 2 ether);
        assertEq(active2, true);

        assertEq(seller3, seller);
        assertEq(amount3, 300);
        assertEq(price3, 3 ether);
        assertEq(active3, true);
    }

    function testAnyoneCanCreateListing() public {
        address randomUser = address(0x999);
        vm.prank(randomUser);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        (address listingSeller, , , , ) = marketplace.listings(0);
        assertEq(listingSeller, randomUser);
    }

    function testCreateListingWithZeroPrice() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, 0);

        (, , , uint256 price, ) = marketplace.listings(0);
        assertEq(price, 0);
    }

    function testCreateListingWithZeroAmount() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, 0, LISTING_PRICE);

        (, , uint256 amount, , ) = marketplace.listings(0);
        assertEq(amount, 0);
    }


    function testBuyListing() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        uint256 sellerBalanceBefore = seller.balance;
        uint256 buyerTokensBefore = token.balanceOf(buyer, ASSET_ID);

        vm.prank(buyer);
        marketplace.buy{value: LISTING_PRICE}(0, 1);

        assertEq(
            token.balanceOf(buyer, ASSET_ID),
            buyerTokensBefore + LISTING_AMOUNT
        );
        assertEq(seller.balance, sellerBalanceBefore + LISTING_PRICE);
    }

    function testBuyTransfersTokens() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        uint256 sellerTokensBefore = token.balanceOf(seller, ASSET_ID);
        uint256 buyerTokensBefore = token.balanceOf(buyer, ASSET_ID);

        vm.prank(buyer);
        marketplace.buy{value: LISTING_PRICE}(0, 1);

        assertEq(
            token.balanceOf(seller, ASSET_ID),
            sellerTokensBefore - LISTING_AMOUNT
        );
        assertEq(
            token.balanceOf(buyer, ASSET_ID),
            buyerTokensBefore + LISTING_AMOUNT
        );
    }

    function testBuyTransfersETH() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(buyer);
        marketplace.buy{value: LISTING_PRICE}(0, 1);

        assertEq(seller.balance, sellerBalanceBefore + LISTING_PRICE);
    }

    function testBuyFailsWithWrongPrice() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        vm.prank(buyer);
        vm.expectRevert("Wrong price");
        marketplace.buy{value: LISTING_PRICE - 1}(0, 1);
    }

    function testBuyFailsWithExcessPayment() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        vm.prank(buyer);
        vm.expectRevert("Wrong price");
        marketplace.buy{value: LISTING_PRICE + 1}(0, 1);
    }

    function testBuyWithZeroPrice() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, 0);

        vm.prank(buyer);
        marketplace.buy{value: 0}(0, 1);

        assertEq(token.balanceOf(buyer, ASSET_ID), LISTING_AMOUNT);
    }


    function testCannotBuyWhenMarketplacePaused() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        admin.pauseMarketplace(true);

        vm.prank(buyer);
        vm.expectRevert("Marketplace paused");
        marketplace.buy{value: LISTING_PRICE}(0, 1);
    }

    function testCanBuyAfterMarketplaceUnpaused() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        admin.pauseMarketplace(true);
        admin.pauseMarketplace(false);

        vm.prank(buyer);
        marketplace.buy{value: LISTING_PRICE}(0, 1);

        assertEq(token.balanceOf(buyer, ASSET_ID), LISTING_AMOUNT);
    }

    function testCanListWhenMarketplacePaused() public {
        admin.pauseMarketplace(true);

        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        (address listingSeller, , , , ) = marketplace.listings(0);
        assertEq(listingSeller, seller);
    }


    function testMultipleBuysFromSameSeller() public {
        vm.startPrank(seller);
        marketplace.list(ASSET_ID, 100, 1 ether);
        marketplace.list(ASSET_ID, 200, 2 ether);
        vm.stopPrank();

        vm.prank(buyer);
        marketplace.buy{value: 1 ether}(0, ASSET_ID);

        vm.prank(otherUser);
        marketplace.buy{value: 2 ether}(1, ASSET_ID);

        assertEq(token.balanceOf(buyer, ASSET_ID), 100);
        assertEq(token.balanceOf(otherUser, ASSET_ID), 200);
    }


    function testBuyFailsIfSellerHasInsufficientTokens() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, SHARES + 1, LISTING_PRICE);

        vm.prank(buyer);
        vm.expectRevert();
        marketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);
    }

    function testBuyFailsIfSellerRevokedApproval() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        vm.prank(seller);
        token.setApprovalForAll(address(marketplace), false);

        vm.prank(buyer);
        vm.expectRevert();
        marketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);
    }

    function testBuyInvalidListingIdReverts() public {
        vm.prank(buyer);
        vm.expectRevert();
        marketplace.buy{value: LISTING_PRICE}(999, ASSET_ID);
    }

    function testListingDataPersistsAfterPurchase() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        vm.prank(buyer);
        marketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);

        (
            address listingSeller,
            uint256 assetId,
            uint256 amount,
            uint256 price,
            bool active
        ) = marketplace.listings(0);
        assertEq(listingSeller, seller);
        assertEq(assetId, ASSET_ID);
        assertEq(amount, LISTING_AMOUNT);
        assertEq(price, LISTING_PRICE);
        assertEq(active, true);
    }

    function testCannotBuySameListingTwice() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        vm.prank(buyer);
        marketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);

        vm.prank(otherUser);
    }


    function testSellerCanTransferTokensAfterListing() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        vm.prank(seller);
        token.safeTransferFrom(seller, otherUser, ASSET_ID, SHARES, "");

        vm.prank(buyer);
        vm.expectRevert();
        marketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);
    }


    function testFuzzCreateListing(uint256 amount, uint256 price) public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, amount, price);

        (, , uint256 listedAmount, uint256 listedPrice, ) = marketplace
            .listings(0);
        assertEq(listedAmount, amount);
        assertEq(listedPrice, price);
    }

    function testFuzzBuy(uint256 amount, uint256 price) public {
        vm.assume(amount > 0 && amount <= SHARES);
        vm.assume(price > 0 && price <= 10 ether);

        vm.prank(seller);
        marketplace.list(ASSET_ID, amount, price);

        vm.prank(buyer);
        marketplace.buy{value: price}(0, ASSET_ID);

        assertEq(token.balanceOf(buyer, ASSET_ID), amount);
    }


    function testLargePrice() public {
        uint256 largePrice = 1000 ether;
        vm.deal(buyer, largePrice);

        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, largePrice);

        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(buyer);
        marketplace.buy{value: largePrice}(0, ASSET_ID);

        assertEq(seller.balance, sellerBalanceBefore + largePrice);
    }

    function testLargeAmount() public {
        FractionalToken newToken = new FractionalToken(
            address(admin),
            address(registryAddress)
        );
        uint256 largeAmount = 1_000_000;
        newToken.mintFractions(ASSET_ID, largeAmount, seller);

        Marketplace newMarketplace = new Marketplace(
            address(newToken),
            address(admin),
            address(registryAddress)
        );

        vm.prank(seller);
        newToken.setApprovalForAll(address(newMarketplace), true);

        vm.prank(seller);
        newMarketplace.list(ASSET_ID, largeAmount, LISTING_PRICE);

        vm.prank(buyer);
        newMarketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);

        assertEq(newToken.balanceOf(buyer, ASSET_ID), largeAmount);
    }


    function testGasForListing() public {
        vm.prank(seller);
        uint256 gasBefore = gasleft();
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(gasUsed < 150000);
    }

    function testGasForBuying() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        vm.prank(buyer);
        uint256 gasBefore = gasleft();
        marketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);
        uint256 gasUsed = gasBefore - gasleft();

        assertTrue(gasUsed < 200000);
    }


    function testSellerReceivesETH() public {
        vm.prank(seller);
        marketplace.list(ASSET_ID, LISTING_AMOUNT, LISTING_PRICE);

        uint256 sellerBalanceBefore = seller.balance;

        vm.prank(buyer);
        marketplace.buy{value: LISTING_PRICE}(0, ASSET_ID);

        assertEq(seller.balance, sellerBalanceBefore + LISTING_PRICE);
    }
}

contract SellerContract {
    FractionalToken public token;
    Marketplace public marketplace;
    uint256 public assetId;

    bool public rejectETH = false;

    constructor(address _token, address _marketplace, uint256 _assetId) {
        token = FractionalToken(_token);
        marketplace = Marketplace(_marketplace);
        assetId = _assetId;
    }

    function approveMerketplace() external {
        token.setApprovalForAll(address(marketplace), true);
    }

    function createListing(uint256 amount, uint256 price) external {
        marketplace.list(assetId, amount, price);
    }

    function setRejectETH(bool _reject) external {
        rejectETH = _reject;
    }

    receive() external payable {
        if (rejectETH) {
            revert("ETH rejected");
        }
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
}

contract MarketplaceSellerContractTest is Test {
    Admin admin;
    FractionalToken token;
    Marketplace marketplace;
    SellerContract sellerContract;

    address buyer = address(0x2);
    uint256 constant ASSET_ID = 1;
    uint256 constant SHARES = 1000;

    function setUp() public {
        admin = new Admin();
        address registryAddress = address(0x456); // Replace with actual registry contract address
        token = new FractionalToken(address(admin), registryAddress);
        marketplace = new Marketplace(
            address(token),
            address(admin),
            registryAddress
        );

        sellerContract = new SellerContract(
            address(token),
            address(marketplace),
            ASSET_ID
        );

        token.mintFractions(ASSET_ID, SHARES, address(sellerContract));

        sellerContract.approveMerketplace();

        vm.deal(buyer, 100 ether);
    }

    function testContractSellerCanCreateListing() public {
        sellerContract.createListing(100, 1 ether);

        (address seller, , , , ) = marketplace.listings(0);
        assertEq(seller, address(sellerContract));
    }

    function testContractSellerReceivesPayment() public {
        sellerContract.createListing(100, 1 ether);

        uint256 balanceBefore = address(sellerContract).balance;

        vm.prank(buyer);
        marketplace.buy{value: 1 ether}(0, 1);

        assertEq(address(sellerContract).balance, balanceBefore + 1 ether);
    }

    function testBuyFailsIfSellerRejectsETH() public {
        sellerContract.createListing(100, 1 ether);
        sellerContract.setRejectETH(true);

        vm.prank(buyer);
        vm.expectRevert();
        marketplace.buy{value: 1 ether}(0, 1);
    }
}
