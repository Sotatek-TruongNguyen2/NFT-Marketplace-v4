const { assert, expect } = require('chai');
const { getNamedAccounts, deployments, network, ethers } = require('hardhat');
const { developmentChains } = require('../helper-hardhat-config');

const isLocalNetwork = developmentChains.includes(network.name);

!isLocalNetwork
  ? describe.skip
  : describe('Dynamic NFT Unit tests', () => {
      let dynamicNFT, deployer, tokenCounter;
      const { chainId } = network.config;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(['dynamicNFT']);

        dynamicNFT = await ethers.getContract('DynamicNFT', deployer);
      });

      describe('constructor', () => {
        it('Initialize variables correctly', async () => {
          const tokenCounter = await dynamicNFT.getTokenCounter();
          assert(tokenCounter, 0);
        });
      });

      describe('getCat', () => {
        it('Gets a correct cat based on mint fee', async () => {
          let i = 1;

          while (i <= 6) {
            const cat = await dynamicNFT.getCat(i);
            assert.equal(cat, i - 1);
            i++;
          }
        });

        it('Reverts when index is out of range', async () => {
          const index = 7;

          await expect(dynamicNFT.getCat(index)).to.be.revertedWithCustomError(
            dynamicNFT,
            'DynamicNFT__IndexOutOfRange'
          );
        });
      });

      describe('mintNFT', () => {
        it('Mints NFT, updates token counter & sets correct token URI', async () => {
          await new Promise(async (resolve, reject) => {
            const tokenCounterStart = await dynamicNFT.getTokenCounter();
            const index = 6;

            try {
              const tx = await dynamicNFT.mintNFT(index);
              const txReceipt = await tx.wait(1);
            } catch (error) {
              reject(error);
            }

            dynamicNFT.once('NFTMinted', async () => {
              try {
                // update token counter
                const tokenCounterEnd = await dynamicNFT.getTokenCounter();
                assert.equal(
                  tokenCounterEnd.toNumber(),
                  tokenCounterStart.toNumber() + 1
                );

                // set correct token URI
                const expectTokenURI = await dynamicNFT.tokenURI(
                  tokenCounterStart
                );
                const tokenURI = await dynamicNFT.getTokenURI(index);
                assert.equal(expectTokenURI, tokenURI);

                resolve();
              } catch (error) {
                reject(error);
              }
            });
          });
        });
      });
    });
