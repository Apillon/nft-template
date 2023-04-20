const provider = new ethers.providers.Web3Provider(window.ethereum);
const contract = new ethers.Contract(nftAddress, nftAbi, provider);
let info = {};

$(async function () {
  const currentChain = await getCurrentChain();
  if (currentChain != chainId) {
    try {
      await switchChain();
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
    content = `${content}
          <b> Price: </b>${ethers.utils.formatEther(info.price)}</br>
          `;
    if (info.totalSupply.eq(info.maxSupply)) {
      $("#drop").html("Sold out!");
    } else {
      // TODO: add countdown if drop not yet available info.dropStart (unix timestamp in seconds) else show buy
      $("#drop").html(`
              <input id="amount" type="number" min="1" max="5" />
              <button onclick="mint()">Mint</button>
            `);
    }
  }
  $("#collection").html(content);
}

async function mint() {
  const nft = new ethers.Contract(nftAddress, nftAbi, provider).connect(
    provider.getSigner()
  );

  const address = await provider.getSigner().getAddress();
  const amount = $("#amount").val();
  const value = info.price.mul(ethers.BigNumber.from(amount)); // 0.1
  const tx = await nft.mint(address, amount, { value });
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
}

async function switchChain() {
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }], // chainId must be in HEX with 0x in front
  });
}

async function loadAllNFTs() {
  const balance = info.totalSupply;

  if (balance.toBigInt() > 0) {
    $("#nfts").html("");
  } else {
    $("#nfts").html("<div class='col-sm-12'>No NFTs</div>");
  }

  for (let i = 0; i < balance.toBigInt(); i++) {
    const id = await contract.tokenByIndex(i);
    console.log(id);

    const url = await contract.tokenURI(id.toBigInt());
    console.log(url);

    let metadata = null;
    try {
      metadata = await $.getJSON(url);
    } catch (e) {
      console.log(e);
      metadata = {
        name: "",
        description: "",
        image: "",
      };
    }
    $("#nfts").append(`
            <div id="nft${id}" class="col-sm-3">
              <h3>${metadata.name || `#${id}`}</h3>
              <p>${metadata.description}</p>
              <img class="img-fluid" src="${metadata.image}" />
            </div>
          `);
  }
}

async function loadMyNFTs() {
  const address = await provider.getSigner().getAddress();
  console.log(address);

  const balance = await contract.balanceOf(address);
  console.log(balance);

  if (balance.toBigInt() > 0) {
    $("#nfts").html("");
  } else {
    $("#nfts").html("<div class='col-sm-12'>No NFTs</div>");
  }

  for (let i = 0; i < balance.toBigInt(); i++) {
    const id = await contract.tokenOfOwnerByIndex(address, i);
    console.log(id);

    const url = await contract.tokenURI(id.toBigInt());
    console.log(url);

    let metadata = null;
    try {
      metadata = await $.getJSON(url);
    } catch (e) {
      console.log(e);
      metadata = {
        name: "",
        description: "",
        image: "",
      };
    }
    $("#nfts").append(`
            <div id="nft${id}" class="col-sm-3">
              <h3>${metadata.name || `#${id}`}</h3>
              <p>${metadata.description}</p>
              <img class="img-fluid" src="${metadata.image}" />
            </div>
          `);
  }
}

function interpolate(str, params) {
  let names = Object.keys(params);
  let vals = Object.values(params);
  console.log(str);
  console.log(params);
  console.log(names);
  console.log(vals);
  return new Function(...names, `return \`${str}\`;`)(...vals);
}

// window.onload = function (event) {
//   fetchNft(
//     "https://ipfs2.apillon.io/ipfs/QmdeehwzFug2a5uLATB6app23QFV1mkKcynREfKJWcSJqB?filename=1.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipfs/QmXQ2CVr3A9CmQcAwnAe26aWijyRMxj1jSbFkSYGDcdWFL?filename=2.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8jq2cshxfo5a87sgnhonbp9mlyto8466oz66gahaiaijruzwv2n/1.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8jq2cshxfo5a87sgnhonbp9mlyto8466oz66gahaiaijruzwv2n/2.json"
//   );

//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8pany6qcxun1p7wg6nyx3goex2ae8vlfsl0c8e3iivv35v956zz/1.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8pany6qcxun1p7wg6nyx3goex2ae8vlfsl0c8e3iivv35v956zz/10.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8pany6qcxun1p7wg6nyx3goex2ae8vlfsl0c8e3iivv35v956zz/2.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8pany6qcxun1p7wg6nyx3goex2ae8vlfsl0c8e3iivv35v956zz/7.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8pany6qcxun1p7wg6nyx3goex2ae8vlfsl0c8e3iivv35v956zz/8.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8pany6qcxun1p7wg6nyx3goex2ae8vlfsl0c8e3iivv35v956zz/9.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8pany6qcxun1p7wg6nyx3goex2ae8vlfsl0c8e3iivv35v956zz/6.json"
//   );

//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8npzcl1emt7zvb094uqht0ika3b5ftem0sa32obkuwidkbd524v/1.json"
//   );
//   fetchNft(
//     "https://ipfs2.apillon.io/ipns/k2k4r8npzcl1emt7zvb094uqht0ika3b5ftem0sa32obkuwidkbd524v/2.json"
//   );
// };
// function fetchNft(url) {
//   const nfts = document.querySelector("#nfts");
//   const nftListItem = document.querySelector("#nftListItem");

//   fetch(url)
//     .then(function (response) {
//       // The API call was successful!
//       if (response.ok) {
//         return response.json();
//       } else {
//         return Promise.reject(response);
//       }
//     })
//     .then(function (response) {
//       const resData = {
//         name: response.name,
//         description: response.description,
//         image: response.image,
//       };
//       nfts.innerHTML += interpolate(nftListItem.innerHTML, resData);
//     })
//     .catch(function (err) {
//       // There was an error
//       console.warn("Something went wrong.", err);
//     });
// }
