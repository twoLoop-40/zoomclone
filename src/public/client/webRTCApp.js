const socket = io();

// global states
let states = {};
function updateStates(newStates) {
  states = { ...states, ...newStates };
}

// elements
const selfFace = document.getElementById("self-face");
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const camerasSelect = document.getElementById("cameras-select");

// helper functions
function setInnerText(elem) {
  return (text) => {
    elem.innerText = text;
  };
}

function addAction(origin, ...actions) {
  return (...arg) => {
    actions.forEach((action) => action());
    origin(...arg);
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

Promise.all([
  getMedia({ audio: true, video: { facingMode: "user" } }),
  getCameras(),
])
  .then(([selfStream, cameras]) => {
    updateStates({ selfStream, cameras });
    selfFace.srcObject = selfStream;
    cameras.forEach((camera) => {
      const addOptionTo = makeOption({
        value: camera.deviceId,
        text: camera.label,
      });
      addOptionTo(camerasSelect);
    });
  })
  .catch((err) => console.log(err));

// make listeners
function makeElemEventListener(elem) {
  return (eventName, handler) => {
    elem.addEventListener(eventName, (event) => {
      handler(event);
    });
  };
}

// set staters
const setMuteBtnState = useBtn(false);
const setCameraBtnState = useBtn(true);

// listeners
const muteBtnListener = makeElemEventListener(muteBtn);
const cameraBtnListener = makeElemEventListener(cameraBtn);
const camerasSelectListener = makeElemEventListener(camerasSelect);

muteBtnListener("click", (event) => {
  event.preventDefault();
  const { selfStream } = states;
  selfStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  const muteBtnState = setMuteBtnState((state) => !state);
  const setMuteBtnText = setInnerText(muteBtn);
  muteBtnState ? setMuteBtnText("음소거 해제") : setMuteBtnText("음소거");
});

cameraBtnListener("click", (event) => {
  event.preventDefault();
  const { selfStream } = states;
  selfStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  const cameraBtnState = setCameraBtnState((state) => !state);
  const setCameraBtnText = setInnerText(cameraBtn);
  cameraBtnState
    ? setCameraBtnText("카메라 끄기")
    : setCameraBtnText("카메라 켜기");
});

camerasSelectListener("input", (event) => {
  event.preventDefault();
  const cameraId = event.target.value;
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: cameraId } },
  };
  getMedia(cameraConstraints);
});
