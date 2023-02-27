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
app.get("/", (_, res) => res.render("webRTCHome"));
app.get("/*", (_, res) => res.redirect("/"));

io.on("connection", (socket) => {
  socket.on("join_room", (roomName, nickname) => {
    socket.join(roomName);
    socket.nickname = nickname;
    socket.to(roomName).emit("welcome", socket.nickname);
  });
  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit("offer", offer);
  });
  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit("answer", answer);
  });
  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit("ice", ice);
  });
});

server.listen(3000, () => console.log("Listening on http://localhost:3000"));
