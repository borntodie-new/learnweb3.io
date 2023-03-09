import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useState, useRef } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

const Home = () => {
  //
  const zero = BigNumber.from(0);
  // 控制钱包是否已连接
  const [walletConnected, setWalletConnected] = useState(false);
  // 控制交易是否正在执行
  const [loading, setLoading] = useState(false);
  // 控制当前地址还有多少个NFT空投没有取完
  const [tokenToBeClaimed, setTokenToBeClaimed] = useState(zero);
  // 控制当前地址的Token个数
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState(zero);
  // 控制当前用户mint的Token数量
  const [tokensMinted, setTokenMinted] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [isOwner, setIsOwner] = useState(false);
  const web3ModalRef = useRef();

  // 获取当前用户的NFT空头还有多少没有取完
  const getTokensToBeClaimed = async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 创建NFT合约对象
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );
      // 3. 创建Token合约对象
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // 4. 使用NFT合约对象获取当前地址的NFT个数
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      if (balance === zero) {
        setTokenToBeClaimed(zero);
      } else {
        var amount = 0;
        for (var i = 0; i < balance; i++) {
          // 取出第i位的tokenId
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          // 判断这个tokenId是否已经领完空头
          const claimedOrNot = await tokenContract.tokenIdsClaimed(tokenId);
          // 如果claimedOrNot是False，就给amount+1
          if (!claimedOrNot) {
            amount += 1;
          }
        }
        // 设置tokenToBeClaimed变量
        setTokenToBeClaimed(BigNumber.from(amount));
      }
    } catch (err) {
      console.log(err);
      setTokenToBeClaimed(zero);
    }
  };
  // 获取当前用户的Token数量
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 创建tokenContract合约对象
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // 3. 调用合约函数获取Token
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      // 4. 设置balanceOfCryptoDevTokens变量
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.log(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  };
  // 当前用户mint Token
  const mintCryptoDevToken = async (amount) => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 创建tokenContract合约对象
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // 3. 调用合约函数执行mint操作
      const perTokenPrice = await tokenContract.tokenPrice();
      const value = perTokenPrice.mul(amount);
      const tx = await tokenContract.mint(amount, {
        value,
      });
      // 4. 等待交易执行完成
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Successfully minted Crypto Dev Tokens");
      // TODO ！！！
      await getTotalTokensMinted(); // 更新总mint数量
      await getBalanceOfCryptoDevTokens(); // 更新当前用户的Token个数
      await getTokensToBeClaimed(); // 更新当前用户还剩多少空投
    } catch (err) {
      console.log(err);
      setTokenMinted(zero);
    }
  };
  // 当前用户领NFT的空投
  const claimCryptoDevTokens = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 创建tokenContract合约对象
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // 3. 执行合约函数，领取空投
      const tx = await tokenContract.claim();
      // 4. 等待交易执行完成
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("Sucessfully claimed Crypto Dev Tokens");
      await getTotalTokensMinted(); // 更新总mint数量
      await getBalanceOfCryptoDevTokens(); // 更新当前用户的Token个数
      await getTokensToBeClaimed(); // 更新当前用户还剩多少空投
    } catch (err) {
      console.log(err);
    }
  };
  // 获取合约Token的总mint数量，注意区分maxTotalSupply，后者才是合约Token的总供应量，前者只是Token的的总mint量
  const getTotalTokensMinted = async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 创建tokenContract合约对象
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // 3. 调用合约函数获取Token的总mint量
      const _tokenMinted = await tokenContract.totalSupply();
      // 4. 设置tokenMinted变量
      setTokenMinted(_tokenMinted);
    } catch (err) {
      console.log(err);
      setTokenMinted(zero);
    }
  };
  // 判断当前地址是不是合约的管理员
  const getOwner = async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 创建tokenContract合约对象
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );
      // 3. 执行合约函数owner，获取合约的管理员地址
      const _owner = await tokenContract.owner();
      // 4. 比较当前地址和管理员地址是否一致
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (_owner.toLowerCase() === address.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.log(err);
    }
  };
  // 合约管理员取钱
  const withdrawCoins = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 创建tokenContract合约对象
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );
      // 3. 调用withdraw函数执行取钱操作
      const tx = await tokenContract.withdraw();
      // 4. 等待交易执行完成
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.log(err);
    }
  };
  // 获取Provider对象 ｜ Signer对象
  const getProviderOrSigner = async (needSigner = false) => {
    // 1. 获取钱包的provider对象
    const provider = await web3ModalRef.current.connect();
    // 2. 将钱包的provider对象交由Web3Modal管理
    const web3Provider = new providers.Web3Provider(provider);

    // 3. 判断网络
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
  // 连接钱包
  const connectWallet = async () => {
    try {
      // 1. 获取Provider对象
      await getProviderOrSigner();
      // 2. 设置walletConnected变量
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }
  };
  // 监听钱包连接情况
  useEffect(() => {
    if (!walletConnected) {
      // 1. 创建Web3Modal对象
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      // 2. 直接连接钱包
      connectWallet();
      // 3. 获取合约Token的总mint数量
      getTotalTokensMinted();
      // 4. 获取当前用户的Token数量
      getBalanceOfCryptoDevTokens();
      // 5. 获取当前用户的NFT空头还有多少没有取完
      getTokensToBeClaimed();
      // 6. 判断当前地址是不是合约的管理员
      getOwner();
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    if (tokenToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokenToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            className={styles.input}
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
          />
        </div>
        <button
          onClick={() => mintCryptoDevToken(tokenAmount)}
          className={styles.button}
          disabled={!(tokenAmount > 0)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };
  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
                Crypto Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
              {/* Display additional withdraw button if connected wallet is owner */}
              {isOwner ? (
                <div>
                  {loading ? (
                    <button className={styles.button}>Loading...</button>
                  ) : (
                    <button className={styles.button} onClick={withdrawCoins}>
                      Withdraw Coins
                    </button>
                  )}
                </div>
              ) : (
                ""
              )}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
};

export default Home;
