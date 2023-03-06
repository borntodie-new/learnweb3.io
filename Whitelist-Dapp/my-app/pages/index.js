import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useState, useRef } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // joinWhitelist keeps track of whether the current metamask address has joined the whitelist or not
  const [joinWhitelist, setJoinWhitelist] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // numberOf Whitelisted tracks the number of addresses's whitelisted
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as page is open
  const web3ModalRef = useRef();

  /**
   * Return a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capablities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, ect.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to alow your website to
   * request signatures from the user using Signer functions.
   *
   *
   *
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // connect to metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Prvider = new providers.Web3Provider(provider);
    const { chainId } = await web3Prvider.getNetwork();

    // if user is not connected to the Goerli network, let them know and throw an error
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Chanage network to Goerli");
    }
    if (needSigner) {
      const signer = web3Prvider.getSigner();
      return signer;
    }
    return web3Prvider;
  };

  /**
   * AddAddressToWhitelist: Adds the current connected address to the whitelist
   */
  const addAddressToWhitelist = async () => {
    try {
      // we need a signer here this is a `write` transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update method
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelisted();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted();
      setJoinWhitelist(true);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * getNumberOfWhitelisted: gets the number of whitelisted address
   */
  const getNumberOfWhitelisted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is Metamask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connecct to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // call the numberAddressesWhitelisted from the contract
      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * checkIfAddressInWhitelist: Checks if the address is in whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // Get the addrtess assoicate to the signer which is cnnected to Metamask
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      setJoinWhitelist(_joinedWhitelist);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * connectWallet: Connects the Metamask wallet
   */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is Metamask
      // When used for first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (err) {
      console.log(err);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      if (joinWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button className={styles.button} onClick={connectWallet}>
          Connecct your wallet
        </button>
      );
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect be called
  useEffect(() => {
    // if wallet is not connect, create a new instance of Web3Modal and connect the Metamask wallet
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection fro developers in Crypto.
          </div>
          <div className={styles.description}>
            10 have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" alt="" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
