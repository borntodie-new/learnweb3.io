const { ethers } = require("hardhat");
const { CRYPTODEVS_NFT_CONTRACT_ADDRESS } = require("../constants");
async function main() {
  // 获取合约工厂类
  const cryptoDevsDAO = await ethers.getContractFactory("CryptoDevsDAO");
  const fakeNFTMarketplace = await ethers.getContractFactory(
    "FakeNFTMarketplace"
  );
  // 部署NFT交易市场合约
  const fakeNFTMarketplaceContract = await fakeNFTMarketplace.deploy();
  await fakeNFTMarketplaceContract.deployed();
  // 部署DAO合约
  const cryptoDevsDAOContract = await cryptoDevsDAO.deploy(
    fakeNFTMarketplaceContract.address,
    CRYPTODEVS_NFT_CONTRACT_ADDRESS,
    {
      value: ethers.utils.parseEther("0.01"),
    }
  );

  // 等待合约部署完成
  await cryptoDevsDAOContract.deployed();
  console.log(
    `FakeNFTMarketplace address is ${fakeNFTMarketplaceContract.address}, and CryptoDevsDAO address is ${cryptoDevsDAOContract.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
