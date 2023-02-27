// helper functions
function setInnerText(elem) {
  return (text) => {
    elem.innerText = text;
  };
}

function setInputValue(elem) {
  return (value) => {
    value ? (elem.value = value) : (elem.value = "");
  };
}

function getInputValue(elem) {
  return elem.value;
}

function addAction(origin, ...actions) {
  return (...args) => {
    actions.forEach((action) => action());
    return origin(...args);
  };
}

function makeOption({ value, text }) {
  const option = document.createElement("option");
  value ? (option.value = value) : null;
  text ? (option.innerText = text) : null;
  return (select) => {
    select.appendChild(option);
  };
}

function useBtn(btnState) {
  return (changeState) => {
    btnState = changeState(btnState);
    return btnState;
  };
}

// async functions
async function getMedia({ audio, video }) {
  try {
    const selfStream = await navigator.mediaDevices.getUserMedia({
      audio,
      video,
    });
    updateStates({ selfStream });
    return selfStream;
  } catch (err) {
    console.log(err);
  }
}

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    return cameras;
  } catch (err) {
    console.log(err);
  }
}

// make listeners
function makeElemEventListener(elem) {
  return (eventName, handler) => {
    elem.addEventListener(eventName, (event) => {
      handler(event);
    });
  };
}

function makeSocketEventListener(socket, type) {
  return (eventName, ...handler) => {
    type === undefined
      ? socket["on"](eventName, ...handler)
      : socket[type](eventName, ...handler);
  };
}

function makeOffer(peerConnection) {
  return async (offer) => {
    peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer);
    return answer;
  };
}

export {
  getMedia,
  getCameras,
  setInnerText,
  setInputValue,
  getInputValue,
  addAction,
  makeOption,
  useBtn,
  makeElemEventListener,
  makeSocketEventListener,
  makeOffer,
};
