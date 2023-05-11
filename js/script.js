const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(nftAddress, nftAbi, provider);
let info = {};

$(async function () {
  const currentChain = await getCurrentChain();
  if (currentChain != chainId) {
    try {
      await switchChain();
      location.reload();
    } catch (e) {
      await addChain();
    }
  }

  await ethereum.request({ method: "eth_requestAccounts" });
  info = await getCollectionInfo();
  loadInfo();
  await loadAllNFTs();
});

function loadInfo() {
  let content = `
          <b> Name: </b>${info.name} </br>
          <b> Symbol: </b>${info.symbol} </br>
          <b> Soulbound: </b>${info.soulbound} </br>
          <b> Supply: </b>${info.totalSupply}/${info.maxSupply} </br>
        `;

  if (info.drop) {
    const dropStartTimestamp = info.dropStart.toNumber() * 1000;

    content = `${content}
          <b> Price: </b>${ethers.utils.formatEther(info.price)}</br>
          `;
    if (info.totalSupply.eq(info.maxSupply)) {
      $("#drop").html("<h3>Sold out!</h3>");
    } else if (dropStartTimestamp > Date.now()) {
      // The data/time we want to countdown to
      const dropStartDate = new Date(dropStartTimestamp);
      countdown(dropStartDate);

      // Run myfunc every second
      var myfunc = setInterval(function () {
        countdown(dropStartDate);
        // Display the message when countdown is over
        var timeleft = dropStartDate - new Date().getTime();
        if (timeleft < 0) {
          clearInterval(myfunc);
          renderMint();
        }
      }, 1000);
    } else {
      renderMint();
    }
  }
  $("#collection").html(content);
  $("#actions").show();
}

function countdown(date) {
  var now = new Date().getTime();
  var timeleft = date - now;

  // Calculating the days, hours, minutes and seconds left
  var days = Math.floor(timeleft / (1000 * 60 * 60 * 24));
  var hours = Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((timeleft % (1000 * 60)) / 1000);

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
    <div class="amount">
      <label for="amount">Number of tokens (1-5):</label>
      <input id="amount" type="number" min="1" max="5" value="1" />
    </div>
    <button id="btnMint" onclick="mint()">Mint</button>
  `);
}

async function mint() {
  btnLoader($("#btnMint"), true);
  try {
    const nft = new ethers.Contract(nftAddress, nftAbi, provider).connect(
      provider.getSigner()
    );

    const address = await provider.getSigner().getAddress();
    const amount = $("#amount").val();
    const value = info.price.mul(ethers.BigNumber.from(amount)); // 0.1
    const tx = await nft.mint(address, amount, { value });

    btnLoader($("#btnMint"), false);
  } catch (error) {
    console.log(error);
    btnLoader($("#btnMint"), false);
  }
}

async function getCollectionInfo() {
  const info = {};
  info["name"] = await contract.name();
  info["symbol"] = await contract.symbol();
  info["maxSupply"] = await contract.maxSupply();
  info["totalSupply"] = await contract.totalSupply();
  info["soulbound"] = await contract.isSoulbound();
  info["revokable"] = await contract.isRevokable();
  info["drop"] = await contract.isDrop();
  info["dropStart"] = await contract.dropStart();
  info["reserve"] = await contract.reserve();
  info["price"] = await contract.price();
  info["royaltiesFees"] = await contract.royaltiesFees();
  info["royaltiesAddress"] = await contract.royaltiesAddress();
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
  }
}

async function switchChain() {
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }], // chainId must be in HEX with 0x in front
  });
}

async function loadAllNFTs() {
  btnLoader($("#btnAllNFTs"), true);
  const balance = info.totalSupply;

  await renderNFTs(balance);
  btnLoader($("#btnAllNFTs"), false);
}

async function loadMyNFTs() {
  btnLoader($("#myNFTs"), true);
  const address = await provider.getSigner().getAddress();
  const balance = await contract.balanceOf(address);

  await renderNFTs(balance, address);

  btnLoader($("#myNFTs"), false);
}

async function renderNFTs(balance, address = null) {
  if (balance.toBigInt() > 0) {
    $("#nfts").html("");
  } else {
    $("#nfts").html('<h2 class="text-center">No NFTs</h2>');
    return;
  }

  for (let i = 0; i < balance.toBigInt(); i++) {
    const id = address
      ? await contract.tokenOfOwnerByIndex(address, i)
      : await contract.tokenByIndex(i);
    const url = await contract.tokenURI(id.toBigInt());

    let metadata = null;
    try {
      metadata = await $.getJSON(url);

      $("#nfts").append(`
        <div class="box br" id="nft_${id}">
          <img src="${metadata.image}" alt="${metadata.name}" />
          <div class="box-content">
            <h3>${metadata.name || `#${id}`}</h3>
            <p>${metadata.description}</p>
          </div>
        </div>
      `);
    } catch (e) {
      console.log(e);
      metadata = {
        name: "",
        description: "",
        image: "",
      };
      $("#nfts").html(
        '<h3 class="text-center">Apologies, we were unable to load NFTs at this time. Please try again later or contact our support team for assistance. Thank you for your patience.</h3>'
      );
    }
  }
}

function btnLoader(el, loading) {
  if (loading) {
    el.addClass("loading");
    el.attr("data-text", el.text());
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
