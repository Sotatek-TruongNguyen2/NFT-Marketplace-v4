const { ethers } = require('hardhat');

const networkConfig = {
  31337: {
    name: 'hardhat',
    ethUsdPriceFeed: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    gasLane:
      '0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef', // 200 gwei Key Hash
    mintFee: '10000000000000000', // 0.01 ETH
    callbackGasLimit: '500000', // 500,000 gas
  },
  5: {
    name: 'goerli',
    ethUsdPriceFeed: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
    vrfCoordinatorV2: '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D',
    gasLane:
      '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15', // 30 gwei Key Hash
    mintFee: '10000000000000000', // 0.01 ETH
    callbackGasLimit: '500000', // 500,000 gas
    subscriptionId: '1490',
  },
};

const developmentChains = ['hardhat', 'localhost'];

const BASE_FEE = ethers.utils.parseEther('0.25');
// LINK per gas. Calculated value based on the gas price of the chain
const GAS_PRICE_LINK = 1e9; // 1000000000
const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000;

module.exports = {
  networkConfig,
  developmentChains,
  BASE_FEE,
  GAS_PRICE_LINK,
  DECIMALS,
  INITIAL_ANSWER,
};
