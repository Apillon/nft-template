import { EmbeddedEthersSigner, getEmbeddedWallet } from '@apillon/wallet-sdk';
import { Contract, ethers, parseEther } from 'ethers6';
import abi from './abi';
import { btnLoader, checkInputAmount, hide, loadInfo, nftExistsCheckAndErrorRender, renderNft, transactionError, transactionStatus, writeToElement } from './render';
import { CollectionInfo, Nft } from './types';
import { metamaskNotSupportedMessage } from './utils';
import { CHAIN_ID, CONTRACT_ADDRESS } from './config';

let signer = null as any;
let nftContract = null as any;
let walletAddress: string = '';
let info = {
  balance: 0n,
  drop: null,
  dropStart: 0,
  autoIncrement: null,
  maxSupply: 0n,
  name: '',
  price: 0n,
  reserve: 0n,
  revokable: null,
  soulbound: null,
  symbol: '',
  totalSupply: 0,
} as CollectionInfo;
let NFTs: Record<number, Nft> = {};
let myNFTs: Number[] = [];

const iconWallet =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none"><path d="M4 3C2.89 3 2 3.9 2 5V19C2 19.5304 2.21071 20.0391 2.58579 20.4142C2.96086 20.7893 3.46957 21 4 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V16.72C20.59 16.37 21 15.74 21 15V9C21 8.26 20.59 7.63 20 7.28V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H4ZM4 5H18V7H12C11.4696 7 10.9609 7.21071 10.5858 7.58579C10.2107 7.96086 10 8.46957 10 9V15C10 15.5304 10.2107 16.0391 10.5858 16.4142C10.9609 16.7893 11.4696 17 12 17H18V19H4V5ZM12 9H19V15H12V9ZM15 10.5C14.6022 10.5 14.2206 10.658 13.9393 10.9393C13.658 11.2206 13.5 11.6022 13.5 12C13.5 12.3978 13.658 12.7794 13.9393 13.0607C14.2206 13.342 14.6022 13.5 15 13.5C15.3978 13.5 15.7794 13.342 16.0607 13.0607C16.342 12.7794 16.5 12.3978 16.5 12C16.5 11.6022 16.342 11.2206 16.0607 10.9393C15.7794 10.658 15.3978 10.5 15 10.5Z" fill="currentColor"/></svg>';

async function init(ew = false) {
  const provider = ew ? new EmbeddedEthersSigner().provider : new ethers.BrowserProvider(window.ethereum);
  signer = ew ? new EmbeddedEthersSigner() : await provider.getSigner();
  nftContract = new Contract(CONTRACT_ADDRESS, abi, signer);
}

export async function connectWallet() {
  let currentChain = null;
  writeToElement('connectError', '');
  btnLoader(document.getElementById('btnConnect'), true);

  try {
    await init();
    currentChain = await getCurrentChain();
  } catch (e) {
    writeToElement('connectError', metamaskNotSupportedMessage());
    btnLoader(document.getElementById('btnConnect'), false);
    return;
  }

  if (Number(currentChain) != CHAIN_ID) {
    try {
      await switchChain();
      init();
      currentChain = await getCurrentChain();
    } catch (e) {
      await addChain();
    }
  }

  /** Btn onConnected: Show Wallet address */
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  walletAddress = await signer.getAddress();

  hide('wallet');
  await onWalletConnected();
}

export async function onWalletConnected(ew = false) {
  if (ew) {
    init(ew);
    const wallet = getEmbeddedWallet();
    if (wallet) {
      hide('btnConnect');
      walletAddress = wallet.getAddress();
    }
  }

  try {
    info = (await getCollectionInfo()) as CollectionInfo;
  } catch (e) {
    console.warn(e);
    writeToElement('connectError', 'Error: Invalid NFT collection');
    btnLoader(document.getElementById('btnConnect'), false);
    return;
  }
  await loadInfo(info);
  myNFTs = await getMyNftIDs();

  btnLoader(document.getElementById('btnConnect'), false);
  writeToElement('btnConnect', iconWallet + '<span>' + walletAddress.slice(0, 11) + '</span>');
  await loadAllNFTs();
}

async function switchChain() {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ CHAIN_ID }], // chainId must be in HEX with 0x in front
  });
}

export async function mint() {
  btnLoader(document.getElementById('btnMint'), true);

  const amount = Number((document.getElementById('amount') as HTMLInputElement)?.value || 1);
  if (!checkInputAmount(amount)) {
    console.debug('Wrong amount number');
    btnLoader(document.getElementById('btnMint'), false);
    return;
  }

  try {
    const value = info.price * BigInt(amount);
    const gasLimit = await nftContract.mint.estimateGas(walletAddress, amount, { value });
    console.log(gasLimit);
    console.log((gasLimit * 11n) / 10n);
    const tx = await nftContract.mint(walletAddress, amount, {
      value,
      gasLimit: (gasLimit * 11n) / 10n,
    });
    const receipt = await tx.wait();
    console.log(receipt);
    const logs = receipt?.logs || receipt.data?.logs;

    await refreshState();
    await addNftId(Number(logs[0]?.topics[3]));
  } catch (e) {
    console.debug(e);
    const defaultMsg = 'Token could not be minted! Check contract address.';
    const msg = transactionError(defaultMsg, e);
    transactionStatus(msg);
  } finally {
    btnLoader(document.getElementById('btnMint'), false);
  }
}

async function getBalance(ew = false): Promise<bigint> {
  const wallet = getEmbeddedWallet();
  if (ew && wallet) {
    return await wallet.evm.contractRead({
      contractAbi: abi,
      contractAddress: CONTRACT_ADDRESS,
      contractFunctionName: 'balanceOf',
      contractFunctionValues: [wallet.getAddress()],
      chainId: CHAIN_ID,
    });
  }
  return await nftContract.balanceOf(walletAddress);
}

async function getCollectionInfo(): Promise<CollectionInfo> {
  return {
    name: await nftContract.name(),
    symbol: await nftContract.symbol(),
    maxSupply: BigInt(await nftContract.maxSupply()),
    totalSupply: Number(await nftContract.totalSupply()),
    soulbound: await nftContract.isSoulbound(),
    revokable: await nftContract.isRevokable(),
    drop: await nftContract.isDrop(),
    dropStart: Number(await nftContract.dropStart()),
    reserve: BigInt(await nftContract.reserve()),
    price: BigInt(await nftContract.pricePerMint()),
    balance: BigInt(await getBalance()),
    autoIncrement: await nftContract.isAutoIncrement(),
  };
}

async function getCurrentChain() {
  return window.ethereum.request({ method: 'eth_chainId' });
}

async function addChain() {
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [getChainDetails(CHAIN_ID)],
  });
}

function getChainDetails(chainId: number) {
  switch (chainId) {
    case 1: {
      // ethereum
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://ethereum.publicnode.com', 'https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
        chainName: 'Ethereum',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://etherscan.io/'],
      };
    }
    case 11155111: {
      // sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://rpc.sepolia.org', 'https://rpc2.sepolia.org', 'https://eth-sepolia.public.blastapi.io'],
        chainName: 'Sepolia',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://sepolia.etherscan.io/'],
      };
    }
    case 1287: {
      // moonbase
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://rpc.api.moonbase.moonbeam.network', 'https://moonbase-alpha.public.blastapi.io', 'https://moonbeam-alpha.api.onfinality.io/public'],
        chainName: 'Moonbase',
        nativeCurrency: {
          name: 'DEV',
          symbol: 'DEV',
          decimals: 18,
        },
        blockExplorerUrls: ['https://moonbase.moonscan.io/'],
      };
    }
    case 1284: {
      // moonbeam
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://rpc.api.moonbeam.network', 'https://moonbeam.public.blastapi.io', 'https://moonbeam.api.onfinality.io/public'],
        chainName: 'Moonbeam',
        nativeCurrency: {
          name: 'GLMR',
          symbol: 'GLMR',
          decimals: 18,
        },
        blockExplorerUrls: ['https://moonbeam.moonscan.io/'],
      };
    }
    case 81: {
      // astar shibuya testnet
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://evm.shibuya.astar.network', 'https://shibuya.public.blastapi.io', 'https://shibuya-rpc.dwellir.com'],
        chainName: 'Shibuya Testnet',
        nativeCurrency: {
          name: 'SBY',
          symbol: 'SBY',
          decimals: 18,
        },
        blockExplorerUrls: ['https://shibuya.subscan.io/'],
      };
    }
    case 592: {
      // astar
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://evm.astar.network', 'https://astar.public.blastapi.io', 'https://astar-rpc.dwellir.com'],
        chainName: 'Astar',
        nativeCurrency: {
          name: 'ASTR',
          symbol: 'ASTR',
          decimals: 18,
        },
        blockExplorerUrls: ['https://astar.blockscout.com/'],
      };
    }
    case 44787: {
      // celo alfajores testnet
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://alfajores-forno.celo-testnet.org', 'https://alfajores-rpc.publicnode.com', 'https://celo-alfajores.rpc.thirdweb.com'],
        chainName: 'Celo Alfajores',
        nativeCurrency: {
          name: 'CELO',
          symbol: 'CELO',
          decimals: 18,
        },
        blockExplorerUrls: ['https://alfajores.celoscan.io/'],
      };
    }
    case 42220: {
      // celo
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://forno.celo.org', 'https://rpc.ankr.com/celo', 'https://celo-mainnet.rpc.thirdweb.com'],
        chainName: 'Celo',
        nativeCurrency: {
          name: 'CELO',
          symbol: 'CELO',
          decimals: 18,
        },
        blockExplorerUrls: ['https://celoscan.io/'],
      };
    }
    case 8453: {
      // base
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://mainnet.base.org', 'https://base.llamarpc.com', 'https://base.blockpi.network/v1/rpc/public'],
        chainName: 'Base',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://basescan.org/'],
      };
    }
    case 84532: {
      // base sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://sepolia.base.org', 'https://base-sepolia.blockpi.network/v1/rpc/public', 'https://base-sepolia-rpc.publicnode.com'],
        chainName: 'Base Sepolia',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://sepolia.basescan.org/'],
      };
    }
    case 42161: {
      // arbitrum one
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum.llamarpc.com', 'https://arbitrum-one.public.blastapi.io'],
        chainName: 'Arbitrum One',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://arbiscan.io/'],
      };
    }
    case 421614: {
      // arbitrum sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc', 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public', 'https://arbitrum-sepolia.public.blastapi.io'],
        chainName: 'Arbitrum Sepolia',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
      };
    }
    case 43114: {
      // avalanche
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche.public-rpc.com', 'https://avalanche-c-chain.publicnode.com'],
        chainName: 'Avalanche',
        nativeCurrency: {
          name: 'AVAX',
          symbol: 'AVAX',
          decimals: 18,
        },
        blockExplorerUrls: ['https://snowtrace.io/'],
      };
    }
    case 43113: {
      // avalanche fuji
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc', 'https://avalanche-fuji-c-chain.publicnode.com', 'https://avalanche-fuji.blockpi.network/v1/rpc/public'],
        chainName: 'Avalanche Fuji',
        nativeCurrency: {
          name: 'AVAX',
          symbol: 'AVAX',
          decimals: 18,
        },
        blockExplorerUrls: ['https://testnet.snowtrace.io/'],
      };
    }
    case 10: {
      // optimism
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://mainnet.optimism.io', 'https://optimism.llamarpc.com', 'https://optimism.blockpi.network/v1/rpc/public'],
        chainName: 'Optimism',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://optimistic.etherscan.io/'],
      };
    }
    case 11155420: {
      // optimism sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://sepolia.optimism.io', 'https://optimism-sepolia.blockpi.network/v1/rpc/public', 'https://optimism-sepolia.public.blastapi.io'],
        chainName: 'Optimism Sepolia',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['https://sepolia-optimism.etherscan.io/'],
      };
    }
    case 137: {
      // polygon
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://polygon-rpc.com', 'https://polygon.llamarpc.com', 'https://polygon.blockpi.network/v1/rpc/public'],
        chainName: 'Polygon',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        blockExplorerUrls: ['https://polygonscan.com/'],
      };
    }
    case 80002: {
      // polygon amoy
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ['https://rpc.amoy.network', 'https://polygon-amoy-rpc.publicnode.com', 'https://polygon-amoy.blockpi.network/v1/rpc/public'],
        chainName: 'Polygon Amoy',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        blockExplorerUrls: ['https://amoy.polygonscan.com/'],
      };
    }
    default: {
      throw new Error('Chain not supported');
    }
  }
}
async function getMyNftIDs() {
  const nftIDs = [];
  try {
    const balance = await getBalance();

    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
      nftIDs.push(Number(tokenId));
    }
  } catch (error) {
    console.warn(error);
  }
  return nftIDs;
}

export async function loadAllNFTs() {
  btnLoader(document.getElementById('btnAllNFTs'), true);
  await showNFTs(Number(info.totalSupply));
  btnLoader(document.getElementById('btnAllNFTs'), false);
}

export async function loadMyNFTs() {
  btnLoader(document.getElementById('myNFTs'), true);
  const balance = await getBalance();
  await showNFTs(Number(balance), walletAddress);
  btnLoader(document.getElementById('myNFTs'), false);
}

async function showNFTs(balance: number, address?: string | null) {
  const nftsExist = nftExistsCheckAndErrorRender(balance, address);
  if (!nftsExist) {
    return;
  }

  for (let i = 0; i < balance; i++) {
    const id = address ? await nftContract.tokenOfOwnerByIndex(address, i) : await nftContract.tokenByIndex(i);
    getNft(Number(id));
  }
}

async function getNft(id: number) {
  const metadata = await getNftMetadata(id);
  renderNft(id, metadata);
}
async function getNftMetadata(id: number) {
  if (!(id in NFTs)) {
    const url = await nftContract.tokenURI(id);
    NFTs[id] = await fetchNft(url);
  }
  return NFTs[id];
}

async function fetchNft(url: string) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (e) {
    console.debug(e);
    if (!document.getElementById('nfts')?.textContent) {
      writeToElement(
        'nfts',
        '<h3 class="text-center">Apologies, we were unable to load NFTs metadata at this time. Please try again later or contact our support team for assistance. Thank you for your patience.</h3>'
      );
    }
  }
  return null;
}

async function refreshState() {
  try {
    info.totalSupply = await nftContract.totalSupply();
    myNFTs = await getMyNftIDs();

    for (let i = 0; i < info.totalSupply; i++) {
      const id = await nftContract.tokenByIndex(i);

      if (!(id in NFTs)) {
        const url = await nftContract.tokenURI(id);
        NFTs[id] = await fetchNft(url);
        renderNft(id, NFTs[id]);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export async function addNftId(nftId: string | number | null) {
  if (!nftId) return;
  try {
    const wallet = getEmbeddedWallet();
    if (wallet && wallet.getAddress()) {
      wallet.events.emit('addTokenNft', {
        address: CONTRACT_ADDRESS,
        tokenId: Number(nftId),
      });
    } else {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC721',
          options: {
            address: CONTRACT_ADDRESS,
            tokenId: nftId.toString(),
          },
        },
      });
    }
  } catch (e) {
    console.error('Error importing NFT:', e);
  }
}
