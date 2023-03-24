import { Contract, providers, utils, BigNumber } from "ethers";
import { EXCHANGE_CONTRACT_ABI, EXCHANGE_CONTRACT_ADDRESS } from "../constants";

/**
 * @dev 移除流动性，具体很多细节都在合约中处理了
 * @param removerLPTokenWei 需要多少流动性
 */
export const removeLiquidity = async (signer, removerLPTokenWei) => {
  try {
    // 1. 创建ExchangeContract合约实例对象
    const ExchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      signer
    );
    // 2. 调用ExchangeContract合约方法执行移除流动性
    const tx = await ExchangeContract.removeLiquidity(removerLPTokenWei);
    await tx.wait();
  } catch (err) {
    console.log(err);
  }
};

/**
 * @dev 假设移除流动性后，需要相应减少多少流动性->ETH和CDToken
 * @param provider 钱包连接器connect
 * @param removerLPTokenWei 需要移除的LPToken
 * @param _ethBalance 流动性池中的ETH数量
 * @param cryptoDevTokenReserve 流动性池中的CDToken数量
 * @description 注意哈，_ethBalance和cryptoDevTokenReserve是在调用本方法之前就已经获取到了的，其实完全可以在本方法中获取
 */
export const getTokenAfterRemove = async (
  provider,
  removerLPTokenWei,
  _ethBalance,
  cryptoDevTokenReserve
) => {
  try {
    // 1. 创建Exchange合约实例对象
    const ExchangeContract = new Contract(
      EXCHANGE_CONTRACT_ADDRESS,
      EXCHANGE_CONTRACT_ABI,
      provider
    );

    // 2. 获取Exchange目前有多少LPToken
    const _totalSupply = await ExchangeContract.totalSupply();

    // 2. 计算如果移除removerLPTokenWei比例的流动性，需要移除多少ETH
    const _removeEther = _ethBalance.mul(removeLiquidity.div(_totalSupply));
    // 3. 计算如果移除removerLPTokenWei比例的流动性，需要移除多少CDToken
    const _removeCDToken = cryptoDevTokenReserve.mul(
      removeLiquidity.div(_totalSupply)
    );
    return {
      _removeEther,
      _removeCDToken,
    };
  } catch (err) {
    console.log(err);
  }
};
