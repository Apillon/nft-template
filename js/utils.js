function browserName() {
  let userAgent = navigator.userAgent;
  let browserName = "";

  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "edge";
  } else if (userAgent.match(/brave/i)) {
    browserName = "brave";
  } else {
    browserName = "No browser detection";
  }
  return browserName;
}
function browserSupportsMetaMask() {
  return ["chrome", "firefox", "brave", "edge", "opera"].includes(
    browserName()
  );
}

function metamaskNotSupportedMessage() {
  return browserSupportsMetaMask()
    ? "You need MetaMask extension to connect wallet!"
    : "Your browser does not support MetaMask, please use another browser!";
}

function modalEvents() {
  removeModalEvents();
  setTimeout(() => addModalEvents(), 1);
}

function modalEvent(id) {
  addModalEvents(id);
}

function addModalEvents(id = null) {
  const modals = id
    ? document.querySelectorAll(`[data-modal='modal${id}']`)
    : document.querySelectorAll("[data-modal]");

  modals.forEach(function (trigger) {
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      const modal = document.getElementById(trigger.dataset.modal);
      modal.classList.add("open");
      document.body.classList.add("lock");

      const exits = modal.querySelectorAll(".modal-exit");
      exits.forEach(function (exit) {
        exit.addEventListener("click", function (event) {
          event.preventDefault();
          modal.classList.remove("open");
          if (!id || id.length < 4) {
            document.body.classList.remove("lock");
          }
        });
      });
    });
  });
}

function modalCloseEvents(id = null) {
  const modals = id
    ? document.querySelectorAll(`[data-modal='modal${id}']`)
    : document.querySelectorAll("[data-modal]");

  modals.forEach(function (trigger) {
    const modal = document.getElementById(trigger.dataset.modal);
    const exits = modal.querySelectorAll(".modal-exit");
    exits.forEach(function (exit) {
      exit.addEventListener("click", function (event) {
        event.preventDefault();
        modal.classList.remove("open");
        if (!id || id.length < 4) {
          document.body.classList.remove("lock");
        }
      });
    });
  });
}

function removeModalEvents() {
  const modals = document.querySelectorAll("[data-modal]");

  modals.forEach(function (trigger) {
    $(trigger).off();

    const modal = document.getElementById(trigger.dataset.modal);
    const exits = modal.querySelectorAll(".modal-exit");
    exits.forEach(function (exit) {
      $(exit).off();
    });
  });
}

function handleOpenModal(event) {}
