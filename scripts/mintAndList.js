const { network, ethers } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const run = require('../utils/runScript');
const moveBlocks = require('../utils/moveBlocks');

const isLocalNetwork = developmentChains.includes(network.name);
const price = ethers.utils.parseEther('0.01');

const mintAndList = async () => {
  const nftMarketplace = await ethers.getContract('NFTMarketplace');
  const dynamicNFT = await ethers.getContract('DynamicNFT');
  const randomNumber = Math.floor(Math.random() * 6);

  console.log('>>>>>> Minting NFT...');
  const mintTx = await dynamicNFT.mintNFT(randomNumber);
  const mintTxReceipt = await mintTx.wait(1);
  const { tokenId } = mintTxReceipt.events[0].args;

  console.log('>>>>>> NFT minted! Approving NFT...');
  const approvalTx = await dynamicNFT.approve(nftMarketplace.address, tokenId);
  await approvalTx.wait(1);

  console.log('>>>>>> NFT approved! Listing NFT...');
  const tx = await nftMarketplace.listItem(dynamicNFT.address, tokenId, price);
  await tx.wait(1);

  console.log('>>>>>> NFT listed!');

  if (isLocalNetwork) {
    // Moralis has a hard time if you move more than 1 at once!
    await moveBlocks(1, (interval = 1));
  }
};

run(mintAndList);
