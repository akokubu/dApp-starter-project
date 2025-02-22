import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import ReactLoading from "react-loading";
import party from "party-js";

const App = () => {
  // ユーザのパブリックウォレット
  const [currentAccount, setCurrentAccount] = useState("");
  // ユーザの入力したメッセージ
  const [messageValue, setMessageValue] = useState("");
  // すべてのwaves
  const [allWaves, setAllWaves] = useState([]);
  // コントラクト残高
  const [balance, setBalance] = useState(null);
  // ロード中を表示するか
  const [isLoading, setIsLoading] = useState(false);

  // デプロイ済みのコントラクトのアドレス
  const contractAddress = "0x840763d1468c7bF798f9dC94e2A34a1DeD955693";
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
            isWin: wave.isWin,
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

  const getBalance = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    const contractBalance = await provider.getBalance(
      wavePortalContract.address
    );
    setBalance(ethers.utils.formatEther(contractBalance));
    console.log(
      "Contract balance: ",
      ethers.utils.formatEther(contractBalance)
    );
    return contractBalance;
  };

  useEffect(async () => {
    checkIfWalletIsConnected();
    await getBalance();
  }, []);

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, isWin, message) => {
      console.log("NweWave", from, timestamp, isWin, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          isWin,
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

  const wave = async (e) => {
    if (!messageValue) {
      alert("メッセージを入力してください");
      return;
    }
    setIsLoading(true);
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

        // wave前の残高
        const contractBalance = await getBalance();

        // コントラクトに👋（wave）を書き込む
        const waveTxn = await wavePortalContract.wave(messageValue, {
          gasLimit: 300000,
        });
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieve total wave count...", count.toNumber());

        // wave後の残高
        const contractBalancePost = await getBalance();

        // 残高が減っていたら当たったと判断する
        if (contractBalancePost < contractBalance) {
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH.");
        }
        setMessageValue("");
      } else {
        console.error("Ethereum object doesn't exist!");
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      return;
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
      getAllWaves();
    } catch (error) {
      console.error(error);
    }
  };
  const handleClick = () => {
    // 新規タブを開いて遷移
    window.open(`https://rinkeby.etherscan.io/address/${contractAddress}`);
  };

  const loadingClick = (e) => {
    party.confetti(e.target, {
      speed: party.variation.range(100, 600),
      count: party.variation.range(20, 60),
    });
    party.sparkles(e.target, {
      speed: party.variation.range(100, 400),
      count: party.variation.range(20, 60),
    });
  };

  const Loading = ({ children }) => {
    if (isLoading) {
      return (
        <div className="loading" onClick={(e) => loadingClick(e)}>
          <ReactLoading
            type="spin"
            color="#ebc634"
            height="100px"
            width="100px"
          />
          <button className="clickme" onClick={(e) => loadingClick(e)}>
            Click Me
          </button>
        </div>
      );
    } else {
      return <>{children}</>;
    }
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

          <div className="header">
            残高: {balance ? `${balance} ETH` : "-"} 当たり残数:{" "}
            {Math.ceil(balance / 0.00005)}回
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

          <Loading>
            {currentAccount && (
              <button className="waveButton" onClick={(e) => wave(e)}>
                Wave at Me
              </button>
            )}
          </Loading>

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
                    <div>isWin: {wave.isWin ? "🎉" : ""}</div>
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
