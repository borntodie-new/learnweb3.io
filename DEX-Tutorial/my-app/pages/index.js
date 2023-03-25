import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
  getCDTokensBalance,
  getEtherBalance,
  getLPTokenBalance,
  getReverseOfCDTokens,
} from "../utils/getAmounts";
import { getTokenAfterRemove, removeLiquidity } from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokenReceivedFromSwap } from "../utils/swap";
export default function Home() {
  // 控制交易是否完成
  const [loading, setLoading] = useState(false);
  // 控制显示添加流动性页面
  const [liquidityTab, setLiquidityTab] = useState(true);
  // 申明零值
  const zero = BigNumber.from(0);

  // 控制当前账户的ETH余额
  const [ethBalance, setEthBalance] = useState(zero);
  // 控制当前账户的CD余额
  const [cdBalance, setCdBalance] = useState(zero);

  // 控制流动性池中的CD储备
  const [reservedCD, setReservedCD] = useState(zero);
  // 控制流动性池中的ETH储备
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);

  // 控制当前账户的LPToken余额
  const [lpBalance, setLpBalance] = useState(zero);

  // 控制当前账户想要添加的ETH流动性个数
  const [addEther, setAddEther] = useState(zero);
  // 控制当前账户想要添加的CDToken流动性个数，应该和addEther成比例
  const [addCDTokens, setAddCDTokens] = useState(zero);

  // 控制当前用户想要移除多少ETH流动性
  const [removeEther, setRemoveEther] = useState(zero);
  // 控制当前用户想要移除多少CDToken流动性
  const [removeCD, setRemoveCD] = useState(zero);
  // 控制当前用户想要移除多少LPToken流动性
  const [removeLPTokens, setRemoveLPTokens] = useState("0");

  // 控制当前用户想要swap多少流动性
  const [swapAmount, setSwapAmount] = useState(zero);

  // 控制是否是用ETH买CDToken
  const [ethSelected, setEthSelected] = useState(true);

  // 控制当前用户输入的钱能够买多少Token
  const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] =
    useState(zero);

  // 控制web3Modal对象
  const web3ModalRef = useRef();

  // 控制是否连接钱包
  const [walletConnected, setWalletConnected] = useState(false);

  // 获取合约各种数据：ETH储备、CDToken储备、LPToken储备...
  /**
   * @dev 获取合约各种数据：ETH储备、CDToken储备、LPToken储备...
   * @description
   * 1. 获取流动性池中的ETH储备
   * 2. 获取流动性池中的CDToken储备
   * 3. 获取流动性池中的LPToken储备
   * 4. 获取当前用户的ETH余额
   * 5. 获取当前用户的CDToken余额
   * 6. 获取当前用户的LPToken余额
   */
  const getAmounts = async () => {
    try {
      // 1. 获取Provider实例和Signer实例
      const provider = await getProviderOrSigner();
      const signer = await getProviderOrSigner(true);
      // 2. 当前用户地址
      const address = await signer.getAddress();
      // 3. 获取当前用户的ETH余额
      const _ethBalance = await getEtherBalance(provider, address);
      // 4. 获取当前用户的CDToken余额
      const _cdBalance = await getCDTokensBalance(provider, address);
      // 5. 获取当前用户的LPToken余额
      const _lpBalance = await getLPTokenBalance(provider, address);
      // 6. 获取流动性池中的ETH储备
      const _reservedETH = await getEtherBalance(provider, "", true);
      // 7. 获取流动性池中的CDToken储备
      const _reservedCDToken = await getReverseOfCDTokens(provider); // 这是通过ExchangeContract中getReserve方法获取，没有直接通过CryptoDevContract中的balanceOf()方法获取ExchageContract合约在其中的余额
      // 8. 设置好变量
      setEthBalance(_ethBalance);
      setCdBalance(_cdBalance);
      setLpBalance(_lpBalance);
      setReservedCD(_reservedCDToken);
      setEtherBalanceContract(_reservedETH);
    } catch (err) {
      console.log(err);
    }
  };
  // 购买流动性
  const _swapTokens = async () => {
    try {
      // 1. 获取用户输入的数据-》想花多少钱买Token
      const swapAmountWei = utils.parseEther(swapAmount);
      if (!swapAmountWei.eq(zero)) {
        // 2. 获取Signer实例
        const signer = await getProviderOrSigner(true);
        setLoading(true);
        // 3. 调用合约方法购买逻辑
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
        await getAmounts();
        setSwapAmount("");
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      setSwapAmount("");
    }
  };
  /**
   * @dev 获取当前用户输入的数据计算出能收到多少个Token
   * @param _swapAmount 当前用户输入的数据
   */
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      const _swapAmountWei = utils.parseEther(_swapAmount);
      if (!_swapAmountWei.eq(zero)) {
        const provider = await getProviderOrSigner();
        const _ethBalance = await getEtherBalance(provider, "", true);
        const amountOfTokens = await getAmountOfTokenReceivedFromSwap(
          provider,
          _swapAmountWei,
          ethSelected,
          _ethBalance,
          cdBalance
        );
        setTokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        setTokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.log(err);
      setTokenToBeReceivedAfterSwap(zero);
    }
  };

  // 添加流动性
  const _addLiquidity = async () => {
    try {
      const addEtherWei = utils.parseEther(addEther);
      if (!addEtherWei.eq(zero) && !addCDTokens.eq(zero)) {
        // 1. 获取Signer实例
        const signer = await getProviderOrSigner(true);
        // 2. 等待交易执行
        setLoading(true);
        await addLiquidity(signer, addCDTokens, addEtherWei);
        setLoading(false);
        setAddCDTokens(zero);
        await getAmounts();
      } else {
        setAddCDTokens(zero);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // 移除流动性
  const _removeLiquidity = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const removeLPTokensWei = utils.parseEther(removeLPTokens);
      setLoading(true);
      await removeLiquidity(signer, removeLPTokensWei);
      setLoading(false);
      await getAmounts();
      setRemoveCD(zero);
      setRemoveEther(zero);
    } catch (err) {
      console.error(err);
      setLoading(false);
      setRemoveCD(zero);
      setRemoveEther(zero);
    }
  };

  // 获取移除流动性后的各类Token数量
  const _getTokensAfterRemove = async () => {
    try {
      const provider = await getProviderOrSigner();
      // Convert the LP tokens entered by the user to a BigNumber
      const removeLPTokenWei = utils.parseEther(removeLPTokens);
      // Get the Eth reserves within the exchange contract
      const _ethBalance = await getEtherBalance(provider, null, true);
      // get the crypto dev token reserves from the contract
      const cryptoDevTokenReserve = await getReverseOfCDTokens(provider);
      // call the getTokensAfterRemove from the utils folder
      const { _removeEther, _removeCD } = await getTokenAfterRemove(
        provider,
        removeLPTokenWei,
        _ethBalance,
        cryptoDevTokenReserve
      );
      setRemoveEther(_removeEther);
      setRemoveCD(_removeCD);
    } catch (err) {
      console.error(err);
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }
  };

  // 获取Provider或者Signer对象
  const getProviderOrSigner = async (needSigner = false) => {
    try {
      // 1. 获取Metamask的Provider对象
      const provider = await web3ModalRef.current().connect();
      // 2. 将Provider对象交由给Web3Modal管理
      const web3Provider = new providers.Web3Provider(provider);
      // 3. 判断当前网络是否是Goerli
      const { chainId } = web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Change the network to Goerli");
        throw new Error("Change the network to Goerli");
      }
      if (needSigner) {
        // 4. 返回Signer对象
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    } catch (err) {
      console.log(err);
    }
  };

  // 监听钱包地址变化
  useEffect(() => {
    if (walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getAmounts();
    }
  }, [walletConnected]);

  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (liquidityTab) {
      return (
        <div>
          <div className={styles.description}>
            You have:
            <br />
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {utils.formatEther(cdBalance)} Crypto Dev Tokens
            <br />
            {utils.formatEther(ethBalance)} Ether
            <br />
            {utils.formatEther(lpBalance)} Crypto Dev LP tokens
          </div>
          <div>
            {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
            how much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
            {utils.parseEther(reservedCD.toString()).eq(zero) ? (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={(e) => setAddEther(e.target.value || "0")}
                  className={styles.input}
                />
                <input
                  type="number"
                  placeholder="Amount of CryptoDev tokens"
                  onChange={(e) =>
                    setAddCDTokens(
                      BigNumber.from(utils.parseEther(e.target.value || "0"))
                    )
                  }
                  className={styles.input}
                />
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="number"
                  placeholder="Amount of Ether"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    // calculate the number of CD tokens that
                    // can be added given  `e.target.value` amount of Eth
                    const _addCDTokens = await calculateCD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedCD
                    );
                    setAddCDTokens(_addCDTokens);
                  }}
                  className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                  {`You will need ${utils.formatEther(addCDTokens)} Crypto Dev
                  Tokens`}
                </div>
                <button className={styles.button1} onClick={_addLiquidity}>
                  Add
                </button>
              </div>
            )}
            <div>
              <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0");
                  // Calculate the amount of Ether and CD tokens that the user would receive
                  // After he removes `e.target.value` amount of `LP` tokens
                  await _getTokensAfterRemove(e.target.value || "0");
                }}
                className={styles.input}
              />
              <div className={styles.inputDiv}>
                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                {`You will get ${utils.formatEther(removeCD)} Crypto
              Dev Tokens and ${utils.formatEther(removeEther)} Eth`}
              </div>
              <button className={styles.button1} onClick={_removeLiquidity}>
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "");
              // Calculate the amount of tokens user would receive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
            }}
            className={styles.input}
            value={swapAmount}
          />
          <select
            className={styles.select}
            name="dropdown"
            id="dropdown"
            onChange={async () => {
              setEthSelected(!ethSelected);
              // Initialize the values back to zero
              await _getAmountOfTokensReceivedFromSwap(0);
              setSwapAmount("");
            }}
          >
            <option value="eth">Ethereum</option>
            <option value="cryptoDevToken">Crypto Dev Token</option>
          </select>
          <br />
          <div className={styles.inputDiv}>
            {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
            {ethSelected
              ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Crypto Dev Tokens`
              : `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Eth`}
          </div>
          <button className={styles.button1} onClick={_swapTokens}>
            Swap
          </button>
        </div>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs Exchange!</h1>
          <div className={styles.description}>
            Exchange Ethereum &#60;&#62; Crypto Dev Tokens
          </div>
          <div>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(true);
              }}
            >
              Liquidity
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setLiquidityTab(false);
              }}
            >
              Swap
            </button>
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodev.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
