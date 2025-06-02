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

async function childNestMintWrapper(destinationId, fieldId = '') {
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

async function rejectAllChildrenWrapper(parentId, pendingChildrenNum = 1, fieldId = '') {
  btnLoader($(`#rejectAllChildren${fieldId}`), true);

  const status = await rejectAllChildren(parentId, pendingChildrenNum);
  transactionStatus(status, fieldId);

  btnLoader($(`#rejectAllChildren${fieldId}`), false);
}

async function nestTransferFromWrapper(destinationId, fieldId = '', contractAddress = '') {
  btnLoader($(`#nestTransferFrom${fieldId}`), true);

  const address = $(`#addressTransferFrom${fieldId}`).val() || contractAddress;
  const tokenId = $(`#tokenTransferFrom${fieldId}`).val() || $(`input[type="radio"][name="nest${fieldId}"]:checked`).val();

  if (checkInputAddress(address, fieldId) && checkInputToken(tokenId, fieldId)) {
    const status = await nestTransferFrom(address, nftContract.address, tokenId, destinationId, '0x');
    transactionStatus(status, fieldId);
  }

  btnLoader($(`#nestTransferFrom${fieldId}`), false);
}

async function transferChildWrapper(parentId, contractAddress, childId, fieldId = '') {
  btnLoader($(`#transfer${fieldId}`), true);

  const status = await transferChild(parentId, walletAddress, 0, 0, contractAddress, childId, false, '0x');
  transactionStatus(status, fieldId);

  btnLoader($(`#transfer${fieldId}`), false);
}

// NESTABLE NFTs ACTIONS

async function isTokenNestable(contract) {
  try {
    return await contract.supportsInterface('0x42b0e56f');
  } catch (e) {
    console.warn(e);
    return false;
  }
}

async function childMint(tokenAddress, quantity) {
  const childNftContract = getNftContract(tokenAddress);
  const isNestable = await isTokenNestable(childNftContract);
  if (!isNestable) {
    console.error('Child token is not nestable');
    return;
  }
  const price = await nftContract.pricePerMint();
  const value = price.mul(ethers.BigNumber.from(quantity));
  try {
    const gasLimit = await nftContract.connect(provider.getSigner()).estimateGas.mint(walletAddress, quantity, { value });

    const tx = await childNftContract.connect(provider.getSigner()).mint(walletAddress, quantity, {
      value,
      gasLimit: gasLimit.mul(11).div(10),
    });
    await tx.wait();

    await refreshState();
  } catch (e) {
    console.debug(e);
  }
}

async function childNestMint(tokenAddress, quantity, destinationId) {
  const childNftContract = getNftContract(tokenAddress);
  const isNestable = await isTokenNestable(childNftContract);
  if (!isNestable) {
    console.error('Child token is not nestable');
    return 'Child token is not nestable';
  }
  const price = await childNftContract.pricePerMint();
  const value = price.mul(ethers.BigNumber.from(quantity));
  try {
    const tx = await childNftContract.connect(provider.getSigner()).nestMint(nftContract.address, quantity, destinationId, { value });
    await tx.wait();

    await refreshState();

    return '';
  } catch (e) {
    console.debug(e);
    const defaultMsg = 'Token could not be minted! Check contract address.';
    return transactionError(defaultMsg, e);
  }
}

async function childrenOf(parentId, tokenAddress = null) {
  try {
    const contract = !tokenAddress ? nftContract : getNftContract(tokenAddress);
    return await contract.connect(provider.getSigner()).childrenOf(parentId);
  } catch (e) {
    console.debug(e);
    return 0;
  }
}

async function pendingChildrenOf(parentId, tokenAddress = null) {
  try {
    const contract = !tokenAddress ? nftContract : getNftContract(tokenAddress);
    return await contract.connect(provider.getSigner()).pendingChildrenOf(parentId);
  } catch (e) {
    console.debug(e);
    return 0;
  }
}

async function acceptChild(parentId, childIndex, childAddress, childId) {
  try {
    const tx = await nftContract.connect(provider.getSigner()).acceptChild(parentId, childIndex, childAddress, childId);
    await tx.wait();

    await refreshState();

    return '';
  } catch (e) {
    console.debug(e);
    return transactionError('Token could not be accepted!', e);
  }
}

async function rejectAllChildren(parentId, maxRejections) {
  try {
    const tx = await nftContract.connect(provider.getSigner()).rejectAllChildren(parentId, maxRejections);
    await tx.wait();

    await refreshState();

    return '';
  } catch (e) {
    console.debug(e);
    return transactionError('Token could not be rejected!', e);
  }
}

async function nestTransferFrom(tokenAddress, toAddress, tokenId, destinationId, data) {
  const childNftContract = getNftContract(tokenAddress);
  const isNestable = await isTokenNestable(childNftContract);
  if (!isNestable) {
    console.error('Child token is not nestable');
    return 'Child token is not nestable';
  }

  try {
    const tx = await childNftContract.connect(provider.getSigner()).nestTransferFrom(walletAddress, toAddress, tokenId, destinationId, data);
    await tx.wait();

    await refreshState();
    return '';
  } catch (e) {
    console.debug(e);
    const defaultMsg = 'Token could not be transferred! Wrong token address or token ID.';
    return transactionError(defaultMsg, e);
  }
}

async function transferChild(tokenId, toAddress, destinationId, childIndex, childAddress, childId, isPending, data) {
  try {
    const tx = await nftContract.connect(provider.getSigner()).transferChild(tokenId, toAddress, destinationId, childIndex, childAddress, childId, isPending, data);
    await tx.wait();

    await refreshState();
    await refreshState();

    return '';
  } catch (e) {
    console.debug(e);
    const defaultMsg = 'Token could not be transferred!';
    return transactionError(defaultMsg, e);
  }
}
