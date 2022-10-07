const run = require('../utils/runScript');
const moveBlocks = require('../utils/moveBlocks');

const blocks = 5;

const mine = async () => await moveBlocks(blocks);

run(mine);
