import React, { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg"
import "./App.css"
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const { SystemProgram, Keypair } = web3;
let baseAccount = Keypair.generate();
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl('devnet');
const opts = {
  preflightCommitment: "processed"
}

const TWITTER_HANDLE = "web3dev_"
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`

const TEST_GIFS = [
  "https://i.giphy.com/media/xUOxffMyVjqAnuJpJu/giphy.webp",
  "https://media3.giphy.com/media/26n7aJwq73ubRevoQ/giphy.gif?cid=ecf05e47gpuxzul6z0774k47hcjp5p74uwfbfaq4xfjjco0c&rid=giphy.gif&ct=g",
  "https://media3.giphy.com/media/3o7aD5euYKz5Ly7Wq4/giphy.gif?cid=ecf05e47gx235xsfy7tqmzvhwz06ztzaxr63av1f446mlluz&rid=giphy.gif&ct=g",
  "https://media2.giphy.com/media/XKwfxBDG32ayrLHfAY/giphy.gif?cid=ecf05e47he0xf0mwnfx51x1f6m0wi4hzi52ql2dh0lnfe0tk&rid=giphy.gif&ct=g",
];

const App = () => {

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet encontrada!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Conectado com a Chave Pública:",
            response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Objeto Solana não encontrado! Instale a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log(
        "Conectado com a Chave Pública:",
        response.publicKey.toString()
      );
      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderNotConnectedContainer = () => (
    <div>
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Conecte sua carteira
      </button>
    </div>
  );

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("Nenhum link de GIF foi dado!")
      return
    }
    setInputValue('');
    console.log('Link do GIF:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
  
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF enviado com sucesso para o programa", inputValue)
  
      await getGifList();
    } catch (error) {
      console.log("Erro enviando GIF:", error)
    }
  };

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Fazer inicialização única para conta do programa GIF
          </button>
        </div>
      )
    }   
    else {
      return(
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Entre com o link do GIF!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Enviar
            </button>
          </form>
          <div className="gif-grid">
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }    
  };

  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Conta obtida", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Erro em getGifList: ", error)
      setGifList(null);
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("BaseAccount criado com sucesso com o endereço :", baseAccount.publicKey.toString())
      await getGifList();
    
    } catch(error) {
      console.log("Erro criando uma nova BaseAccount:", error)
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Obtendo lista de GIFs...");
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 Meu Portal de GIF 🖼</p>
          <p className="sub-text">Veja sua coleção de GIF no metaverso ✨</p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`feito com ❤️ por @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App
