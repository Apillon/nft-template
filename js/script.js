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
  nftContract = getNftContract(nftAddress);
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
  try {
    const nft = nftContract.connect(provider.getSigner());

    const amount = $("#amount").val();
    const value = info.price.mul(ethers.BigNumber.from(amount));

    const gasLimit = await nftContract
      .connect(provider.getSigner())
      .estimateGas.mint(walletAddress, amount, { value });

    await nft.mint(walletAddress, amount, {
      value,
      gasLimit: gasLimit.mul(11).div(10),
    });
  } catch (error) {
    console.log(error);
  } finally {
    btnLoader($("#btnMint"), false);
  }
}

async function getCollectionInfo() {
  const info = {};
  info["name"] = await nftContract.name();
  info["symbol"] = await nftContract.symbol();
  info["maxSupply"] = await nftContract.maxSupply();
  info["totalSupply"] = await nftContract.totalSupply();
  info["soulbound"] = await nftContract.isSoulbound();
  info["revokable"] = await nftContract.isRevokable();
  info["drop"] = await nftContract.isDrop();
  info["dropStart"] = await nftContract.dropStart();
  info["reserve"] = await nftContract.reserve();
  info["price"] = isCollectionNestable ? await nftContract.pricePerMint() : 0;
  info["royaltiesFees"] = isCollectionNestable
    ? await nftContract.getRoyaltyPercentage()
    : 0;
  info["royaltiesAddress"] = isCollectionNestable
    ? await nftContract.getRoyaltyRecipient()
    : 0;

  return info;
}

async function getCurrentChain() {
  return ethereum.request({ method: "eth_chainId" });
}

async function addChain() {
  if (chainId == 0x507) {
    // moonbase
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          rpcUrls: ["https://rpc.api.moonbase.moonbeam.network/"],
          chainName: "Moonbase",
          nativeCurrency: {
            name: "DEV",
            symbol: "DEV",
            decimals: 18,
          },
          blockExplorerUrls: ["https://moonbase.moonscan.io/"],
        },
      ],
    });
  } else if (chainId == 0x504) {
    // moonbeam
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          rpcUrls: ["https://rpc.api.moonbeam.network/"],
          chainName: "Moonbeam",
          nativeCurrency: {
            name: "GLMR",
            symbol: "GLMR",
            decimals: 18,
          },
          blockExplorerUrls: ["https://moonscan.io/"],
        },
      ],
    });
  } else if (chainId == 0x250) {
    // moonbeam
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          rpcUrls: ["https://evm.astar.network/"],
          chainName: "Astar",
          nativeCurrency: {
            name: "ASTR",
            symbol: "ASTR",
            decimals: 18,
          },
          blockExplorerUrls: ["https://blockscout.com/astar"],
        },
      ],
    });
  }
}

async function switchChain() {
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }], // chainId must be in HEX with 0x in front
  });
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
    console.log(error);
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
  await childMint(nftAddress, 1);
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
  const address = $(`#addressNestMint${fieldId}`).val() || nftAddress;

  const status = await childNestMint(address, 1, destinationId);
  transactionStatus(
    status,
    "Token could not be minted! Check contract address.",
    fieldId
  );

  btnLoader($(`#childNestMint${fieldId}`), false);
}

async function acceptChildWrapper(parentId, childAddress, childId, fieldId) {
  if (!childAddress) {
    return;
  }
  btnLoader($(`#acceptChild${fieldId}`), true);

  const status = await acceptChild(parentId, 0, childAddress, childId);
  transactionStatus(status, "Token could not be accepted!", fieldId);

  btnLoader($(`#acceptChild${fieldId}`), false);
}

async function rejectAllChildrenWrapper(
  parentId,
  pendingChildrenNum = 1,
  fieldId = ""
) {
  btnLoader($(`#rejectAllChildren${fieldId}`), true);

  const status = await rejectAllChildren(parentId, pendingChildrenNum);
  transactionStatus(status, "Token could not be rejected!", fieldId);

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
    transactionStatus(
      status,
      "Token could not be transferred! Wrong token address or token ID.",
      fieldId
    );
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
  transactionStatus(
    status,
    "Token could not be transferred! Wrong token address or token ID.",
    fieldId
  );

  btnLoader($(`#transfer${fieldId}`), false);
}

// NESTABLE NFTs

async function isTokenNestable(contract) {
  try {
    return await contract.supportsInterface("0x42b0e56f");
  } catch (e) {
    console.error(e);
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
    return false;
  }
  const price = await nftContract.pricePerMint();
  const value = price.mul(ethers.BigNumber.from(quantity));
  try {
    await childNftContract
      .connect(provider.getSigner())
      .nestMint(nftContract.address, quantity, destinationId, { value });
    return true;
  } catch (e) {
    console.log(e);
  }
  return false;
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
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

async function rejectAllChildren(parentId, maxRejections) {
  try {
    await nftContract
      .connect(provider.getSigner())
      .rejectAllChildren(parentId, maxRejections);
    return true;
  } catch (e) {
    console.log(e);
    return false;
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
    return false;
  }

  try {
    await childNftContract
      .connect(provider.getSigner())
      .nestTransferFrom(walletAddress, toAddress, tokenId, destinationId, data);
    return true;
  } catch (e) {
    console.log(e);
    return false;
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
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}
