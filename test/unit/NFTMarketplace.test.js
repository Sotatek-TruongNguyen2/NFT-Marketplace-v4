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
        nftMarketplace = nftMarketplaceContract.connect(deployer);

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
          nftMarketplace = nftMarketplaceContract.connect(player);
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
        it('Reverts if item is not canceled by owner', async () => {
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);

          nftMarketplace = nftMarketplaceContract.connect(player);
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

        it('Remove item from listing correctly & emits an event upon removal success', async () => {
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);
          expect(
            await nftMarketplace.cancelListing(dynamicNFT.address, tokenId)
          ).to.emit('ItemCanceled');

          const canceledItem = await nftMarketplace.getListingItem(
            dynamicNFT.address,
            tokenId
          );

          assert.equal(canceledItem.price.toNumber(), 0);
        });
      });

      describe('updateListing', () => {
        it('Reverts if item is not listed', async () => {
          await expect(
            nftMarketplace.updateListing(dynamicNFT.address, tokenId, price)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__TokenNotListed'
          );
        });

        it('Reverts if item is not updating by owner', async () => {
          nftMarketplace.listItem(dynamicNFT.address, tokenId, price);

          nftMarketplace = nftMarketplaceContract.connect(player);
          await dynamicNFT.approve(player.address, tokenId);

          await expect(
            nftMarketplace.updateListing(dynamicNFT.address, tokenId, price)
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__NotOwner'
          );
        });

        it('Updates item info correctly & emit an event upon update success', async () => {
          nftMarketplace.listItem(dynamicNFT.address, tokenId, price);

          const newPrice = ethers.utils.parseEther('0.02');
          expect(
            await nftMarketplace.updateListing(
              dynamicNFT.address,
              tokenId,
              newPrice
            )
          ).to.emit('ItemListed');

          const item = await nftMarketplace.getListingItem(
            dynamicNFT.address,
            tokenId
          );

          assert.equal(item.price.toString(), newPrice.toString());
        });
      });

      describe('buyItem', () => {
        it('Reverts if item is not listed', async () => {
          await expect(
            nftMarketplace.buyItem(dynamicNFT.address, tokenId, {
              value: price,
            })
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__TokenNotListed'
          );
        });

        it('Reverts if price is not met', async () => {
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);

          const lowPrice = ethers.utils.parseEther('0.005');

          await expect(
            nftMarketplace.buyItem(dynamicNFT.address, tokenId, {
              value: lowPrice,
            })
          ).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__PriceNotMet'
          );
        });

        it('Transfers NFT to buyer, updates earnings record, remove item from listings & emits an event for item bought', async () => {
          //  deployer (seller) list item
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);

          // player connect to market place
          nftMarketplace = nftMarketplaceContract.connect(player);

          // player buys the NFT
          expect(
            await nftMarketplace.buyItem(dynamicNFT.address, tokenId, {
              value: price,
            })
          ).to.emit('ItemBought'); // emits event

          // Transfers NFT to buyer
          const nftNewOwner = await dynamicNFT.ownerOf(tokenId);
          assert.equal(nftNewOwner.toString(), player.address);

          // Updates earnings record
          const sellerEarnings = await nftMarketplace.getEarnings(
            deployer.address
          );
          assert.equal(sellerEarnings.toString(), price.toString());

          // Remove item from listings
          const itemBought = await nftMarketplace.getListingItem(
            dynamicNFT.address,
            tokenId
          );

          assert.equal(itemBought.price.toString(), 0);
        });
      });

      describe('withdraw', () => {
        it('Reverts if there is no earnings', async () => {
          await expect(nftMarketplace.withdraw()).to.be.revertedWithCustomError(
            nftMarketplace,
            'NftMarketplace__NoEarnings'
          );
        });

        it('Updates earnings record during withdraw', async () => {});
        it('Seller can withdraws ETH successfully', async () => {
          //  deployer (seller) list item
          await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);
          // player connect to market place
          nftMarketplace = nftMarketplaceContract.connect(player);

          // player buys the NFT
          await nftMarketplace.buyItem(dynamicNFT.address, tokenId, {
            value: price,
          });

          // connect market place back to deployer for withdraw
          nftMarketplace = nftMarketplaceContract.connect(deployer);

          // get deployer (seller) balance
          const sellerBalanceStart = await deployer.getBalance();
          // withdraw
          const tx = await nftMarketplace.withdraw();
          const { gasUsed, effectiveGasPrice } = await tx.wait(1);
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const sellerBalanceEnd = await deployer.getBalance();
          // assert
          assert.equal(
            sellerBalanceEnd.add(gasCost).toString(),
            sellerBalanceStart.add(price).toString()
          );
        });

        it('Reverts if withdraw fails', async () => {});
      });
    });
