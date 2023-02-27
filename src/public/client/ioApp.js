import { addMessage, showRoomBasic } from "../../lib/browserdraw";
import {
  getInputValues,
  getTextValue,
  regExpReplaceToNone,
  setInnerHTML,
  setInputValue,
  toggleShow,
} from "../../lib/helpers";

const socket = io("/");

// elements
const welcome = document.getElementById("welcome");
const room = document.getElementById("room");
const changeNickName = document.getElementById("change-nickname");
const sendMessage = document.getElementById("send-message");
const roomList = document.getElementById("room-list");

toggleShow(room);

// helper functions

function getTextForReg(reg) {
  return (gtv) => (elem) => regExpReplaceToNone(reg, gtv(elem));
}

// broswer draw functions
function addCleanUp(am) {
  return (msgs, elem) => {
    const ul = elem.querySelector("ul");
    setInnerHTML(ul)("");
    msgs.forEach((msg) => {
      am(msg, elem);
    });
  };
}

function addActionToShowRoom(addAction) {
  return (showRoom) => (roomName, nickname) => {
    addAction();
    showRoom(roomName, nickname);
  };
}

function currentRoomsToShowRoom(sr) {
  return (roomNames, roomName, nickname) => {
    const addMessageCleanUp = addCleanUp(addMessage);
    addMessageCleanUp(roomNames, roomList);
    sr ? sr(roomName, nickname) : null;
  };
}

const addToggle = addActionToShowRoom(() => toggleShow(room));
const showRoom = addToggle(showRoomBasic);

// event handlers
function handleRoomSubmit(_) {
  toggleShow(welcome);
  const [roomName, nickname] = getInputValues(
    ...welcome.querySelectorAll("input")
  );
  socketEmittor(
    "enter_room",
    roomName,
    nickname,
    currentRoomsToShowRoom(showRoom)
  );
}

function handleMessageSubmit(_) {
  const [msg] = getInputValues(...room.querySelectorAll("input"));
  const reg = /[a-z]*:\s/i;
  const roomName = regExpReplaceToNone(
    reg,
    getTextValue(room.querySelector("#room-name"))
  );
  socketEmittor("new_message", msg, roomName, () => {
    addMessage(`You: ${msg}`);
    setInputValue(room.querySelector("input"))("");
  });
}

function handleChangeNickNameSubmit() {
  const [nickname] = getInputValues(...room.querySelectorAll("input"));
  const reg = /[a-z]*:\s/i;
  const roomName = regExpReplaceToNone(
    reg,
    getTextValue(room.querySelector("#room-name"))
  );
  socketEmittor("change_nickname", nickname, roomName, () => {
    showRoomBasic(roomName, nickname);
    setInputValue(room.querySelector("input"))("");
  });
}

// event listener maker
function makeElemEventListener(elem) {
  return (eventName, handler) => {
    elem.addEventListener(eventName, (event) => {
      event.preventDefault();
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

// socket listeners
const socketListner = makeSocketEventListener(socket);
const socketEmittor = makeSocketEventListener(socket, "emit");

socketListner("leave", (nickname) => {
  addMessage(`${nickname} 가 방을 나갔습니다 ㅠㅠ`);
});
socketListner("welcome", (nickname, rooms, roomName) => {
  const reg = /[a-z]*:\s/i;
  const textForReg = getTextForReg(reg)(getTextValue);
  const nameHere = textForReg(room.querySelector("#room-name"));
  if (nameHere === roomName) {
    addMessage(`${nickname}가 입장하였습니다!`);
  }
  currentRoomsToShowRoom()(rooms);
});

socketListner("change_nickname", (oldNickname, nickname) => {
  addMessage(`${oldNickname} changed nickname to ${nickname}!`);
});

socketListner("new_message", addMessage);

socketListner("room_change", (rooms) => {
  currentRoomsToShowRoom()(rooms);
});

// event listeners
const welcomeListner = makeElemEventListener(welcome);
const sendMessageListner = makeElemEventListener(sendMessage);
const changeNickNameListner = makeElemEventListener(changeNickName);

welcomeListner("submit", handleRoomSubmit);
sendMessageListner("click", handleMessageSubmit);
changeNickNameListner("click", handleChangeNickNameSubmit);
