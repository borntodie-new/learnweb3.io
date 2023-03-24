import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

// 通过Provider对象获取address的balance
/**
 * @dev 通过Provider对象获取address的ETH
 * @param provider 钱包连接器connect
 * @param address 获取address得ETH
 * @param contract 是否需要获取流动性池的ETH
 */
export const getEtherBalance = async (provider, address, contract = false) => {
  try {
    if (contract) {
      const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
      return balance;
    } else {
      const balance = await provider.getBalance(address);
      return balance;
    }
  } catch (err) {
    console.log(err);
    return 0;
  }
};

/**
 * @dev 获取address的CryptoDevToken的balance
 * @param provider 钱包连接器connect
 * @param address 需要获取balance的地址
 */
export const getCDTokensBalance = async (provider, address) => {
  try {
    // 1. 创建CryptoDevContract实例对象
    const CryptoDevTokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      provider
    );
    // 2. 调用合约方法获取address的Token数量
    const _balance = await CryptoDevTokenContract.balanceOf(address);
    // 3. 返回数据
    return _balance;
  } catch (err) {
    console.log(err);
    return 0;
  }
};

/**
 * @dev 获取address在LPToken中的balance
 * @param provider 钱包连接器connect
 * @param address 需要获取balance的地址
 */
export const getLPTokenBalance = async (provider, address) => {
  try {
    // 1. 创建ExchangeContract实例对象
    const ExchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    // 2. 调用合约方法获取address的Token数量
    const _balance = await ExchangeContract.balanceOf(address);
    // 3. 返回数据
    return _balance;
  } catch (err) {
    console.log(err);
    return 0;
  }
};

/**
 * @dev 获取流行性池中有多少个CryptoDevToken
 * @param provider 钱包连接器connect
 */
export const getReverseOfCDTokens = async (provider) => {
  try {
    // 1. 创建ExchangeContract实例对象
    const ExchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );
    // 2. 调用合约方法获取CryptoDevToken的数量
    const reverse = await ExchangeContract.getReserve();
    // 3. 返回数据
    return reverse;
  } catch (err) {
    console.log(err);
    return 0;
  }
};

// 这里需要捋一捋，getCDTokensBalance和getReverseOfCDTokens是不是有重复了。
// getCDTokensBalance方法是获取的是传入进来的地址的Token余额
// getReverseOfCDTokens方法是获取当前合约中有多少CryptoDevToken
// 我们可不可以这样，当需要获取Exchange合约在CryptoDevTokenContract有多少个Token的时候，直接使用getCDTokensBalance方法？？？？
