// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import 'hardhat/console.sol';

error DynamicNFT__IndexOutOfRange();

contract DynamicNFT is ERC721URIStorage {
    // using SafeMath for uint256;

    enum CatType {
        GREY,
        GREYWHITE,
        PINKWHITE,
        WHITE,
        RED,
        REDWHITE
    }

    string[6] internal s_catTokenURIs;
    uint256 private s_tokenCounter;
    CatType internal s_catType;

    // Events
    event NFTMinted(address indexed owner, CatType indexed catType);

    constructor(string[6] memory catTokenURIs)
        ERC721('Dynamic Cat NFT', 'DCN')
    {
        s_catTokenURIs = catTokenURIs;
        s_tokenCounter = 0;
    }

    function mintNFT(uint256 index) public {
        uint256 newTokenId = s_tokenCounter;
        s_catType = getCat(index);

        s_tokenCounter = s_tokenCounter + 1;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, s_catTokenURIs[uint256(s_catType)]);

        emit NFTMinted(msg.sender, s_catType);
    }

    function getCat(uint256 index) public pure returns (CatType) {
        if (index > 6) {
            revert DynamicNFT__IndexOutOfRange();
        }

        uint256 idx = SafeMath.sub(index, 1);
        return CatType(idx);
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getTokenURI(uint256 index) public view returns (string memory) {
        return s_catTokenURIs[index - 1];
    }
}
