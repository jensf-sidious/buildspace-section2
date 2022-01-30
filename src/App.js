import * as React from "react";
import waveportal from './utils/WavePortal.json';
import { ethers } from 'ethers';
import './App.css';

export default function App() {

  // A state variable to store the users public wallet
  const [currentAccount, setCurrentAccount] = React.useState("");
  // A state variable to store all waves
  const [allWaves, setAllWaves] = React.useState([]);
  const contractAddress = '0xD8B3D8133AA376bBaF36938cd276092D3EABdb37';

  const checkIfWalletIsConnected = async () => {
    // Check if we have access to window.ethereum
    console.log("[checkIfWalletIsConnected]")
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
        await getAllWaves();
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

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if(ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, waveportal.abi, signer);

        const waves = await wavePortalContract.getAllWaves();

        /* Kind of a mapper here */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
        setAllWaves(wavesCleaned);
        console.log("[getAllWaves]: ", wavesCleaned);
      } else {
        console.log("Ethereum object does not exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  React.useEffect(() => {
    let wavePortalContract;

    const onnewWave = (from, timestamp, message) => {
      console.log("newWave, ", from, timestamp, message);
      setAllWaves(prevState => [...prevState, {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
        }
      ]);
    };

    if(window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, waveportal.abi, signer);
      wavePortalContract.on("newWave", onnewWave);
    }

    return () => {
      if(wavePortalContract) {
        wavePortalContract.on("newWave", onnewWave);
      }
    }
  }, []);

  const wave = async (message) => {
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
          *
          * What this does is make the user pay a set amount of gas of 300,000. And, if they don't use all of it in the transaction they'll automatically be refunded.
          */
          const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
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

  React.useEffect(() => { checkIfWalletIsConnected() }, []);

  let inputRef = React.createRef();
  let waveInputHandler = async (e) => {
    if(inputRef.current.value.length > 0) {
      await wave(inputRef.current.value);
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

        <input ref={inputRef} type="text"></input>

        <button className="waveButton" onClick={waveInputHandler}>
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

        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "oldlace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
