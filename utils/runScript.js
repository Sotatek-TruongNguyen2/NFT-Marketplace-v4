const run = (asyncFunc) => {
  asyncFunc()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
};

module.exports = run;
