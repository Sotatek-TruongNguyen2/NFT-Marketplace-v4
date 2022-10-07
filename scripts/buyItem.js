const { network, ethers } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const run = require('../utils/runScript');
const moveBlocks = require('../utils/moveBlocks');

const isLocalNetwork = developmentChains.includes(network.name);
const tokenId = 1;

const buyItem = async () => {
  const nftMarketplace = await ethers.getContract('NFTMarketplace');
  const dynamicNFT = await ethers.getContract('DynamicNFT');
  const listingItem = await nftMarketplace.getListingItem(
    dynamicNFT.address,
    tokenId
  );
  const price = await listingItem.price.toString();

  const tx = await nftMarketplace.buyItem(dynamicNFT.address, tokenId, {
    value: price,
  });
  await tx.wait(1);

  console.log('>>>>>> Item bought!');

  if (isLocalNetwork) {
    await moveBlocks(2, (interval = 1000));
  }
};

run(buyItem);
