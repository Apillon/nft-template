import { formatEther, maxUint256 } from 'viem';
import { contractLink } from './utils';
import { CollectionInfo, Nft } from './types';
import { CONTRACT_ADDRESS } from './config';

export function loadInfo(info: any) {
  writeToElement('collection', generateCollectionInfo(info));
  renderDrop(info);
  show('actions');
}

export function generateCollectionInfo(info: any) {
  const maxSupply = info.maxSupply.toString() === maxUint256.toString() ? '&infin;' : info.maxSupply.toString();
  let content = `
          <b> Collection address: </b>
          <a href="${contractLink(CONTRACT_ADDRESS)}" target="_blank">
            ${CONTRACT_ADDRESS} 
            <img src="./images/icon-open.svg" width="10" height="10" style="width:10px" />
          </a>
          </br>
          <b> Name: </b>${info.name} </br>
          <b> Symbol: </b>${info.symbol} </br>
          <b> Revocable: </b>${info.revokable} </br>
          <b> Soulbound: </b>${info.soulbound} </br>
          <b> Supply: </b>${info.totalSupply}/${maxSupply} </br>            
  `;

  if (info.drop) {
    content = `${content}<b> Price: </b>${formatEther(info.price)}</br>`;
  }
  show('drop');
  return content;
}

export function renderDrop(info: CollectionInfo) {
  if (info.drop) {
    const dropStartTimestamp = info.dropStart * 1000;

    if (info.totalSupply === info.maxSupply) {
      writeToElement('drop', '<h3>Sold out!</h3>');
    } else if (dropStartTimestamp > Date.now()) {
      // The data/time we want to countdown to
      const dropStartDate = new Date(dropStartTimestamp);
      countdown(dropStartDate);

      // Run myFunc every second
      var myFunc = setInterval(function () {
        countdown(dropStartDate);
        // Display the message when countdown is over
        var timeLeft = dropStartDate.getTime() - new Date().getTime();
        if (timeLeft < 0) {
          clearInterval(myFunc);

          renderMint();
        }
      }, 1000);
    } else {
      renderMint();
    }
  }
}

export function countdown(date: Date) {
  var now = new Date().getTime();
  var timeLeft = date.getTime() - now;

  // Calculating the days, hours, minutes and seconds left
  var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  var hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  writeToElement(
    'drop',
    `
      <b> Drop: </b>${date.toDateString()} ${date.toLocaleTimeString()} </br>
      ${days} <b>d </b>
      ${hours} <b>h </b>
      ${minutes} <b>m </b>
      ${seconds} <b>s </b>
  `
  );
}

export function renderMint() {
  writeToElement(
    'drop',
    `
    <div class="field-amount">
      <label for="amount">Number of tokens (1-5):</label>
      <input id="amount" type="number" min="1" max="5" value="1" />
    </div>
  `
  );
  show('btnMint');
}

export function btnLoader(el?: HTMLElement | null, loading: boolean = false) {
  if (!el) return;
  if (loading) {
    el.setAttribute('data-text', el.textContent || '');
    el.classList.add('loading');
    el.innerHTML = `
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
    `;
  } else {
    el.classList.remove('loading');
    el.innerHTML = el.getAttribute('data-text') || '';
  }
}

export function nftExistsCheckAndErrorRender(nftCount: number, address?: string | null) {
  if (nftCount > 0) {
    writeToElement('nfts', '');
    return true;
  } else if (address) {
    writeToElement('nfts', '<h2 class="text-center">You don\'t have any NFTs</h2>');
  } else {
    writeToElement('nfts', '<h2 class="text-center">No NFTs, they must be minted first.</h2>');
  }
  return false;
}

export function checkInputAmount(amount?: number | string) {
  if (amount && Number(amount) > 0 && Number(amount) <= 5) {
    writeToElement(`generalError`, '');
    return true;
  } else {
    writeToElement(`generalError`, 'Enter valid amount (number from 1 to 5)!');
    window.scrollTo(0, 0);
    return false;
  }
}

export function transactionStatus(msg: string) {
  writeToElement(`generalError`, msg);
}

export function transactionError(msg: string, error: any) {
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

export async function renderNft(id: number, metadata: Nft) {
  const e = document.getElementById('nfts');
  if (e && metadata.name && metadata.image) {
    e.innerHTML += `
        <div class="box br relative" id="nft_${id}">
          <img src="${metadata.image}" alt="${metadata.name}" />
          <div class="box-content">
            <h3>#${id} ${metadata.name}</h3>
            <p>${metadata.description}</p>
          </div>
        </div>
      `;
  }
}

export function show(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.hidden = false;
    el.style.display = 'block';
  }
}

export function hide(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.hidden = true;
    el.style.display = 'none';
  }
}

export function writeToElement(id: string, html: string) {
  const e = document.getElementById(id);
  if (e) {
    e.innerHTML = html;
  }
}
