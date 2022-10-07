const { network, ethers } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const run = require('../utils/runScript');
const moveBlocks = require('../utils/moveBlocks');

const isLocalNetwork = developmentChains.includes(network.name);
const tokenId = 0;

const cancelItem = async () => {
  const nftMarketplace = await ethers.getContract('NFTMarketplace');
  const dynamicNFT = await ethers.getContract('DynamicNFT');

  const tx = await nftMarketplace.cancelListing(dynamicNFT.address, tokenId);
  await tx.wait(1);

  console.log('>>>>>> Item Canceled!');

  if (isLocalNetwork) {
    await moveBlocks(2, (interval = 1000));
  }
};

run(cancelItem);
