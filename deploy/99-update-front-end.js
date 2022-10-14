const { network, ethers } = require('hardhat');
const fs = require('fs-extra');
const path = require('path');

const moralisFrontEndDir = path.resolve(
  __dirname,
  '../../web3-nft-marketplace-nextjs-moralis'
);
const MORALIS_ADDRESSES_FILE = path.resolve(
  moralisFrontEndDir,
  'constants/contractAddresses.json'
);
const MORALIS_MARKETPLACE_ABI = path.resolve(
  moralisFrontEndDir,
  'constants/marketplaceAbi.json'
);
const MORALIS_DYNAMIC_NFT_ABI = path.resolve(
  moralisFrontEndDir,
  'constants/dynamicNFTAbi.json'
);
const theGraphFrontEndDir = path.resolve(
  __dirname,
  '../../web3-nft-marketplace-nextjs-thegraph'
);
const THE_GRAPH_ADDRESSES_FILE = path.resolve(
  theGraphFrontEndDir,
  'constants/contractAddresses.json'
);
const THE_GRAPH_MARKETPLACE_ABI = path.resolve(
  theGraphFrontEndDir,
  'constants/marketplaceAbi.json'
);
const THE_GRAPH_DYNAMIC_NFT_ABI = path.resolve(
  theGraphFrontEndDir,
  'constants/dynamicNFTAbi.json'
);

const abiFileMapping = {
  NFTMarketplace: {
    moralis: MORALIS_MARKETPLACE_ABI,
    theGraph: THE_GRAPH_MARKETPLACE_ABI,
  },
  DynamicNFT: {
    moralis: MORALIS_DYNAMIC_NFT_ABI,
    theGraph: THE_GRAPH_DYNAMIC_NFT_ABI,
  },
};

const addressesMapping = {
  moralis: MORALIS_ADDRESSES_FILE,
  theGraph: THE_GRAPH_ADDRESSES_FILE,
};

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log('>>>>>> Updating ABI & contract addresses for front end... ');

    const NFTMarketplace = await ethers.getContract('NFTMarketplace');
    const DynamicNFT = await ethers.getContract('DynamicNFT');

    const contracts = {
      NFTMarketplace,
      DynamicNFT,
    };

    await updateContractAddresses({ targetProject: 'moralis', contracts });
    await updateContractAddresses({ targetProject: 'theGraph', contracts });
    await updateAbi({ targetProject: 'moralis', contracts });
    await updateAbi({ targetProject: 'theGraph', contracts });
  }
};

async function updateContractAddresses({ targetProject, contracts }) {
  const addressesFile = addressesMapping[targetProject];
  let addressesData = JSON.stringify({});

  if (!fs.existsSync(addressesFile)) {
    fs.createFileSync(addressesFile);
  } else {
    addressesData = fs.readFileSync(addressesFile, {
      encoding: 'utf-8',
    });
  }

  const addressRecords = JSON.parse(addressesData);
  const addressObj = {};

  for (const name in contracts) {
    addressObj[name] = contracts[name].address;
  }

  const chainId = network.config.chainId.toString();

  if (chainId in addressRecords) {
    for (const name in addressObj) {
      addressRecords[chainId][name] = addressObj[name];
    }
  } else {
    addressRecords[chainId] = addressObj;
  }

  try {
    fs.writeFileSync(addressesFile, JSON.stringify(addressRecords, null, 2));
    console.log(
      `>>>>>> ${targetProject} front end contract addresses updated success!`
    );
  } catch (error) {
    console.log(
      `>>>>>> ${targetProject} front end contract addresses update failed!`
    );
    console.error(error);
  }

  console.log('--------------------------------------------------');
}

async function updateAbi({ targetProject, contracts }) {
  for (const name in contracts) {
    const contract = contracts[name];
    const abiFile = abiFileMapping[name][targetProject];

    if (!fs.existsSync(abiFile)) {
      fs.createFileSync(abiFile);
    }

    const abiData = contract.interface.format(ethers.utils.FormatTypes.json);

    try {
      fs.writeFileSync(abiFile, abiData);
      console.log(
        `>>>>>> ${targetProject} front end ABI file updated success!`
      );
    } catch (error) {
      console.log(`>>>>>> ${targetProject} front end ABI file updated failed!`);
      console.error(error);
    }

    console.log('--------------------------------------------------');
  }
}

module.exports.tags = ['all', 'frontend'];
