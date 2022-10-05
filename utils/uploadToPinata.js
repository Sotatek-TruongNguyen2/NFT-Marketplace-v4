const pinataSDK = require('@pinata/sdk');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;
const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
const metadataTemplate = {
  name: '',
  description: '',
  image: '',
  attributes: [
    {
      trait_type: 'Cuteness',
      value: 100,
    },
  ],
};

const storeImagesAndMetadata = async (imgFilePath) => {
  const imgDir = path.resolve(__dirname, imgFilePath);
  const files = fs.readdirSync(imgDir);
  const tokenURIs = [];

  console.log('>>>>>> Uploading files & metadata to IPFS...');
  console.log('>>>>>>', files);

  for (index in files) {
    const fileName = files[index];
    const catName = fileName.split('.')[0].replace('-', ' ');
    const filePath = path.resolve(imgDir, fileName);
    const readableStreamForFile = fs.createReadStream(filePath);

    try {
      // Store the image in IPFS
      const pinFileResp = await pinata.pinFileToIPFS(readableStreamForFile);
      console.log(`>>>>>> Upload ${fileName} image to IPFS success!`);

      const description = `A cute ${catName} cat!`;
      const image = `ipfs://${pinFileResp.IpfsHash}`;

      const tokenURIMetadata = Object.assign({}, metadataTemplate, {
        name: catName,
        description,
        image,
      });

      const metadataOptions = {
        pinataMetadata: {
          name: fileName.replace('.png', '.json'),
        },
      };

      try {
        // Store the metadata in IPFS
        const pinJsonResp = await pinata.pinJSONToIPFS(
          tokenURIMetadata,
          metadataOptions
        );

        console.log(`>>>>>> Upload ${fileName} metadata to IPFS success!`);
        const tokenURI = `ipfs://${pinJsonResp.IpfsHash}`;

        tokenURIs.push(tokenURI);
      } catch (error) {
        console.log('>>>>>> Error when pinning metadata:');
        console.error(error);
      }
    } catch (error) {
      console.log('>>>>>> Error when uploading image:');
      console.error(error);
    }
  }

  console.log('>>>>>> token URIs', tokenURIs);
  return tokenURIs;
};

module.exports = storeImagesAndMetadata;
