const { network, ethers } = require('hardhat');
const fs = require('fs-extra');
const path = require('path');

const moralisFrontEndDir = path.resolve(
  __dirname,
  '../../web3-nft-marketplace-nextjs-moralis'
);
// const theGraphFrontEndDir = path.resolve(
//   __dirname,
//   '../../web3-nft-marketplace-nextjs-theGraph'
// );
const ADDRESSES_FILE_MORALIS = path.resolve(
  moralisFrontEndDir,
  'constants/contractAddresses.json'
);
const MARKETPLACE_ABI_MORALIS = path.resolve(
  moralisFrontEndDir,
  'constants/marketplace-abi.json'
);
// const ADDRESSES_FILE_THE_GRAPH = path.resolve(
//   theGraphFrontEndDir,
//   'constants/contractAddresses.json'
// );
// const MARKETPLACE_ABI_THE_GRAPH = path.resolve(
//   theGraphFrontEndDir,
//   'constants/marketplace-abi.json'
// );

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log('>>>>>> Updating ABI & contract addresses for front end... ');

    const NFTMarketplace = await ethers.getContract('NFTMarketplace');

    await updateContractAddresses(NFTMarketplace);
    await updateAbi(NFTMarketplace);
  }
};

async function updateContractAddresses(contract) {
  let addressData = JSON.stringify({});

  if (!fs.existsSync(ADDRESSES_FILE_MORALIS)) {
    fs.createFileSync(ADDRESSES_FILE_MORALIS);
  } else {
    addressData = fs.readFileSync(ADDRESSES_FILE_MORALIS, {
      encoding: 'utf-8',
    });
  }

  console.log('>>>>>> address data', addressData);
  const addressRecords = JSON.parse(addressData);
  const contractAddress = contract.address;
  const chainId = network.config.chainId.toString();

  if (chainId in addressRecords) {
    const chainRecord = addressRecords[chainId];

    if (!chainRecord.NFTMarketplace) {
      chainRecord.NFTMarketplace = [contractAddress];
    } else if (!chainRecord.NFTMarketplace.includes(contractAddress)) {
      chainRecord.NFTMarketplace.push(contractAddress);
    }
  } else {
    addressRecords[chainId] = { NFTMarketplace: [contractAddress] };
  }

  try {
    fs.writeFileSync(
      ADDRESSES_FILE_MORALIS,
      JSON.stringify(addressRecords, null, 2)
    );
    console.log('>>>>>> Front end contract addresses updated success!');
  } catch (error) {
    console.log('>>>>>> Front end contract addresses update failed!');
    console.error(error);
  }

  console.log('--------------------------------------------------');
}

async function updateAbi(contract) {
  if (!fs.existsSync(MARKETPLACE_ABI_MORALIS)) {
    fs.createFileSync(MARKETPLACE_ABI_MORALIS);
  }

  const abiData = contract.interface.format(ethers.utils.FormatTypes.json);

  try {
    fs.writeFileSync(MARKETPLACE_ABI_MORALIS, abiData);
    console.log('>>>>>> Front end ABI file updated success!');
  } catch (error) {
    console.log('>>>>>> Front end ABI file updated failed!');
    console.error(error);
  }

  console.log('--------------------------------------------------');
}

module.exports.tags = ['all', 'frontend'];
