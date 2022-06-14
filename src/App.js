import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
  // ユーザのパブリックウォレット
  const [currentAccount, setCurrentAccount] = useState("");
  // ユーザの入力したメッセージ
  const [messageValue, setMessageValue] = useState("");
  // すべてのwaves
  const [allWaves, setAllWaves] = useState([]);

  // デプロイ済みのコントラクトのアドレス
  const contractAddress = "0xFDa0fD12CE7db5A25bf27Cb2333035c799765A41";
  // ABIファイル
  const contractABI = abi.abi;

  console.log("currentAccount", currentAccount);

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const waves = await wavePortalContract.getAllWaves();
        const wavesCleaned = waves.map((wave) => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });
        setAllWaves(wavesCleaned);
      } else {
        console.error("Ethereum object doesn't exists!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // window.ethereumにアクセスできることを確認
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.error("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      // ユーザのウォレットへのアクセスが許可されていかどうか
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.error("No authorized account found");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NweWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    // メモリリークを防ぐために、NewWaveのイベントを開放する
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [contractABI]);

  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        console.log("contractAddress: ", contractAddress);
        console.log("contractABI: ", contractABI);
        console.log("signer: ", signer);
        console.log("wavePortalContract: ", wavePortalContract);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieve total wave count...", count.toNumber());
        console.log("Signer: ", signer);

        const contractBalance = await provider.getBalance(
          wavePortalContract.address
        );
        console.log(
          "Contract balance: ",
          ethers.utils.formatEther(contractBalance)
        );

        // コントラクトに👋（wave）を書き込む
        const waveTxn = await wavePortalContract.wave(messageValue, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieve total wave count...", count.toNumber());

        const contractBalancePost = await provider.getBalance(
          wavePortalContract.address
        );
        console.log(
          "Contract balance after: ",
          ethers.utils.formatEther(contractBalancePost)
        );
        // 残高が減っていたら当たったと判断する
        if (contractBalancePost < contractBalance) {
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
      } else {
        console.error("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };
  const handleClick = () => {
    // 新規タブを開いて遷移
    window.open(`https://rinkeby.etherscan.io/address/${contractAddress}`);
  };

  return (
    <>
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">
            <span role="img" aria-label="hand-wave">
              👋
            </span>{" "}
            WELCOME!
          </div>

          <div className="bio">
            イーサリアムウォレットを接続して、メッセージを作成したら、
            <span role="img" aria-label="hand-wave">
              👋
            </span>
            を送ってください
            <span role="img" aria-label="shine">
              ✨
            </span>
          </div>

          {currentAccount && (
            <textarea
              name="messageArea"
              placeholder="メッセージはこちら"
              type="text"
              id="message"
              value={messageValue}
              onChange={(e) => setMessageValue(e.target.value)}
            />
          )}

          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
          {/* ウォレットコネクトのボタン */}
          {!currentAccount && (
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
          {currentAccount && (
            <button className="waveButton" onClick={connectWallet}>
              Wallet Connected
            </button>
          )}
          <button className="waveButton" onClick={handleClick}>
            <img
              src="https://rinkeby.etherscan.io/assets/svg/logos/logo-etherscan.svg?v=0.0.2"
              alt="Rinkeby Etherscan"
              width="100"
            />
          </button>

          {currentAccount &&
            allWaves
              .slice(0)
              .reverse()
              .map((wave, index) => {
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: "F8F8FF",
                      marginTop: "16px",
                      padding: "8px",
                    }}
                  >
                    <div>Address: {wave.address}</div>
                    <div>Time: {wave.timestamp.toString()}</div>
                    <div>Message: {wave.message}</div>
                  </div>
                );
              })}
        </div>
      </div>
    </>
  );
};

export default App;
