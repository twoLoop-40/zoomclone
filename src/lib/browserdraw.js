import { setInnerHTML } from "./helpers";

function addMessage(msg, elem) {
  elem = elem || room;
  const ul = elem.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  ul.append(li);
}

function showRoomBasic(roomName, nickname) {
  const roomNameH3 = setInnerHTML(room.querySelector("#room-name"));
  const nincnameH3 = setInnerHTML(room.querySelector("#nickname"));
  roomNameH3(`ROOM: ${roomName}`);
  nincnameH3(`NICK NAME: ${nickname}`);
}

export { addMessage, showRoomBasic };
