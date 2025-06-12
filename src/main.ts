import { DefaultEthereumNetworks, DefaultSubstrateNetworks, getEmbeddedWallet } from '@apillon/wallet-sdk';
import { EmbeddedWalletUI } from '@apillon/wallet-ui';
import { connectWallet, loadAllNFTs, loadMyNFTs, mint, onWalletConnected } from './script';
import { CHAIN_ID, EMBEDDED_WALLET_CLIENT, IMG_LOGO } from './config';

if (EMBEDDED_WALLET_CLIENT) {
  EmbeddedWalletUI('#wallet', {
    clientId: EMBEDDED_WALLET_CLIENT,
    defaultNetworkId: CHAIN_ID,
    networks: DefaultEthereumNetworks,
    networksSubstrate: DefaultSubstrateNetworks,
  });
  initEW();
}
if (IMG_LOGO) {
  document.getElementById('logoImg')?.setAttribute('src', IMG_LOGO);
}

async function initEW() {
  // Wait for wallet SDK and account to initialize
  await new Promise<void>(resolve => {
    const clear = setInterval(() => {
      if (window.embeddedWallet && !!window.embeddedWallet.evm.userContractAddress) {
        onWalletConnected(true);
        clearInterval(clear);
        resolve();
      }
    }, 500);
  });

  const wallet = getEmbeddedWallet();
  if (wallet) {
    wallet?.events.on('connect', () => onWalletConnected(true));
    wallet?.events.on('accountsChanged', () => loadAllNFTs());
  }
}

document.getElementById('btnConnect')?.addEventListener('click', () => connectWallet());
document.getElementById('btnAllNFTs')?.addEventListener('click', () => loadAllNFTs());
document.getElementById('myNFTs')?.addEventListener('click', () => loadMyNFTs());
document.getElementById('btnMint')?.addEventListener('click', () => mint());
