require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

//* Default Template for Reference
/*
module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "mumbai",
  networks: {
    mumbai: {
      url: process.env.ALCHEMY_API_KEY_URL,
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.SCAN_KEY,
    },
  },
};
*/

// Configuration
/*
  solidity - The version of solidity compiler
  defaultNetwork - The Default network to run (Without running --network-name)
  networks - Object which contains the network information
  etherscan - Object to fill in EtherScan Information for contract verification
*/
module.exports = {
  solidity: "0.8.7",
  networks: {
    goerli: {
      url: ALCHEMY_API_KEY_URL,
      accounts: [WALLET_PRIVATE_KEY],
      chainId: 5,
    },
  },
};
// FakeNFTMarketplace address is 0x28d56ea67da7eBB2EA47b31e7F4Ce6a53D72f320
// cryptoDevsDAO address is 0x1467A99a94b4f302F3047008A9699b3c416ad483