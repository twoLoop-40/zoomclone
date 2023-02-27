import {
  getCameras,
  getMedia,
  makeElemEventListener,
  makeOffer,
  makeSocketEventListener,
  setInnerText,
  useBtn,
} from "../../lib/webRTCHelper";

const socket = io();

// global states
let states = {};
function updateStates(newStates) {
  states = { ...states, ...newStates };
}
async function getStates() {
  return states;
}

// elements
const call = document.getElementById("call");
const selfFace = document.getElementById("self-face");
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const camerasSelect = document.getElementById("cameras-select");
const welcome = document.getElementById("welcome");
const welcomeForm = document.getElementById("welcome-form");
const room = document.getElementById("room");
const roomInfo = room.querySelector("#room-info");
const nicknameInfo = room.querySelector("#nickname-info");
const peerFace = document.getElementById("peer-face");

// set staters
const setMuteBtnState = useBtn(false);
const setCameraBtnState = useBtn(true);

// listeners
const muteBtnListener = makeElemEventListener(muteBtn);
const cameraBtnListener = makeElemEventListener(cameraBtn);
const camerasSelectListener = makeElemEventListener(camerasSelect);
const welcomeFormListener = makeElemEventListener(welcomeForm);
const socketListener = makeSocketEventListener(socket);
const socketEmittor = makeSocketEventListener(socket, "emit");

// connections
function makeConnection() {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });

  peerConnection.addEventListener("icecandidate", (data) => {
    const { roomName } = states;
    if (data.candidate) {
      socketEmittor("ice", data.candidate, roomName);
    } else {
      console.log("no candidate");
    }
  });

  peerConnection.addEventListener("track", (data) => {
    if (data.streams) {
      console.log(data.streams);
      peerFace.srcObject = data.streams[0];
    }
  });

  return peerConnection;
}

async function startMedia() {
  welcome.hidden = true;
  call.hidden = false;
  room.hidden = false;

  const { roomName, nickname } = states;
  const setRoomInfoText = setInnerText(roomInfo);
  setRoomInfoText(` ${roomName}`);
  const setNicknameInfoText = setInnerText(nicknameInfo);
  setNicknameInfoText(` ${nickname}`);

  const peerConnection = makeConnection();
  updateStates({ peerConnection });

  await Promise.all([
    getMedia({ audio: true, video: { facingMode: "user" } }),
    getCameras(),
  ])
    .then(([selfStream, cameras]) => {
      selfStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, selfStream));

      selfFace.srcObject = selfStream;
      updateStates({ selfStream, cameras });

      cameras.forEach((camera) => {
        const addOptionTo = makeOption({
          value: camera.deviceId,
          text: camera.label,
        });
        addOptionTo(camerasSelect);
      });
    })
    .catch((err) => console.log(err));
}

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

camerasSelectListener("input", async (event) => {
  event.preventDefault();
  const cameraId = event.target.value;
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: cameraId } },
  };
  await getMedia(cameraConstraints);
  const { peerConnection, selfStream } = await getStates();
  if (peerConnection && selfStream) {
    const videoTrack = selfStream.getVideoTracks()[0];
    const videoSender = peerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
});

welcomeFormListener("submit", async (event) => {
  event.preventDefault();
  const nicknameInput = welcomeForm.querySelector("#nickname");
  const roomNameInput = welcomeForm.querySelector("#room-name");
  const [roomName, nickname] = [roomNameInput, nicknameInput].map((input) =>
    getInputValue(input)
  );
  [roomNameInput, nicknameInput].map((input) => setInputValue(input)(""));
  updateStates({ roomName, nickname });
  await startMedia();
  socketEmittor("join_room", roomName, nickname);
});

socketListener("welcome", async (nickname) => {
  console.log(`${nickname}님이 입장하셨습니다.`);
  const { peerConnection, roomName } = await getStates();
  const offer = await peerConnection.createOffer();
  peerConnection.setLocalDescription(offer);
  socketEmittor("offer", offer, roomName);
});

socketListener("offer", async (offer) => {
  const { peerConnection, roomName } = await getStates();
  if (!peerConnection) {
    await makeConnection();
    const { peerConnection } = await getStates();
    const makeAnswer = makeOffer(peerConnection);
    const answer = await makeAnswer(offer);
    updateStates({ answer });
    socketEmittor("answer", answer, roomName);
  } else {
    if (offer) {
      console.log("received offer");
    }
    const makeAnswer = makeOffer(peerConnection);
    const answer = await makeAnswer(offer);
    updateStates({ answer });
    socketEmittor("answer", answer, roomName);
    console.log("sent answer");
  }
});

socketListener("answer", async (answer) => {
  const { peerConnection } = await getStates();
  if (answer) {
    console.log("received answer");
    peerConnection.setRemoteDescription(answer);
  }
});

socketListener("ice", (ice) => {
  const { peerConnection } = states;
  if (ice) {
    console.log("received candidate");
    peerConnection.addIceCandidate(ice);
  } else {
    console.log("no ice");
  }
});
