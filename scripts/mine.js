const run = require('../utils/runScript');
const moveBlocks = require('../utils/moveBlocks');

const blocks = 5;

run(await moveBlocks(blocks));
