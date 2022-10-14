// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__PriceNotMet(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__TokenAlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__TokenNotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotOwner();
error NftMarketplace__NoEarnings();
error NftMarketplace__WithdrawFailed();

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    // NFT contract address => NFT Token ID => Listing
    // {
    //     contractAddress: {
    //         tokenId: {
    //             price: 123,
    //             seller: 'bob'
    //         }
    //     }
    // }
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    // Seller address => Amount earned
    mapping(address => uint256) private s_earnings;

    // Modifiers
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];

        if (listing.price > 0) {
            revert NftMarketplace__TokenAlreadyListed(nftAddress, tokenId);
        }

        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];

        if (listing.price <= 0) {
            revert NftMarketplace__TokenNotListed(nftAddress, tokenId);
        }

        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);

        if (spender != owner) {
            revert NftMarketplace__NotOwner();
        }

        _;
    }

    /**
     * @notice Method for listing your NFT on the marketplace
     * @param nftAddress: Address of the NFT contract
     * @param tokenId: Token ID of the NFT
     * @param price: Sale price of the listed NFT
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }

        IERC721 nft = IERC721(nftAddress);

        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketplace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);

        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        nonReentrant
        isListed(nftAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];

        if (msg.value < listedItem.price) {
            revert NftMarketplace__PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }

        // Money Transfer
        // https://fravoll.github.io/solidity-patterns/pull_over_push.html
        // Sending the money to the user directly ❌
        // Have them withdraw the money ✅

        // Record seller earnings
        s_earnings[listedItem.seller] =
            s_earnings[listedItem.seller] +
            msg.value;

        // Remove NFT token from mapping once bought
        delete (s_listings[nftAddress][tokenId]);

        // Transfer ETH
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );

        // Check to make sure the NFT was transfered
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdraw() external {
        uint256 earnings = s_earnings[msg.sender];

        if (earnings <= 0) {
            revert NftMarketplace__NoEarnings();
        }

        // reset state before sending payments
        s_earnings[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: earnings}('');

        if (!success) {
            revert NftMarketplace__WithdrawFailed();
        }
    }

    // Getter functions
    function getListingItem(address nftAddress, uint256 tokenId)
        public
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getEarnings(address seller) public view returns (uint256) {
        return s_earnings[seller];
    }
}
