function loadInfo(nftId) {
  $('#collection').html(generateCollectionInfo(nftId));
  renderDrop(nftId);
  $('#actions').show();
}

function generateCollectionInfo(nftId) {
  const maxSupply = info.maxSupply.toString() === ethers.constants.MaxUint256.toString() ? '&infin;' : info.maxSupply.toString();
  let content = `
          <b> Collection address: </b>
          <a href="${collectionLink(info.address)}" target="_blank">
            ${info.address} 
            <img src="./images/icon-open.svg" width="10" height="10" />
          </a>
          </br>
          <b> Name: </b>${info.name} </br>
          <b> Symbol: </b>${info.symbol} </br>
          <b> Revocable: </b>${info.revokable} </br>
          <b> Soulbound: </b>${info.soulbound} </br>
          <b> Supply: </b>${info.totalSupply}/${maxSupply} </br>          
        `;

  if (info.drop) {
    content = `${content}<b> Price: </b>${ethers.utils.formatEther(info.price)}</br>`;
  }
  return content + `<div class="drop" id="drop_${nftId}"></div>`;
}
function renderDrop(nftId) {
  if (info.drop) {
    const dropStartTimestamp = info.dropStart.toNumber() * 1000;

    if (info.totalSupply.eq(info.maxSupply)) {
      $(`#drop_${nftId}`).html('<h3>Sold out!</h3>');
    } else if (dropStartTimestamp > Date.now()) {
      // The data/time we want to countdown to
      const dropStartDate = new Date(dropStartTimestamp);
      countdown(nftId, dropStartDate);

      // Run myFunc every second
      var myFunc = setInterval(function () {
        countdown(nftId, dropStartDate);
        // Display the message when countdown is over
        var timeLeft = dropStartDate - new Date().getTime();
        if (timeLeft < 0) {
          clearInterval(myFunc);

          if (isCollectionNestable) {
            renderMintNestable(nftId);
          } else {
            renderMint(nftId);
          }
        }
      }, 1000);
    } else {
      renderMint(nftId);
    }
  }
}

function countdown(nftId, date) {
  var now = new Date().getTime();
  var timeLeft = date - now;

  // Calculating the days, hours, minutes and seconds left
  var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  $(`#drop_${nftId}`).html(`
    <b> Drop: </b>${date.toDateString()} ${date.toLocaleTimeString()} </br>
    ${days} <b>d </b>
    ${hours} <b>h </b>
    ${minutes} <b>m </b>
    ${seconds} <b>s </b>
  `);
}

function renderMint(nftId) {
  $(`#drop_${nftId}`).html(`
    <div class="field-amount">
      <label for="amount">Number of tokens (1-5):</label>
      <input id="amount" type="number" min="1" max="5" value="1" />
    </div>
    <button class="btn-mint" id="btnMint" onclick="mint()">Mint</button>
  `);
}

function renderMintNestable(nftId) {
  $(`#drop_${nftId}`).html(`
    <div class="mintNestable">
      <strong>Mint this collection</strong>
      <button id="mint" onclick="mintWrapper();">Mint</button>
      <br /><br />
      <strong>Or mint another nestable collection</strong>  
      <br /><br />
      <div class="field"> 
        <label for="address">Child Contract Address:</label>
        <input id="address" type="text" />
      </div>
      <button id="childMint" onclick="childMintWrapper();">Mint</button>      
    </div>
  `);
}

function btnLoader(el, loading) {
  if (loading) {
    el.attr('data-text', el.text());
    el.addClass('loading');
    el.html(`
      <svg
      class="spinner"
      style="
        margin: -${12}px 0 0 -${12}px;
        width: ${24}px;
        height: ${24}px;
      "
      viewBox="0 0 50 50"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="path"
      ></circle>
    </svg>
    `);
  } else {
    el.removeClass('loading');
    el.html(el.attr('data-text'));
  }
}

function nftExistsCheckAndErrorRender(nftCount, address = null) {
  if (nftCount > 0) {
    $('#nfts').html('');
    return true;
  } else if (address) {
    $('#nfts').html('<h2 class="text-center">You don\'t have any NFTs</h2>');
  } else {
    $('#nfts').html('<h2 class="text-center">No NFTs, they must be minted first.</h2>');
  }
  return false;
}

function checkInputAddress(address = null, fieldId = '') {
  if (address) {
    $(`#generalError${fieldId}`).html('');
    return true;
  } else {
    $(`#generalError${fieldId}`).html('Enter contract address!');
    window.scrollTo(0, 0);
    return false;
  }
}
function checkInputAmount(amount = null, fieldId = '') {
  if (amount && Number(amount) > 0 && Number(amount) <= 5) {
    $(`#generalError${fieldId}`).html('');
    return true;
  } else {
    $(`#generalError${fieldId}`).html('Enter valid amount (number from 1 to 5)!');
    window.scrollTo(0, 0);
    return false;
  }
}
function checkInputToken(token = null, fieldId = '') {
  if (token && Number(token) >= 0) {
    $(`#generalError${fieldId}`).html('');
    return true;
  } else {
    $(`#generalError${fieldId}`).html('Enter token ID!');
    window.scrollTo(0, 0);
    return false;
  }
}

function transactionStatus(msg, fieldId = '') {
  $(`#generalError${fieldId}`).html(msg);
}

function transactionError(msg, error) {
  if (error) {
    const errorMsg =
      typeof error === 'string'
        ? error
        : typeof error === 'object' && error?.data?.message
        ? error.data.message
        : typeof error === 'object' && error?.message
        ? error.message
        : JSON.stringify(error);

    if (errorMsg.includes('rejected') || errorMsg.includes('denied')) {
      return 'Transaction has been rejected';
    } else if (errorMsg.includes('OutOfFund')) {
      return 'Your account balance is too low';
    } else if (errorMsg.includes('account balance too low')) {
      return 'Your account balance is too low';
    } else if (error?.message.includes('transaction')) {
      return 'Transaction failed';
    }
  }
  return msg;
}

async function renderNft(id, metadata) {
  if (metadata.name && metadata.image) {
    const btnOpenModal =
      isCollectionNestable && myNFTs.includes(id)
        ? `<button data-modal="modal_${id}" data-token-id="${id}" onclick="createModal(${id}, '${contractAddress}', '${metadata.name}');">Open NFT</button>`
        : '';
    const tagNestable = isCollectionNestable ? `<div class="absolute tags"><span class="tag">Nestable</span></div>` : '';

    $('#nfts').append(`
        <div class="box br relative" id="nft_${id}">
          <img src="${metadata.image}" alt="${metadata.name}" />
          <div class="box-content">
            <h3>#${id} ${metadata.name}</h3>
            <p>${metadata.description}</p>
            ${btnOpenModal}
          </div>
          ${tagNestable}
        </div>
      `);
  }
}

async function renderChildren(contractAddress, parentId, children, fieldId) {
  let html = '';
  let disabled = false;

  for (let i = 0; i < children.length; i++) {
    try {
      const child = children[i];
      const id = child.tokenId.toNumber();
      const metadata = await getNftMetadata(id);

      html += await renderChild(contractAddress, parentId, id, metadata, fieldId, true, disabled);
      disabled = true;
    } catch (e) {
      console.debug(e);
    }
  }
  return html;
}

async function renderNFTsToNest(contractAddress, parentId, fieldId) {
  let html = '';
  let checked = 'checked';

  await Object.entries(NFTs).forEach(async ([id, nft]) => {
    if (myNFTs.includes(Number(id)) && parentId !== Number(id)) {
      const childHtml = await renderChild(contractAddress, parentId, id, nft, fieldId + '_nest');
      html += `
        <div class="relative">
          <input type="radio" name="nest${fieldId}" class="absolute" id="nft_${id}_to_nest" value="${id}" ${checked} />
          <label for="nft_${id}_to_nest">
            ${childHtml}
          </label>
        </div>`;
      checked = '';
    }
  });
  return html;
}

async function renderChild(contractAddress, parentId, id, metadata, fieldId, transfer = false, disabled = false) {
  try {
    const tagNestable = isCollectionNestable ? `<div class="absolute tags"><span class="tag">Nestable</span></div>` : '';
    const btn =
      transfer && disabled
        ? `<button id="transfer${fieldId}_${id}" class="disabled" disabled="disabled">Transfer Token to wallet</button>`
        : transfer
        ? `<button id="transfer${fieldId}_${id}" onclick="transferChildWrapper(${parentId}, '${contractAddress}', ${id}, '${fieldId}_${id}');">Transfer Token to wallet</button>`
        : '';
    return `
        <div class="box relative" id="nft${fieldId}_${id}">
          <img src="${metadata.image}" alt="${metadata.name}" />
          <div class="box-content">
            <h3>#${id} ${metadata.name}</h3>
            <p>${metadata.description}</p>
            <div class="btn-group">${btn}</div>
          </div>
          ${tagNestable}
          <div id="generalError${fieldId}_${id}" class="error"></div>
        </div>
      `;
  } catch (e) {
    console.debug(e);
    return '<div>Apologies, we were unable to load NFTs metadata. </div>';
  }
}

async function createModal(id, contractAddress, nftName, fieldId = '') {
  if ($(`#modal${fieldId}_${id}`).length) {
    showModal(`${fieldId}_${id}`);
    return;
  }
  btnLoader($(`button[data-modal="modal${fieldId}_${id}"]`), true);

  // check if nestable NFT has any children or pending children
  const children = await childrenOf(id);
  const pendingChildren = await pendingChildrenOf(id);

  const hasChildren = children && children.length > 0;
  const hasPendingChildren = pendingChildren && pendingChildren.length > 0;

  const pendingChildrenHtml = pendingChildren.map((child, key) => {
    const disabled = key > 0 ? 'disabled' : '';
    return `<button class="pending-child relative ${disabled}" id="acceptChild${fieldId}_${child.tokenId}" onclick="acceptChildWrapper(${id}, '${child.contractAddress}', ${child.tokenId}, '${fieldId}_${child.tokenId}');"><span> Accept Child: ${child.tokenId}</span></button>`;
  });

  let nftActionsChildrenHtml = isCollectionNestable ? '<div class="absolute tags"><span class="tag">Nestable</span></div>' : '';
  nftActionsChildrenHtml += hasPendingChildren
    ? `<div class="absolute pending-children">
      	${pendingChildrenHtml.join('')}
        <button class="pending-child relative" id="rejectAllChildren${fieldId}_${id}" onclick="rejectAllChildrenWrapper(${id}, ${
        pendingChildren.length
      }, '${fieldId}_${id}');"><span>Reject Children</span</button>
    </div>`
    : '';

  const childrenHtml = hasChildren
    ? `
    <div class="nft-children">  
      <h3>Children</h3>
        <div class="grid small">
          ${await renderChildren(`${contractAddress}`, id, children, `${fieldId}_${id}`)}
        </div>
      </div>`
    : '';

  const nestingHtml = `
  <div class="nesting flex">
    <div>
      <h3>Nesting NFTs from the same smart contract</h3>
      <p> To nest NFTs under the ${nftName}, please select the NFTs you want to nest as children. </p>
      <div class="grid small">
        ${await renderNFTsToNest(`${contractAddress}`, id, `${fieldId}_${id}`)}
      </div>
      <br />
      <button id="nestTransferFrom${fieldId}_${id}" onclick="nestTransferFromWrapper(${id}, '${fieldId}_${id}', '${contractAddress}');">Nest NFT under ${nftName}</button>
    </div>
    <div class="box collection br text-center">
      <div class="collection-info">
        ${generateCollectionInfo(id)}
      </div>
    </div>
  </div>`;

  const html = `
    <div class="nestable">    
      ${childrenHtml}
      ${nestingHtml}

      <div class="nestable-actions">

        <div class="btn-group hidden"> 
          <div class="field">
            <label for="addressNestMint${fieldId}_${id}">
              <span>Child Contract Address</span>
              ${renderTooltip('Enter child collection address from where you want to mint NFT and transfer it to this NFT. Initial address is from this collection.')}              
            </label>
            <input id="addressNestMint${fieldId}_${id}" type="text" value="${contractAddress}" />
          </div>
          <button id="childNestMint${fieldId}_${id}" onclick="childNestMintWrapper(${id}, '${fieldId}_${id}');">Nest Mint Child under ${nftName}</button>
        </div>

        <div class="btn-group">
          <h3>Nesting NFTs from a different smart contract</h3>
          <p> To nest NFTs under the ${nftName}, please select the NFTs you want to nest as children. </p>
          <div class="field">
            <label for="addressTransferFrom${fieldId}_${id}">
              <span>Child Contract Address</span>
                ${renderTooltip('Enter child collection address from where you want to transfer NFT. Initial address is from this collection.')}  
            </label>
            <input id="addressTransferFrom${fieldId}_${id}" type="text" value="" />
          </div>
          <div class="field">
            <label for="tokenTransferFrom${fieldId}_${id}">
              <span>Token ID</span>
                ${renderTooltip('With Token ID you choose which token you will transfer.')} 
            </label>
            <input id="tokenTransferFrom${fieldId}_${id}" type="number" value="" />
          </div>
          <button id="nestTransferFrom${fieldId}_${id}" onclick="nestTransferFromWrapper(${id}, '${fieldId}_${id}');">Nest NFT under ${nftName}</button>
        </div>  
      
      </div>
      <div id="generalError${fieldId}_${id}" class="error"></div>
    </div>
  `;

  renderModal(id, nftActionsChildrenHtml, html, fieldId);
  btnLoader($(`button[data-modal="modal${fieldId}_${id}"]`), false);
}

function renderModal(id, nftActionsChildrenHtml, html, fieldId = '') {
  const parentHtml = $('<div />')
    .append($(`#nft${fieldId}_${id}`).clone())
    .html();

  const modal = `
    <div class="modal open" id="modal${fieldId}_${id}" data-id="${id}" data-field="${fieldId}">
     <div class="modal-container">
      <div class="container">
        <div class="header br">
          <div class="header-l">
            <h1>
              A matter of minutes. And zero developing costs. Want to build your
              own NFT collection?
            </h1>
            <a href="https://apillon.io/" class="builders" target="_blank">
              Build with Apillon
            </a>
          </div>
          <div class="header-r">
            <img src="images/header.svg" />
          </div>
        </div>
          <button class="btn-modal-exit">⇐ Go back</button>
        <div class="parent-token relative">
          ${parentHtml}
          ${nftActionsChildrenHtml}
        </div>
        <div class="nested-tokens">
          ${html}
        </div>        
      </div>      
     </div>
    </div>
    `;
  $('#modals').append(`${modal}`);
  $(`#modal${fieldId}_${id}`).find(`#nft${fieldId}_${id}`).find('button').remove();

  renderDrop(id);
  showModal(`${fieldId}_${id}`);
  modalCloseEvents(`${fieldId}_${id}`);
}

function renderTooltip(tooltipText, placeholder = '') {
  return `
    <span class="tooltip large" tooltip="${tooltipText}" position="top">
      ${placeholder || '<img src="images/info.svg" width="16" height="16" alt="icon info" />'}
    </span>
    `;
}

async function showModal(id) {
  if ($(`#modal${id}`).length) {
    $(`#modal${id}`).addClass('open');
    document.body.classList.add('lock');
  }
}

function refreshModal() {
  const id = $(`.modal.open`).attr('data-id');
  if (id) {
    const field = $(`.modal.open`).attr('data-field') || '';
    $(`.modal.open`).remove();

    const metadata = NFTs[Number(id)];
    createModal(Number(id), contractAddress, metadata?.name, field, true);
  }
}
