import express from "express";
import http from "http";
import { Server } from "socket.io";

//server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
app.use("/public", express.static(`${__dirname}/public`));
app.get("/", (_, res) => res.render("ioHome"));
app.get("/*", (_, res) => res.redirect("/"));

// get public rooms
function isElement(key, aMap) {
  return aMap?.get(key) !== undefined;
}

function diffenceMap(srcMap, tgtMap) {
  if (srcMap === undefined) return new Map();
  const result = new Map();
  for (const [key, value] of srcMap) {
    if (!isElement(key, tgtMap)) {
      result.set(key, value);
    }
  }
  return result;
}

function getPublicRooms(io) {
  const rooms = io.sockets.adapter.rooms;
  const sids = io.sockets.adapter.sids;
  return diffenceMap(rooms, sids);
}

function getRoomNames(gpr) {
  return (io) => {
    const rooms = gpr(io);
    return [...rooms.keys()];
  };
}

// connect
io.on("connection", (socket) => {
  socket.on("enter_room", (roomName, nickname, showRoomWithRoomList) => {
    socket.nickname = nickname;
    socket.join(roomName);
    const rooms = getRoomNames(getPublicRooms)(io);
    rooms.forEach((aRoom) => {
      socket.to(aRoom).emit("welcome", nickname, rooms, roomName);
    });
    showRoomWithRoomList(rooms, roomName, nickname);
  });
  socket.on("new_message", (msg, roomName, addMessage) => {
    socket
      .to(roomName)
      .emit(
        "new_message",
        socket.nickname ? `${socket.nickname}: ${msg}` : msg
      );
    addMessage(msg);
  });
  socket.on("change_nickname", (nickname, roomName, showRoomBasic) => {
    const oldNickname = socket.nickname;
    socket.nickname = nickname;
    socket.to(roomName).emit("change_nickname", oldNickname, nickname);
    showRoomBasic(roomName, nickname);
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("leave", socket.nickname);
    });
  });

  socket.on("disconnect", () => {
    const rooms = getRoomNames(getPublicRooms)(io);
    rooms.forEach((aRoom) => {
      socket.to(aRoom).emit("room_change", rooms);
    });
  });
});

server.listen(3000, () => console.log("Listening on http://localhost:3000"));
