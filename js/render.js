function loadInfo(isCollectionNestable) {
  let content = `
          <b> Name: </b>${info.name} </br>
          <b> Symbol: </b>${info.symbol} </br>
          <b> Soulbound: </b>${info.soulbound} </br>
          <b> Supply: </b>${info.totalSupply}/${info.maxSupply} </br>
        `;

  if (info.drop) {
    const dropStartTimestamp = info.dropStart.toNumber() * 1000;

    content = `${content}<b> Price: </b>${ethers.utils.formatEther(
      info.price
    )}</br>`;

    if (info.totalSupply.eq(info.maxSupply)) {
      $("#drop").html("<h3>Sold out!</h3>");
    } else if (dropStartTimestamp > Date.now()) {
      // The data/time we want to countdown to
      const dropStartDate = new Date(dropStartTimestamp);
      countdown(dropStartDate);

      // Run myFunc every second
      var myFunc = setInterval(function () {
        countdown(dropStartDate);
        // Display the message when countdown is over
        var timeLeft = dropStartDate - new Date().getTime();
        if (timeLeft < 0) {
          clearInterval(myFunc);

          if (isCollectionNestable) {
            renderMintNestable();
          } else {
            renderMint();
          }
        }
      }, 1000);
    } else if (isCollectionNestable) {
      renderMintNestable();
    } else {
      renderMint();
    }
  }
  $("#collection").html(content);
  $("#actions").show();
}

function countdown(date) {
  var now = new Date().getTime();
  var timeLeft = date - now;

  // Calculating the days, hours, minutes and seconds left
  var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  $("#drop").html(`
    <b> Drop: </b>${date.toDateString()} ${date.toLocaleTimeString()} </br>
    ${days} <b>d </b>
    ${hours} <b>h </b>
    ${minutes} <b>m </b>
    ${seconds} <b>s </b>
  `);
}

function renderMint() {
  $("#drop").html(`
    <div class="field">
      <label for="amount">Number of tokens (1-5):</label>
      <input id="amount" type="number" min="1" max="5" value="1" />
    </div>
    <button id="btnMint" onclick="mint()">Mint</button>
  `);
}

function renderMintNestable() {
  $("#drop").html(`
    <div class="mintNestable">
      <strong>Mint this collection</strong>
      <button id="mint" onclick="mintWrapper();">Mint</button>
      <br /><br />
      <strong>Or mint another nestable collection</strong>  
      <br /><br />
      <div class="field">
        <label for="address">Contract Address:</label>
        <input id="address" type="text" />
      </div>
      <button id="childMint" onclick="childMintWrapper();">Mint</button>      
    </div>
  `);
}

function btnLoader(el, loading) {
  if (loading) {
    el.attr("data-text", el.text());
    el.addClass("loading");
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
    el.removeClass("loading");
    el.html(el.attr("data-text"));
  }
}

function nftExistsCheckAndErrorRender(nftCount, address = null) {
  if (nftCount > 0) {
    $("#nfts").html("");
    return true;
  } else if (address) {
    $("#nfts").html('<h2 class="text-center">You don\'t have any NFTs</h2>');
  } else {
    $("#nfts").html(
      '<h2 class="text-center">No NFTs, they must be minted first.</h2>'
    );
  }
  return false;
}

function checkInputAddress(address = null, fieldId = "") {
  if (address) {
    $(`#generalError${fieldId}`).html("");
    return true;
  } else {
    $(`#generalError${fieldId}`).html("Enter contract address!");
    window.scrollTo(0, 0);
    return false;
  }
}
function transactionStatus(status, msg, fieldId = "") {
  if (status) {
    $(`#generalError${fieldId}`).html("");
  } else {
    $(`#generalError${fieldId}`).html(msg);
  }
}

function checkInputToken(token = null, fieldId = "") {
  if (token && Number(token) >= 0) {
    $(`#generalError${fieldId}`).html("");
    return true;
  } else {
    $(`#generalError${fieldId}`).html("Enter token ID!");
    window.scrollTo(0, 0);
    return false;
  }
}

async function renderNft(id, url) {
  let metadata = null;

  try {
    metadata = await $.getJSON(url);

    const isMyNFT = myNFTs.includes(id);

    const btnOpenModal =
      isCollectionNestable && isMyNFT
        ? `<button data-modal="modal_${id}" data-token-id="${id}" onclick="createModal(${id}, '${nftAddress}');">Open NFT</button>`
        : "";

    $("#nfts").append(`
        <div class="box br" id="nft_${id}">
          <img src="${metadata.image}" alt="${metadata.name}" />
          <div class="box-content">
            <h3>${metadata.name || `#${id}`}</h3>
            <p>${metadata.description}</p>
            ${btnOpenModal}
          </div>
        </div>
      `);
  } catch (e) {
    console.log(e);
    if ($("#nfts").text().length <= 1) {
      $("#nfts").html(
        '<h3 class="text-center">Apologies, we were unable to load NFTs at this time. Please try again later or contact our support team for assistance. Thank you for your patience.</h3>'
      );
    }
  }
}

async function renderChildren(contractAddress, parentId, children, fieldId) {
  let html = "";

  for (let i = 0; i < children.length; i++) {
    try {
      const child = children[i];
      const id = child.tokenId.toNumber();
      const childNftContract = getNftContract(child.contractAddress);
      const url = await childNftContract.tokenURI(child.tokenId.toBigInt());

      html += await renderChild(contractAddress, parentId, id, url, fieldId);
    } catch (error) {
      console.log(error);
    }
  }
  return html;
}

async function renderChild(contractAddress, parentId, id, url, fieldId) {
  try {
    const metadata = await $.getJSON(url);

    return `
        <div class="box" id="nft${fieldId}_${id}">
          <img src="${metadata.image}" alt="${metadata.name}" />
          <div class="box-content">
            <h3>${metadata.name || `#${id}`}</h3>
            <p>${metadata.description}</p>
            <div class="btn-group">
              <button id="transfer${fieldId}_${id}" onclick="transferChildWrapper(${parentId}, '${contractAddress}', ${id}, '${fieldId}_${id}');">Transfer Token to wallet</button>
            </div>
          </div>
        </div>
      `;
  } catch (e) {
    console.log(e);
    return "<div>Apologies, we were unable to load NFTs. </div>";
  }
}

async function createModal(id, contractAddress, fieldId = "") {
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
  const pendingChild = hasPendingChildren ? pendingChildren[0] : null;

  const childAddress = pendingChild ? pendingChild.contractAddress : null;
  const childId = pendingChild
    ? ethers.BigNumber.from(pendingChild.tokenId).toNumber()
    : null;

  const btnAcceptChild = hasPendingChildren
    ? `<div class="btn-group">
          <div class="child-pending">
            <div>Address: <small>${childAddress}</small></div>
            <div>Id: <strong>${childId}</strong></div>
          </div>
          <div class="actions">
            <button id="acceptChild${fieldId}_${id}" onclick="acceptChildWrapper(${id}, '${childAddress}', ${childId}, '${fieldId}_${id}');">Accept Child</button>
            <button id="rejectAllChildren${fieldId}_${id}" onclick="rejectAllChildrenWrapper(${id}, ${pendingChildren.length}, '${fieldId}_${id}');">Reject All Children</button>
          </div>
        </div>`
    : "";
  const childrenHtml = hasChildren
    ? `
      <p>
        <strong>Nested NFTs:</strong>
      </p>
      <div class="grid">
        ${await renderChildren(
          `${contractAddress}`,
          id,
          children,
          `${fieldId}_${id}`
        )}
      </div>`
    : "";

  const html = `
    <div class="nestable">
      <div class="nestable-actions">      
        ${btnAcceptChild}
        <div class="btn-group">
          <div class="field">
            <label for="addressNestMint${fieldId}_${id}">Contract Address:</label>
            <input id="addressNestMint${fieldId}_${id}" type="text" />
          </div>
          <button id="childNestMint${fieldId}_${id}" onclick="childNestMintWrapper(${id}, '${fieldId}_${id}');">Nest Mint</button>
        </div>
        <div class="btn-group">
          <div class="field">
            <label for="addressTransferFrom${fieldId}_${id}">Contract Address:</label>
            <input id="addressTransferFrom${fieldId}_${id}" type="text" />
          </div>
          <div class="field">
            <label for="tokenTransferFrom${fieldId}_${id}">Token ID:</label>
            <input id="tokenTransferFrom${fieldId}_${id}" type="number" />
          </div>
          <button id="nestTransferFrom${fieldId}_${id}" onclick="nestTransferFromWrapper(${id}, '${fieldId}_${id}');">Nest Transfer From</button>
        </div>  
      
      </div>
      <div id="generalError${fieldId}_${id}" class="error"></div>
      ${childrenHtml}
    </div>
  `;

  renderModal(id, html, fieldId);
  btnLoader($(`button[data-modal="modal${fieldId}_${id}"]`), false);
}

function renderModal(id, html, fieldId = "") {
  const parentHtml = $("<div />")
    .append($(`#nft${fieldId}_${id}`).clone())
    .html();

  const modal = `
    <div class="modal open" id="modal${fieldId}_${id}">
      <div class="modal-bg modal-exit">
        <div class="btn-modal-exit"></div>
      </div>
      <div class="modal-container">
        <div class="parent-token">
          ${parentHtml}
        </div>
        <div class="nested-tokens">
          ${html}
        </div>        
      </div>
    </div>
    `;
  $("#modals").append(`${modal}`);
  $(`#modal${fieldId}_${id}`)
    .find(`#nft${fieldId}_${id}`)
    .find("button")
    .remove();

  showModal(`${fieldId}_${id}`);
  modalCloseEvents(`${fieldId}_${id}`);
}

async function showModal(id) {
  if ($(`#modal${id}`).length) {
    $(`#modal${id}`).addClass("open");
    document.body.classList.add("lock");
  }
}
