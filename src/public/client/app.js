const nickForm = document.querySelector("#nick");
const msgForm = document.querySelector("#msg");
const messageList = document.querySelector("ul");

function makeSocketEventListner(url) {
  const socket = new WebSocket(`ws://${url}`);
  return (callback, eventName) => {
    eventName !== undefined
      ? socket.addEventListener(eventName, (arg) => callback(arg))
      : callback(socket);
  };
}

const socketEventListner = makeSocketEventListner(window.location.host);
socketEventListner(() => console.log("Connected to Server"), "open");
socketEventListner((msg) => {
  const li = document.createElement("li");
  li.innerText = msg.data;
  messageList.append(li);
}, "message");
socketEventListner(() => console.log("Disconnected to Server", "close"));
socketEventListner(
  (socket) =>
    setTimeout(() => {
      socket.send("hello from the browser!");
    }),
  1000
);

function makeElemEventListener(elem) {
  return (callback, eventName) => {
    elem.addEventListener(eventName, callback);
  };
}

function makeMessage(type, payload) {
  return JSON.stringify({ type, payload });
}

function handleSubmit(id) {
  const elem = document.querySelector(`#${id}`);
  return () => {
    const input = elem.querySelector("input");
    socketEventListner((socket) => socket.send(makeMessage(id, input.value)));
    input.value = "";
  };
}

function makeAlert(msg) {
  const myNick = document.querySelector("#my-nick");
  myNick.innerHTML = msg;
  msgForm.querySelector("input").value = "";
  setTimeout(() => {
    myNick.innerHTML = "";
  }, 3000);
}

function checkSubmit(checker, msg) {
  return (hs) => (event) => {
    event.preventDefault();
    checker() ? hs() : makeAlert(msg);
  };
}

function makeNickName(hs) {
  return (event) => {
    event.preventDefault();
    const myNick = document.querySelector("#my-nick");
    const nickName = nickForm.querySelector("input");
    myNick.innerHTML = nickName.value;
    hs();
  };
}

function checkMyNick() {
  const myNick = document.querySelector("#my-nick").innerHTML;
  return myNick === "" ? false : true;
}
const nickFormEventListner = makeElemEventListener(nickForm);
const msgFormEventListner = makeElemEventListener(msgForm);

nickFormEventListner(makeNickName(handleSubmit("nick")), "submit");
msgFormEventListner(
  checkSubmit(checkMyNick, "별명부터 먼저 입력하세요")(handleSubmit("msg")),
  "submit"
);
