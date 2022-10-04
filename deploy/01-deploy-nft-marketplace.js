const { network } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isLocalNetwork = developmentChains.includes(network.name);

  const args = [];
  const waitConfirmations = network.config.blockConfirmations || 1;

  log('-----------------------------------------');

  const nftMarketplace = await deploy('NFTMarketplace', {
    from: deployer,
    args,
    log: true,
    waitConfirmations,
  });

  if (!isLocalNetwork && process.env.ETHERSCAN_API_KEY) {
    await verify(nftMarketplace.address, args);
  }

  log('-----------------------------------------');
};
