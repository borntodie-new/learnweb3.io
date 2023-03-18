import { Contract } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";

/**
 * @dev 获取从Exchange中能获得多少Token
 * @param provider 钱包连接器connect
 * @param _swapAmountWei 需要交换的token数量（可能是ETH的数量，可能是CDToken的数量）
 * @param ethSelected 标识_swapAmountWei是ETH害死CDToken
 * @param ethBalance 当前流动性池中的ETH数量
 * @param reservedCD 当前流动性池中的CDToken数量
 */
export const getAmountOfTokenReceivedFromSwap = async (
  provider,
  _swapAmountWei,
  ethSelected,
  ethBalance,
  reservedCD
) => {
  // 1. 获取ExchangeContract合约对象实例
  const ExchangeContract = new Contract(
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    provider
  );
  // 2. 判断ethSelected是否是ETH
  let amountOfTokens;
  if (ethSelected) {
    // 用ETH换CDToken
    amountOfTokens = await ExchangeContract.getAmountOfTokens(
      _swapAmountWei,
      ethBalance,
      reservedCD
    );
  } else {
    // 用CDToken换ETH
    amountOfTokens = await ExchangeContract.getAmountOfTokens(
      _swapAmountWei,
      reservedCD,
      ethBalance
    );
  }
  return amountOfTokens;
};

/**
 * @dev 执行交换逻辑
 * @param signer 钱包连接器connect
 * @param swapAmountWei 要交换的Token数量
 * @param tokenToBeReceivedAfterSwap swapAmountWei个token可以换多少token
 * @param ethSelected 怎么换：ETH-->CDToken 还是 CDToken-->ETH
 */
export const swapTokens = async (
  signer,
  swapAmountWei,
  tokenToBeReceivedAfterSwap,
  ethSelected
) => {
  try {
    // 1. 创建Exchange合约对象实例
    const ExchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
    // 2. 创建CDTokenContract合约对象实例
    const CDTokenContract = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      TOKEN_CONTRACT_ABI,
      signer
    );
    // 3. 判断交换方式
    let tx;
    if (ethSelected) {
      // ETH --》 CDToken
      tx = await ExchangeContract.ethToCryptoDevToken(
        tokenToBeReceivedAfterSwap,
        { value: swapAmountWei }
      );
      await tx.wait();
    } else {
      // CDToken --》 ETH
      // 1. 授权swapAmountWei个CDToken给流动性池
      tx = await CDTokenContract.approve(
        EXCHANGE_CONTRACT_ADDRESS,
        swapAmountWei.toString()
      );
      await tx.wait();
      // 2. 执行交换逻辑
      tx = await ExchangeContract.cryptoDevTokenToEth(
        swapAmountWei,
        tokenToBeReceivedAfterSwap
      );
      await tx.wait();
    }
  } catch (err) {
    console.log(err);
  }
};
