import { CHAIN_ID } from './config';

/** NFT Chains */
export enum EvmChainMainnet {
  ETHEREUM = 1,
  MOONBEAM = 1284,
  ASTAR = 592,
  CELO = 42220,
  BASE = 8453,
  ARBITRUM_ONE = 42161,
  AVALANCHE = 43114,
  OPTIMISM = 10,
  POLYGON = 137,
}
export enum EvmChainTestnet {
  SEPOLIA = 11155111,
  MOONBASE = 1287,
  ALFAJORES = 44787, // Celo testnet
  BASE_SEPOLIA = 84532,
  ARBITRUM_ONE_SEPOLIA = 421614,
  AVALANCHE_FUJI = 43113,
  OPTIMISM_SEPOLIA = 11155420,
  POLYGON_AMOY = 80002,
}

export function browserName() {
  let userAgent = navigator.userAgent;
  let browserName = '';

  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = 'chrome';
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = 'firefox';
  } else if (userAgent.match(/safari/i)) {
    browserName = 'safari';
  } else if (userAgent.match(/opr\//i)) {
    browserName = 'opera';
  } else if (userAgent.match(/edg/i)) {
    browserName = 'edge';
  } else if (userAgent.match(/brave/i)) {
    browserName = 'brave';
  } else {
    browserName = 'No browser detection';
  }
  return browserName;
}
export function browserSupportsMetaMask() {
  return ['chrome', 'firefox', 'brave', 'edge', 'opera'].includes(browserName());
}

export function metamaskNotSupportedMessage() {
  return browserSupportsMetaMask() ? 'You need MetaMask extension to connect wallet!' : 'Your browser does not support MetaMask, please use another browser!';
}

export function contractLink(contractAddress?: string | null, chainId: number = CHAIN_ID): string {
  return contractAddress ? `${chainRpc(chainId)}address/${contractAddress}` : '';
}

export function transactionLink(transactionHash?: string | null, chainId?: number): string {
  return `${chainRpc(chainId)}tx/${transactionHash}`;
}

export function chainRpc(chainId?: number): string {
  switch (chainId) {
    // EVM Mainnet
    case EvmChainMainnet.ETHEREUM:
      return `https://etherscan.io/`;
    case EvmChainMainnet.MOONBEAM:
      return `https://moonbeam.moonscan.io/`;
    case EvmChainMainnet.ASTAR:
      return `https://astar.blockscout.com/`;
    case EvmChainMainnet.CELO:
      return `https://celo.blockscout.com/`;
    case EvmChainMainnet.BASE:
      return `https://basescan.org/`;
    case EvmChainMainnet.ARBITRUM_ONE:
      return `https://arbiscan.io/`;
    case EvmChainMainnet.AVALANCHE:
      return `https://snowtrace.io/`;
    case EvmChainMainnet.OPTIMISM:
      return `https://optimistic.etherscan.io/`;
    case EvmChainMainnet.POLYGON:
      return `https://polygonscan.com/`;

    // EVM Testnet
    case EvmChainTestnet.SEPOLIA:
      return `https://sepolia.etherscan.io/`;
    case EvmChainTestnet.MOONBASE:
      return `https://moonbase.moonscan.io/`;
    case EvmChainTestnet.ALFAJORES:
      return `https://celo-alfajores.blockscout.com/`;
    case EvmChainTestnet.BASE_SEPOLIA:
      return `https://sepolia.basescan.org/`;
    case EvmChainTestnet.ARBITRUM_ONE_SEPOLIA:
      return `https://sepolia.arbiscan.io/`;
    case EvmChainTestnet.AVALANCHE_FUJI:
      return `https://testnet.snowtrace.io/`;
    case EvmChainTestnet.OPTIMISM_SEPOLIA:
      return `https://sepolia-optimism.etherscan.io/`;
    case EvmChainTestnet.POLYGON_AMOY:
      return `https://amoy.polygonscan.com/`;

    default:
      console.warn('Missing chainId');
      return '';
  }
}

export function sleep(timeMs = 1000) {
  return new Promise(resolve => setTimeout(resolve, timeMs));
}
