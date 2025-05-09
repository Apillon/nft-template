let provider = null;
let nftContract = null;
let walletAddress = null;
let isCollectionNestable = false;
let info = {};
let myNFTs = [];
const iconWallet =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none"><path d="M4 3C2.89 3 2 3.9 2 5V19C2 19.5304 2.21071 20.0391 2.58579 20.4142C2.96086 20.7893 3.46957 21 4 21H18C18.5304 21 19.0391 20.7893 19.4142 20.4142C19.7893 20.0391 20 19.5304 20 19V16.72C20.59 16.37 21 15.74 21 15V9C21 8.26 20.59 7.63 20 7.28V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H4ZM4 5H18V7H12C11.4696 7 10.9609 7.21071 10.5858 7.58579C10.2107 7.96086 10 8.46957 10 9V15C10 15.5304 10.2107 16.0391 10.5858 16.4142C10.9609 16.7893 11.4696 17 12 17H18V19H4V5ZM12 9H19V15H12V9ZM15 10.5C14.6022 10.5 14.2206 10.658 13.9393 10.9393C13.658 11.2206 13.5 11.6022 13.5 12C13.5 12.3978 13.658 12.7794 13.9393 13.0607C14.2206 13.342 14.6022 13.5 15 13.5C15.3978 13.5 15.7794 13.342 16.0607 13.0607C16.342 12.7794 16.5 12.3978 16.5 12C16.5 11.6022 16.342 11.2206 16.0607 10.9393C15.7794 10.658 15.3978 10.5 15 10.5Z" fill="currentColor"/></svg>';

function initProvider() {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  nftContract = getNftContract(contractAddress);
}

async function connectWallet() {
  let currentChain = null;
  $("#connectError").html("");
  btnLoader($("#btnConnect"), true);

  try {
    initProvider();
    currentChain = await getCurrentChain();
  } catch (e) {
    $("#connectError").html(metamaskNotSupportedMessage());
    btnLoader($("#btnConnect"), false);
    return;
  }

  if (currentChain != chainId) {
    try {
      await switchChain();
      // location.reload();
      initProvider();
      currentChain = await getCurrentChain();
    } catch (e) {
      await addChain();
    }
  }
  /** Check if collection is Nestable */
  isCollectionNestable = await isTokenNestable(nftContract);

  /** Btn onConnected: Show Wallet address */
  await ethereum.request({ method: "eth_requestAccounts" });
  walletAddress = await provider.getSigner().getAddress();

  try {
    info = await getCollectionInfo();
  } catch (e) {
    console.warn(e);
    $("#connectError").html("Error: Invalid NFT collection");
    btnLoader($("#btnConnect"), false);
    return;
  }

  await loadInfo(isCollectionNestable);
  myNFTs = await getMyNftIDs();

  btnLoader($("#btnConnect"), false);
  $("#btnConnect").html(
    iconWallet + "<span>" + walletAddress.slice(0, 11) + "</span>"
  );

  await loadAllNFTs();
}

async function mint() {
  btnLoader($("#btnMint"), true);

  const amount = $("#amount").val();
  if (!checkInputAmount(amount)) {
    console.log("Wrong amount number");
    btnLoader($("#btnMint"), false);
    return;
  }
  try {
    const value = info.price.mul(ethers.BigNumber.from(amount));

    const gasLimit = await nftContract
      .connect(provider.getSigner())
      .estimateGas.mint(walletAddress, amount, { value });

    await nftContract
      .connect(provider.getSigner())
      .mint(walletAddress, amount, {
        value,
        gasLimit: gasLimit.mul(11).div(10),
      });
  } catch (e) {
    console.log(e);
    const defaultMsg = "Token could not be minted! Check contract address.";
    const msg = transactionError(defaultMsg, e);
    transactionStatus(msg);
  } finally {
    btnLoader($("#btnMint"), false);
  }
}

async function getCollectionInfo() {
  const info = {};
  info["address"] = nftContract.address;
  info["name"] = await nftContract.name();
  info["symbol"] = await nftContract.symbol();
  info["maxSupply"] = await nftContract.maxSupply();
  info["totalSupply"] = await nftContract.totalSupply();
  info["soulbound"] = await nftContract.isSoulbound();
  info["revokable"] = await nftContract.isRevokable();
  info["drop"] = await nftContract.isDrop();
  info["dropStart"] = await nftContract.dropStart();
  info["reserve"] = await nftContract.reserve();
  info["price"] = await nftContract.pricePerMint();
  info["royaltiesFees"] = await nftContract.getRoyaltyPercentage();
  info["royaltiesAddress"] = await nftContract.getRoyaltyRecipient();

  return info;
}

async function getCurrentChain() {
  return ethereum.request({ method: "eth_chainId" });
}

async function addChain() {
  await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      getChainDetails(chainId),
    ],
  })

}

function getChainDetails(chainId) {
  switch (chainId) {
    case 1: {
      // ethereum
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://ethereum.publicnode.com", "https://eth.llamarpc.com", "https://rpc.ankr.com/eth"],
        chainName: "Ethereum",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://etherscan.io/"]
      }
    }
    case 11155111: {
      // sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://rpc.sepolia.org", "https://rpc2.sepolia.org", "https://eth-sepolia.public.blastapi.io"],
        chainName: "Sepolia",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://sepolia.etherscan.io/"]
      }
    }
    case 1287: {
      // moonbase
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://rpc.api.moonbase.moonbeam.network", "https://moonbase-alpha.public.blastapi.io", "https://moonbeam-alpha.api.onfinality.io/public"],
        chainName: "Moonbase",
        nativeCurrency: {
          name: "DEV",
          symbol: "DEV",
          decimals: 18,
        },
        blockExplorerUrls: ["https://moonbase.moonscan.io/"]
      }
    }
    case 1284: {
      // moonbeam
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://rpc.api.moonbeam.network", "https://moonbeam.public.blastapi.io", "https://moonbeam.api.onfinality.io/public"],
        chainName: "Moonbeam",
        nativeCurrency: {
          name: "GLMR",
          symbol: "GLMR",
          decimals: 18,
        },
        blockExplorerUrls: ["https://moonbeam.moonscan.io/"]
      }
    }
    case 81: {
      // astar shibuya testnet  
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://evm.shibuya.astar.network", "https://shibuya.public.blastapi.io", "https://shibuya-rpc.dwellir.com"],
        chainName: "Shibuya Testnet",
        nativeCurrency: {
          name: "SBY",
          symbol: "SBY",
          decimals: 18
        },
        blockExplorerUrls: ["https://shibuya.subscan.io/"]
      }
    }
    case 592: {
      // astar
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://evm.astar.network", "https://astar.public.blastapi.io", "https://astar-rpc.dwellir.com"],
        chainName: "Astar",
        nativeCurrency: {
          name: "ASTR",
          symbol: "ASTR",
          decimals: 18,
        },
        blockExplorerUrls: ["https://astar.blockscout.com/"]
      }
    }
    case 44787: {
      // celo alfajores testnet
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://alfajores-forno.celo-testnet.org", "https://alfajores-rpc.publicnode.com", "https://celo-alfajores.rpc.thirdweb.com"],
        chainName: "Celo Alfajores",
        nativeCurrency: {
          name: "CELO",
          symbol: "CELO",
          decimals: 18
        },
        blockExplorerUrls: ["https://alfajores.celoscan.io/"]
      }
    }
    case 42220: {
      // celo
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://forno.celo.org", "https://rpc.ankr.com/celo", "https://celo-mainnet.rpc.thirdweb.com"],
        chainName: "Celo",
        nativeCurrency: {
          name: "CELO",
          symbol: "CELO",
          decimals: 18
        },
        blockExplorerUrls: ["https://celoscan.io/"]
      }
    }
    case 8453: {
      // base
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://mainnet.base.org", "https://base.llamarpc.com", "https://base.blockpi.network/v1/rpc/public"],
        chainName: "Base",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://basescan.org/"]
      }
    }
    case 84532: {
      // base sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://sepolia.base.org", "https://base-sepolia.blockpi.network/v1/rpc/public", "https://base-sepolia-rpc.publicnode.com"],
        chainName: "Base Sepolia",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://sepolia.basescan.org/"]
      }
    }
    case 42161: {
      // arbitrum one
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://arb1.arbitrum.io/rpc", "https://arbitrum.llamarpc.com", "https://arbitrum-one.public.blastapi.io"],
        chainName: "Arbitrum One",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://arbiscan.io/"]
      }
    }
    case 421614: {
      // arbitrum sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc", "https://arbitrum-sepolia.blockpi.network/v1/rpc/public", "https://arbitrum-sepolia.public.blastapi.io"],
        chainName: "Arbitrum Sepolia",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
      }
    }
    case 43114: {
      // avalanche
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche.public-rpc.com", "https://avalanche-c-chain.publicnode.com"],
        chainName: "Avalanche",
        nativeCurrency: {
          name: "AVAX",
          symbol: "AVAX",
          decimals: 18
        },
        blockExplorerUrls: ["https://snowtrace.io/"]
      }
    }
    case 43113: {
      // avalanche fuji
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc", "https://avalanche-fuji-c-chain.publicnode.com", "https://avalanche-fuji.blockpi.network/v1/rpc/public"],
        chainName: "Avalanche Fuji",
        nativeCurrency: {
          name: "AVAX",
          symbol: "AVAX",
          decimals: 18
        },
        blockExplorerUrls: ["https://testnet.snowtrace.io/"]
      }
    }
    case 10: {
      // optimism
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://mainnet.optimism.io", "https://optimism.llamarpc.com", "https://optimism.blockpi.network/v1/rpc/public"],
        chainName: "Optimism",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://optimistic.etherscan.io/"]
      }
    }
    case 11155420: {
      // optimism sepolia
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://sepolia.optimism.io", "https://optimism-sepolia.blockpi.network/v1/rpc/public", "https://optimism-sepolia.public.blastapi.io"],
        chainName: "Optimism Sepolia",
        nativeCurrency: {
          name: "ETH",
          symbol: "ETH",
          decimals: 18
        },
        blockExplorerUrls: ["https://sepolia-optimism.etherscan.io/"]
      }
    }
    case 137: {
      // polygon
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://polygon-rpc.com", "https://polygon.llamarpc.com", "https://polygon.blockpi.network/v1/rpc/public"],
        chainName: "Polygon",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18
        },
        blockExplorerUrls: ["https://polygonscan.com/"]
      }
    }
    case 80002: {
      // polygon amoy 
      return {
        chainId: `0x${chainId.toString(16)}`,
        rpcUrls: ["https://rpc.amoy.network", "https://polygon-amoy-rpc.publicnode.com", "https://polygon-amoy.blockpi.network/v1/rpc/public"],
        chainName: "Polygon Amoy",
        nativeCurrency: {
          name: "MATIC",
          symbol: "MATIC",
          decimals: 18
        },
        blockExplorerUrls: ["https://amoy.polygonscan.com/"]
      }
    }
    default: {
      throw new Error("Chain not supported");
    }
  }
}
async function getMyNftIDs(tokenAddress = null) {
  const nftIDs = [];
  try {
    const contract = !tokenAddress ? nftContract : getNftContract(tokenAddress);
    const balance = await contract.balanceOf(walletAddress);

    for (let i = 0; i < balance.toBigInt(); i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
      nftIDs.push(tokenId.toNumber());
    }
  } catch (error) {
    console.warn(error);
  }
  return nftIDs;
}

async function loadAllNFTs() {
  btnLoader($("#btnAllNFTs"), true);
  const balance = info.totalSupply;
  await showNFTs(balance);

  btnLoader($("#btnAllNFTs"), false);
}

async function loadMyNFTs() {
  btnLoader($("#myNFTs"), true);
  const balance = await nftContract.balanceOf(walletAddress);
  await showNFTs(balance, walletAddress);
  btnLoader($("#myNFTs"), false);
}

//GENERIC NFTS

async function showNFTs(balance, address = null) {
  const nftsExist = nftExistsCheckAndErrorRender(balance.toBigInt(), address);
  if (!nftsExist) {
    return;
  }

  for (let i = 0; i < balance.toBigInt(); i++) {
    const id = address
      ? await nftContract.tokenOfOwnerByIndex(address, i)
      : await nftContract.tokenByIndex(i);
    const url = await nftContract.tokenURI(id.toBigInt());

    await renderNft(id.toNumber(), url);
  }
}

// Nestable NFTs on UI

async function mintWrapper() {
  btnLoader($(`#mint`), true);
  await childMint(contractAddress, 1);
  btnLoader($(`#mint`), false);
}
async function childMintWrapper() {
  btnLoader($(`#childMint`), true);

  const address = $(`#address`).val();
  if (checkInputAddress(address)) {
    await childMint(address, 1);
  }

  btnLoader($(`#childMint`), false);
}

async function childNestMintWrapper(destinationId, fieldId = "") {
  btnLoader($(`#childNestMint${fieldId}`), true);
  const address = $(`#addressNestMint${fieldId}`).val();

  if (checkInputAddress(address, fieldId)) {
    const status = await childNestMint(address, 1, destinationId);
    transactionStatus(status, fieldId);
  }

  btnLoader($(`#childNestMint${fieldId}`), false);
}

async function acceptChildWrapper(parentId, childAddress, childId, fieldId) {
  if (!childAddress) {
    return;
  }
  btnLoader($(`#acceptChild${fieldId}`), true);

  const status = await acceptChild(parentId, 0, childAddress, childId);
  transactionStatus(status, fieldId);

  btnLoader($(`#acceptChild${fieldId}`), false);
}

async function rejectAllChildrenWrapper(
  parentId,
  pendingChildrenNum = 1,
  fieldId = ""
) {
  btnLoader($(`#rejectAllChildren${fieldId}`), true);

  const status = await rejectAllChildren(parentId, pendingChildrenNum);
  transactionStatus(status, fieldId);

  btnLoader($(`#rejectAllChildren${fieldId}`), false);
}

async function nestTransferFromWrapper(destinationId, fieldId = "") {
  btnLoader($(`#nestTransferFrom${fieldId}`), true);

  const address = $(`#addressTransferFrom${fieldId}`).val();
  const tokenId = $(`#tokenTransferFrom${fieldId}`).val();
  if (
    checkInputAddress(address, fieldId) &&
    checkInputToken(tokenId, fieldId)
  ) {
    const status = await nestTransferFrom(
      address,
      nftContract.address,
      tokenId,
      destinationId,
      "0x"
    );
    transactionStatus(status, fieldId);
  }

  btnLoader($(`#nestTransferFrom${fieldId}`), false);
}

async function transferChildWrapper(
  parentId,
  contractAddress,
  childId,
  fieldId = ""
) {
  btnLoader($(`#transfer${fieldId}`), true);
  console.log(fieldId);

  const status = await transferChild(
    parentId,
    walletAddress,
    0,
    0,
    contractAddress,
    childId,
    false,
    "0x"
  );
  console.log(status);
  transactionStatus(status, fieldId);

  btnLoader($(`#transfer${fieldId}`), false);
}

// NESTABLE NFTs

async function isTokenNestable(contract) {
  try {
    return await contract.supportsInterface("0x42b0e56f");
  } catch (e) {
    console.warn(e);
    return false;
  }
}

function getNftContract(tokenAddress) {
  return new ethers.Contract(tokenAddress, nftAbi, provider);
}

async function childMint(tokenAddress, quantity) {
  const childNftContract = getNftContract(tokenAddress);
  const isNestable = await isTokenNestable(childNftContract);
  if (!isNestable) {
    console.error("Child token is not nestable");
    return;
  }
  const price = await nftContract.pricePerMint();
  const value = price.mul(ethers.BigNumber.from(quantity));
  try {
    const gasLimit = await nftContract
      .connect(provider.getSigner())
      .estimateGas.mint(walletAddress, quantity, { value });

    await childNftContract
      .connect(provider.getSigner())
      .mint(walletAddress, quantity, {
        value,
        gasLimit: gasLimit.mul(11).div(10),
      });
  } catch (e) {
    console.log(e);
  }
}

async function childNestMint(tokenAddress, quantity, destinationId) {
  const childNftContract = getNftContract(tokenAddress);
  const isNestable = await isTokenNestable(childNftContract);
  if (!isNestable) {
    console.error("Child token is not nestable");
    return "Child token is not nestable";
  }
  const price = await childNftContract.pricePerMint();
  const value = price.mul(ethers.BigNumber.from(quantity));
  try {
    await childNftContract
      .connect(provider.getSigner())
      .nestMint(nftContract.address, quantity, destinationId, { value });
    return "";
  } catch (e) {
    console.log(e);
    const defaultMsg = "Token could not be minted! Check contract address.";
    return transactionError(defaultMsg, e);
  }
}

async function childrenOf(parentId, tokenAddress = null) {
  try {
    const contract = !tokenAddress ? nftContract : getNftContract(tokenAddress);
    return await contract.connect(provider.getSigner()).childrenOf(parentId);
  } catch (e) {
    console.log(e);
    return 0;
  }
}

async function pendingChildrenOf(parentId, tokenAddress = null) {
  try {
    const contract = !tokenAddress ? nftContract : getNftContract(tokenAddress);
    return await contract
      .connect(provider.getSigner())
      .pendingChildrenOf(parentId);
  } catch (e) {
    console.log(e);
    return 0;
  }
}

async function acceptChild(parentId, childIndex, childAddress, childId) {
  try {
    await nftContract
      .connect(provider.getSigner())
      .acceptChild(parentId, childIndex, childAddress, childId);
    return "";
  } catch (e) {
    console.log(e);
    return transactionError("Token could not be accepted!", e);
  }
}

async function rejectAllChildren(parentId, maxRejections) {
  try {
    await nftContract
      .connect(provider.getSigner())
      .rejectAllChildren(parentId, maxRejections);
    return "";
  } catch (e) {
    console.log(e);
    return transactionError("Token could not be rejected!", e);
  }
}

async function nestTransferFrom(
  tokenAddress,
  toAddress,
  tokenId,
  destinationId,
  data
) {
  const childNftContract = getNftContract(tokenAddress);
  const isNestable = await isTokenNestable(childNftContract);
  if (!isNestable) {
    console.error("Child token is not nestable");
    return "Child token is not nestable";
  }

  try {
    await childNftContract
      .connect(provider.getSigner())
      .nestTransferFrom(walletAddress, toAddress, tokenId, destinationId, data);
    return "";
  } catch (e) {
    console.log(e);
    const defaultMsg =
      "Token could not be transferred! Wrong token address or token ID.";
    return transactionError(defaultMsg, e);
  }
}

async function transferChild(
  tokenId,
  toAddress,
  destinationId,
  childIndex,
  childAddress,
  childId,
  isPending,
  data
) {
  try {
    await nftContract
      .connect(provider.getSigner())
      .transferChild(
        tokenId,
        toAddress,
        destinationId,
        childIndex,
        childAddress,
        childId,
        isPending,
        data
      );
    return "";
  } catch (e) {
    console.log(e);
    const defaultMsg = "Token could not be transferred!";
    return transactionError(defaultMsg, e);
  }
}
