require('@nomicfoundation/hardhat-toolbox');
require('hardhat-deploy');
require('hardhat-contract-sizer');
require('dotenv').config();

const {
  RINKEBY_RPC_URL,
  GOERLI_ALCHEMY_URL,
  GOERLI_INFURA_URL,
  ETHEREUM_MAINNET_RPC_URL,
  PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [{ version: '0.8.17' }],
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
    },
    localhost: {
      chainId: 31337,
      blockConfirmations: 1,
      url: 'http://127.0.0.1:8545',
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: false, // set to true when needs a report
    outputFile: 'gas-report.md',
    noColors: true,
    // currency: 'USD',
    token: 'MATIC',
  },
  mocha: {
    timeout: 2000000, // ms
  },
};
