const { network } = require('hardhat');

const moveBlocks = async (blocks, interval = 0) => {
  console.log('>>>>>> Moving blocks...');

  for (let index = 0; index < blocks; index++) {
    setInterval(async () => {
      return await network.provider.request({
        method: 'evm_mine',
        params: [],
      });
    }, interval);
  }

  console.log(`>>>>>> Moved ${blocks} blocks`);
};

module.exports = moveBlocks;
