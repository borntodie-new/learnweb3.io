require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });
/** @type import('hardhat/config').HardhatUserConfig */
const quick_node_rpc_url = process.env.QUICKNODE_HTTP_URL;
const private_key = process.env.PRIVATE_KEY;
module.exports = {
  solidity: "0.8.7",
  networks: {
    goerli: {
      url: quick_node_rpc_url,
      accounts: [private_key],
      chainId: 5,
    },
  },
};

// CryptoDevToken contract address 0x17Ba3461F979b1A2805EeBa3D68A46d6EedE26e6
