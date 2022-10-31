const { network } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const storeImagesAndMetadata = require('../utils/uploadToPinata');
const { verify } = require('../utils/verify');

const imgFilePath = '../images/nfts';

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isLocalNetwork = developmentChains.includes(network.name);
  // let tokenURIs = [];
  const waitConfirmations = network.config.blockConfirmations || 1;

  // Uploaded images and metadata to Pinata IPFS
  // Use the records here and not duplicate uploading again
  const tokenURIs = [
    'ipfs://QmSAsimJkGUYUDeHjrYNSdeLgd5WHVT6UNP78C4Zk4pgjk',
    'ipfs://QmYEEFbSnctc8i69oSNPVysZ11dHDAdiZ16kNMALKFhHBv',
    'ipfs://QmQmesTuPE2X5ZnqoM4Y9jTEzX9zQmVVVFzgqvvdhpmFry',
    'ipfs://QmNSkVVhDGwhzXFN6fHdC23hjaSx3p7nQdSiziJiY392w9',
    'ipfs://QmVAMuux5EVmy7PBPyWDKRm4d5Rqk92VUfbtfX4GDtc7BT',
    'ipfs://QmZ3aohHAXDmB5EudURfsVuqnQ8gcgp7Eix1fpX3KAAwUu',
  ];

  if (process.env.UPLOAD_TO_PINATA === 'true') {
    tokenURIs = await storeImagesAndMetadata(imgFilePath);
  }

  log('-----------------------------------------');

  const args = [tokenURIs];
  const dynamicNFT = await deploy('DynamicNFT', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  });

  if (!isLocalNetwork && process.env.ETHERSCAN_API_KEY) {
    await verify(dynamicNFT.address, args);
  }

  log('-----------------------------------------');
};

module.exports.tags = ['all', 'dynamicNFT'];
