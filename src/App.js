import * as React from "react";
import waveportal from './utils/WavePortal.json';
import { ethers } from 'ethers';
import './App.css';

export default function App() {

  // A state variable to store the users public wallet
  const [currentAccount, setCurrentAccount] = React.useState("");
  const contractAddress = '0x65C42130334C096aC20B5865408f0Bae8AF3568D';

  const checkIfWalletIsConnected = async () => {
    // Check if we have access to window.ethereum
    try {
      const { ethereum } = window;
      if(!ethereum) {
        console.log("Make sure you have metamask!");
      } else {
        console.log("We have the ethereum object ", ethereum);
      }

      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });
      
      if(accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch(error) {
      console.log(error);
    }
  }

  // Connect button
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if(!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  React.useEffect(() => { checkIfWalletIsConnected() }, []);

  const wave = async () => {
      try {
        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();

          /*
          * You're using contractABI here
          */
          const wavePortalContract = new ethers.Contract(contractAddress, waveportal.abi, signer);
          console.log("Contract: ", wavePortalContract);
          let count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());

          /*
          * Execute the actual wave from your smart contract
          */
          const waveTxn = await wavePortalContract.wave();
          console.log("Mining...", waveTxn.hash);

          await waveTxn.wait();
          console.log("Mined -- ", waveTxn.hash);

          count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());

        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error)
      }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="waving hand">
          👋
          </span> Hey there!
        </div>

        <div className="bio">
        Hey I am Don Teddy 🐈.
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>
        {/*
        * If there is no curretAccount render this button
        */}
        {!currentAccount &&(
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
