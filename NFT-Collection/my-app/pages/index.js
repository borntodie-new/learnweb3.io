import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";

const index = () => {
  // 控制钱包是否连接
  const [walletConnected, setWalletConnected] = useState(false);
  // 控制是否开启预售
  const [presaleStarted, setPresaleStarted] = useState(false);
  // 控制是否结束预售
  const [presaleEnded, setPresaleEnded] = useState(false);
  // 等待交易完成
  const [loading, setLoading] = useState(false);
  // 控制是否是管理员
  const [isOwner, setIsOwner] = useState(false);
  // 保存已经出售的NFT个数
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // web3Modal对象
  const web3ModalRef = useRef();

  /*
  1. presaleMint 预售功能
  2. publicMint 公售功能
  3. connectWallet 连接钱包
  4. startPresale 开启预售
  5. checkIfPresaleStarted 检测是否开启预售
  6. checkIfPresaleEnded 检测是否结束预售
  7. getOwner 获取管理员信息
  8. getTokenIdsMinted 获取已出售个数
  9. getProviderOrSigner 获取Provider | Signer 连接器
  */

  const presaleMint = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true)
      // 2. 创建合约对象
      const cryptoDevsContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      // 3. 执行合约函数
      const tx = await cryptoDevsContract.presaleMint({
        value: utils.parseEther("0.01")
      })
      setLoading(true)
      await tx.wait()
      setLoading(false)
        window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.log(err)
    }
  }
  const publicMint = async () => {
    // 1. 获取Signer对象
    const signer = await getProviderOrSigner(true)
    // 2. 创建合约对象
    const cryptoDevsContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
    // 3. 执行合约函数
    const tx = await cryptoDevsContract.mint({
      value: utils.parseEther("0.01")
    })
    setLoading(true)
    await tx.wait()
    setLoading(false)
    window.alert("You successfully minted a Crypto Dev!")
  }
  const connectWallet = async () => {
    try {
      await getProviderOrSigner()
      setWalletConnected(true)  
    } catch (err) {
      console.log(err)
    }
  }
  const getOwner =  async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 创建合约对象
      const cryptoDevsContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // 3. 执行合约函数
      const _owner = await cryptoDevsContract.owner();
      // 4. 获取当前钱包的地址
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();

      // 5. 判断当前小狐狸的账户是否是合约管理员
      if (_owner.toLowerCase() === address.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const getTokenIdsMinted = async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 创建合约对象
      const cryptoDevsContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // 3. 执行合约函数
      const _tokenIds = await cryptoDevsContract.tokenIds();
      // 4. 保存当前已被mint的NFT个数
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.log(err);
    }
  };
  const startPresale = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true)
      // 2. 创建合约对象
      const cryptoDevsContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      // 3. 调用合约函数
      const tx = await cryptoDevsContract.startPresale()
      setLoading(true)
      await tx.wait()
      setLoading(false)
      
    } catch (err) {
      console.log(err)
    }
  }
  const checkIfPresaleStarted = async ()=>{
    try{ 
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner()
      // 2. 创建合约对象
      const cryptoDevsContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      // 3. 调用合约方法
      const _presaleStarted  = await cryptoDevsContract.presaleStarted()  
      if (!_presaleStarted) { // 还没开启预售，
        await getOwner()
      }
      setPresaleStarted(_presaleStarted)
      return _presaleStarted
    }catch(err) {
      console.log(err)
      return false
    }
  }
  const checkIfPresaleEnded = async () => {
    try {
      // 1. 获取Provider对象
      const provider =  await getProviderOrSigner()
      // 2. 创建合约对象
      const cryptoDevsContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider)
      // 3. 执行合约函数
      const _presaleEnded = await cryptoDevsContract.presaleEnded()

      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000)) // 小于，未结束
      if (hasEnded) {
        setPresaleEnded(true)
      }else{
        setPresaleEnded(false)
      }
      return hasEnded
      
    } catch (err) {
      console.log(err)
      return false
    }
  }
  const getProviderOrSigner = async (needSigner = false) => {
    try {
      // 1. 获取metamask的provider
      const provider = await web3ModalRef.current.connect();
      // 2. metamask的provider交给web3Modal管理
      const web3Provider = new providers.Web3Provider(provider);
      // 3. 判断网络的chainId
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Change the network to Goerli");
        throw new error("CHange the network to Goerli");
      }
      // 4. 判断需要返回什么Provider对象
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    } catch (err) {
      console.log(err);
    }
  };
  const withdraw = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true)
      // 2. 创建合约对象
      const cryptoDevsContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer)
      // 3. 调用合约函数
      const tx = await cryptoDevsContract.withdraw()
      setLoading(true)
      await tx.wait()
      setLoading(false)
      window.alert("successfully")
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(()=>{
    /**
    * 1. 一开始肯定没来连接钱包，需要初始化Web3Modal对象
    * 2. 
    */
    // 1. 判断是否连接了钱包
    if (!walletConnected) {
      // 初始化Web3Modal对象
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      })
      // 连接钱包
      connectWallet()
      // 判断是否开启预售
      const _presaleStarted = checkIfPresaleStarted()
      if (_presaleStarted) {
        // 开启了预售，判断是否结束了预售
        checkIfPresaleEnded()
      }
      // 获取出售的NFT个数
      getTokenIdsMinted()
      // 开启定时器
      const presaleEndedInterval  = setInterval(async () => {
        const _presaleStarted = await checkIfPresaleStarted()
        if (_presaleStarted) {
          // 开启了预售，判断是否结束了预售
          const _presaleEnded = await checkIfPresaleEnded()
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval)
          }
        }
      }, 5 * 1000) 
      
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected])


  const renderButton = () => {
    if (!walletConnected) {
      return (<button className={styles.button} onClick={connectWallet}>Connect your wallet</button>
      )
    }
    if (loading) {
      return <button className={styles.button}>Loading...</button>
    }
    if(isOwner && !presaleStarted) {
      return <button className={styles.button} onClick={startPresale}>Start Presale!</button>
    }
    if(!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasn&#39;t started!</div>
        </div>
      )
    }
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto 
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
          <div></div>
        </div>
      )
    }
    if (presaleStarted && presaleEnded) {
      return <button className={styles.button} onClick={publicMint}>Public Mint 🚀</button>
    }
  }
  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            It&#39;s an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>{tokenIdsMinted} / 20 have been minted</div>
          {renderButton()}
        </div>
        <div>
          <img src="./cryptodevs/0.svg" alt="" className={styles.image} />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
};

export default index;
