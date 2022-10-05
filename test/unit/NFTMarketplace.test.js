const { assert, expect } = require('chai');
const { getNamedAccounts, deployments, network, ethers } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');

const isLocalNetwork = developmentChains.includes(network.name);

!isLocalNetwork
  ? describe.skip
  : describe('NFT Marketplace Unit tests', () => {
      let dynamicNFTContract,
        nftMarketplaceContract,
        dynamicNFT,
        nftMarketplace,
        deployer,
        player;
      const { chainId } = network.config;
      const price = ethers.utils.parseEther('0.01');
      const tokenId = 0;

      beforeEach(async () => {
        // gets back signer address only
        // deployer = (await getNamedAccounts()).deployer;
        // player = (await getNamedAccounts()).player;
        // console.log('>>>>>> deployer', deployer);
        // console.log('>>>>>> player', player);

        // gets back `SignerWithAddress` object
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        player = accounts[1];

        await deployments.fixture(['all']);

        // connect both NFT & market place to deployer first
        // to get pass `isOwner` modifer check
        dynamicNFTContract = await ethers.getContract('DynamicNFT');
        // connect function requires`SignerWithAddress` object
        dynamicNFT = await dynamicNFTContract.connect(deployer);

        nftMarketplaceContract = await ethers.getContract('NFTMarketplace');
        nftMarketplace = await nftMarketplaceContract.connect(deployer);

        // mint NFT
        await dynamicNFT.mintNFT(4);
        // approve for market place
        await dynamicNFT.approve(nftMarketplace.address, tokenId);
      });

      describe('listItem', () => {
        it('Reverts if price is less than zero', async () => {
          await expect(
            nftMarketplace.listItem(dynamicNFT.address, tokenId, 0)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__PriceMustBeAboveZero'
          );
        });

        it('Updates listing with seller & price', async () => {
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);
          const listings = await nftMarketplace.getListingItem(
            dynamicNFT.address,
            tokenId
          );

          assert.equal(listings.seller, deployer.address);
          assert.equal(listings.price.toString(), price.toString());
        });

        it('Emits an event after listing an item', async () => {
          expect(
            await nftMarketplace.listItem(dynamicNFT.address, tokenId, price)
          ).to.emit('ItemListed');
        });

        it('Reverts if NFT item is already listed', async () => {
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);

          await expect(
            nftMarketplace.listItem(dynamicNFT.address, tokenId, price)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__TokenAlreadyListed'
          );
        });

        it('Reverts if NFT item is not approved for marketplace', async () => {
          await dynamicNFT.approve(player.address, tokenId);

          await expect(
            nftMarketplace.listItem(dynamicNFT.address, tokenId, price)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__NotApprovedForMarketplace'
          );
        });

        it('Reverts if NFT item is not listed by owner', async () => {
          // connect market place to player
          // NFT is now owned by deployer (deployer minted in `beforeEach`)
          // this will trigger `isOwner` modifier check error
          nftMarketplace = await nftMarketplaceContract.connect(player);
          dynamicNFT.approve(player.address, tokenId);

          await expect(
            nftMarketplace.listItem(dynamicNFT.address, tokenId, price)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__NotOwner'
          );
        });
      });

      describe('cancelListing', () => {
        it('Reverts if listing is not canceled by owner', async () => {
          nftMarketplace = await nftMarketplaceContract.connect(player);
          await dynamicNFT.approve(player.address, tokenId);

          await expect(
            nftMarketplace.cancelListing(dynamicNFT.address, tokenId)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__NotOwner'
          );
        });

        it('Reverts if canceled item is not listed', async () => {
          await expect(
            nftMarketplace.cancelListing(dynamicNFT.address, tokenId)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__TokenNotListed'
          );
        });

        it('Updates listing correctly', async () => {
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);
          await nftMarketplace.cancelListing(dynamicNFT.address, tokenId);

          const canceledItem = await nftMarketplace.getListingItem(
            dynamicNFT.address,
            tokenId
          );

          assert.equal(canceledItem.price.toNumber(), 0);
        });

        it('Emits an event after cancel listing', async () => {
          await nftMarketplace.listItem(dynamicNFT.addrses, tokenId, price);

          expect(
            await nftMarketplace.cancelListing(dynamicNFT.address, tokenId)
          ).to.emit('ItemCanceled');
        });
      });
    });
