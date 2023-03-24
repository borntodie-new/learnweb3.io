import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * @dev 添加流动性
 * @param signer: 当前钱包连接对象
 * @param addCDAmountWei: 需要添加多少个CryptoDevToken，以Wei为单位
 * @param addEtherAmountWei: 需要添加多少个ETH，以Wei为单位
 */
export const addLiquidity = async (
  signer,
  addCDAmountWei,
  addEtherAmountWei
) => {
  try {
    // 1. 创建CryptoDevContract合约对象实例
    const CDContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );
    // 2. 创建Exchange合约对象实例
    const ExchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
    // 3. 授权addCDAmountWei个CD给EXCHANGE_CONTRACT_ADDRESS
    let tx = await CDContract.approve(
      EXCHANGE_CONTRACT_ADDRESS,
      addCDAmountWei
    );
    await tx.wait();
    // 4. 调用Exchange合约方法执行添加流动性方法
    tx = await ExchangeContract.addLiquidity(addCDAmountWei, {
      value: addEtherAmountWei,
    });
    await tx.wait();
  } catch (err) {
    console.log;
  }
};

/**
 * @dev 计算_addEther个ETH可以换多少个CDToken，这里不是说换，而是计算ETH和CDToken多少成比例
 * @param _addEther ETH的个数
 * @param etherBalanceContract Exchange的ETH个数
 * @param cdTokenReserve Exchange的CDToken个数
 */
export const calculateCD = async (
  _addEther = "0",
  etherBalanceContract,
  cdTokenReserve
) => {
  const _addEtherAmountWei = utils.parseEther(_addEther);
  return _addEtherAmountWei.mul(cdTokenReserve).div(etherBalanceContract);
};

// 疑问：我们这里定义了一个通过ETH计算能出多少个CDToken的方法，
// 那需不需要定义一个通过CDToken计算出能出多少个ETH的方法？？？
