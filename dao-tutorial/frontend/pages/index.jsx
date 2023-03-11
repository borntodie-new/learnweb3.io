import { Contract, providers } from "ethers";
import { formatEther, recoverAddress, SigningKey } from "ethers/lib/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  CRYPTODEVS_DAO_ABI,
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,
  CRYPTODEVS_NFT_ABI,
  CRYPTODEVS_NFT_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // 控制DAO中筹集到的资金
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  // 控制目前DAO中存在的Proposal个数
  const [numProposals, setNumProposals] = useState("0");
  // 控制DAO中所有的Proposals信息
  const [proposals, setProposals] = useState([]);
  // 控制当前地址的CryptoDevs NFT的个数
  const [nftBalance, setNftBalance] = useState(0);
  // 当前Proposal中的tokenID
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  // One of "Create Proposal" or "View Proposal"
  const [selectedTab, setSelectedTab] = useState("");
  // 控制交易是否完成
  const [loading, setLoading] = useState(false);
  // 控制用户钱包是否连接
  const [walletConnected, setWalletConnected] = useState(false);
  // 控制当前用户是否是合约管理员
  const [isOwner, setIsOwner] = useState(false);
  const web3ModalRef = useRef();

  /**
   * connectWallet: 连接钱包
   * */
  const connectWallet = async () => {
    try {
      // 1. 获取Provider对象
      await getProviderOrSigner();
      // 2. 更新walletConnected变量
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * getOwner: 获取DAO合约的管理员地址
   */
  const getDAOOwner = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 获取DAO合约实例
      const DAOContract = getDaoContractInstance(signer);
      // 3. 调用合约函数获取DAOOwner信息
      const _owner = await DAOContract.owner();
      // 4. 获取当前地址信息
      const address = await signer.getAddress();
      // 5. 更新isOwner变量
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * withdrawCoins: DAO管理员用户取除DAO中的钱
   */
  const withdrawDAOEther = async () => {
    // 1. 获取SIgner对象
    const signer = await getProviderOrSigner(true);
    // 2. 获取DAO合约对象实例
    const DAOContract = getDaoContractInstance(signer);
    // 3. 执行合约函数取钱
    const tx = await DAOContract.withdrawEther();
    // 4. 等待交易执行
    setLoading(true);
    await tx.wait();
    setLoading(false);
    // 更新下treasuryBalance变量
    await getDAOTreasuryBalance();
  };

  /**
   * getDAOTreasuryBalance: 获取DAO合约中筹集到的钱
   */
  const getDAOTreasuryBalance = async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 执行合约函数获取DAO中的余额
      const balance = await provider.getBalance(
        CRYPTODEVS_DAO_CONTRACT_ADDRESS
      );
      // 3. 设置treasuryBalance变量
      setTreasuryBalance(balance.toString());
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * getNumProposalsInDAO: 获取DAO合约中的Proposal的个数
   */
  const getNumProposalsInDAO = async () => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 获取DAO合约对象实例
      const DAOContract = getDaoContractInstance(provider);
      // 3. 执行合约函数获取Proposal个数
      const _numberProposal = await DAOContract.numProposal();
      // 4. 更新numberProposals变量
      setNumProposals(_numberProposal.toString());
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * getUserNFTBalance: 获取当前地址的NFT个数
   */
  const getUserNFTBalance = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 获取CryptoDevs NFT合约对象实例
      const cryptoDevsNFTContract = getCryptodevsNFTContractInstance(signer);
      // 3. 获取当前用户的地址信息
      const address = await signer.getAddress();
      // 4. 执行合约函数获取当前地址的NFT个数
      const _balanceOf = await cryptoDevsNFTContract.balanceOf(address);
      // 5. 更新nftBalance变量
      setNftBalance(_balanceOf.toString());
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * createProposal: 对DAO进行提交Proposal
   * */
  const createProposal = async () => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 获取DAO合约对象实例
      const DAOContract = getDaoContractInstance(signer);
      // 3. 调用合约函数执行发布Proposal操作
      console.log(fakeNftTokenId);
      const tx = await DAOContract.createProposal(fakeNftTokenId);
      // 4. 等待交易执行
      setLoading(true);
      await tx.wait();
      setLoading(false);
      // 5. 更新numProposals变量
      await getNumProposalsInDAO();
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * fetchProposalById: 更具ProposalId获取Proposal信息
   */
  const fetchProposalById = async (id) => {
    try {
      // 1. 获取Provider对象
      const provider = await getProviderOrSigner();
      // 2. 获取DAO合约实例对象
      const DAOContract = getDaoContractInstance(provider);
      // 3. 执行合约函数获取Proposal的信息
      const _proposal = await DAOContract.proposals(id);
      // 4. 构建返回对象
      const parsedProposal = {
        proposalId: id,
        nftTokenId: _proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(_proposal.deadline.toString()) * 1000),
        yayVotes: _proposal.yayVotes.toString(),
        nayVotes: _proposal.nayVotes.toString(),
        executed: _proposal.executed,
      };
      return parsedProposal;
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * fetchAllProposals: 获取DAO中全部的Proposals信息
   */
  const fetchAllProposals = async () => {
    try {
      // 2. 调用fetchProposalById方法获取DAO中所有的Proposal信息
      const proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      // 4. 更新proposals变量
      setProposals(proposals);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * voteOnProposal: 对proposalId的proposal进行投票
   */
  const voteOnProposal = async (proposalId, _vote) => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 获取DAO合约对象实例
      const DAOContract = getDaoContractInstance(signer);
      // 3. 调用合约函数执行投票
      const tx = await DAOContract.voteOnProposal(proposalId, _vote);
      // 4. 等待交易执行完成
      setLoading(true);
      await tx.wait();
      setLoading(false);
      // 5. 更新proposals变量
      await fetchAllProposals();
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * executeProposal: 执行proposalId的proposal
   * */
  const executeProposal = async (proposalId) => {
    try {
      // 1. 获取Signer对象
      const signer = await getProviderOrSigner(true);
      // 2. 获取DAO合约对象实例
      const DAOContract = getDaoContractInstance(signer);
      // 3. 调用合约函数执行投票
      const tx = await DAOContract.executeProposal(proposalId);
      // 4. 等待交易执行完成
      setLoading(true);
      await tx.wait();
      setLoading(false);
      // 5. 更新proposals变量和treasuryBalance变量
      await fetchAllProposals();
      getDAOTreasuryBalance();
    } catch (err) {
      console.log(err);
      window.alert(err.reason);
    }
  };

  // Helper function to fetch a Provider/Signer instance from Metamask
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please switch to the Goerli network!");
      throw new Error("Please switch to the Goerli network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /**
   * getDaoContractInstance: 创建并返回DAO合约对象实例
   */
  const getDaoContractInstance = (providerOrSigner) => {
    // 1. 创建DAO合约对象
    const daoContractInstance = new Contract(
      CRYPTODEVS_DAO_CONTRACT_ADDRESS,
      CRYPTODEVS_DAO_ABI,
      providerOrSigner
    );
    // 2. 返回DAO合约对象
    return daoContractInstance;
  };

  /**
   * getCryptodevsNFTContractInstance: 创建并返回CryptoDevs NFT合约对象实例
   */
  const getCryptodevsNFTContractInstance = (providerOrSigner) => {
    // 1. 创建CryptoDevs NFT合约对象
    const cryptoDevsNFTContract = new Contract(
      CRYPTODEVS_NFT_CONTRACT_ADDRESS,
      CRYPTODEVS_NFT_ABI,
      providerOrSigner
    );
    // 2. 返回CryptoDevs NDT合约对象
    return cryptoDevsNFTContract;
  };

  // piece of code that runs everytime the value of `walletConnected` changes
  // so when a wallet connects or disconnects
  // Prompts user to connect wallet if not connected
  // and then calls helper functions to fetch the
  // DAO Treasury Balance, User NFT Balance, and Number of Proposals in the DAO
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        disableInjectedProvider: false,
        providerOptions: {},
        network: "goerli",
      });
      connectWallet().then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        getNumProposalsInDAO();
        getDAOOwner();
      });
    }
  }, [walletConnected]);

  // Piece of code that runs everytime the value of `selectedTab` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  // Render the contents of the appropriate tab based on `selectedTab`
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  // Renders the 'Create Proposal' tab content
  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You do not own any CryptoDevs NFTs. <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase: </label>
          <input
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Create
          </button>
        </div>
      );
    }
  }

  // Renders the 'View Proposals' tab content
  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>No proposals have been created</div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => (
            <div key={index} className={styles.proposalCard}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>Fake NFT to Purchase: {p.nftTokenId}</p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.nayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </button>
                  <button
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <button
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    Execute Proposal{" "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </button>
                </div>
              ) : (
                <div className={styles.description}>Proposal Executed</div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>CryptoDevs DAO</title>
        <meta name="description" content="CryptoDevs DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
          {/* Display additional withdraw button if connected wallet is owner */}
          {isOwner ? (
            <div>
              {loading ? (
                <button className={styles.button}>Loading...</button>
              ) : (
                <button className={styles.button} onClick={withdrawDAOEther}>
                  Withdraw DAO ETH
                </button>
              )}
            </div>
          ) : (
            ""
          )}
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
