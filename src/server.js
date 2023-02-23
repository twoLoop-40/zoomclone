import express from "express";
import ws from "ws";
import http from "http";

// make server
const app = express();
const server = http.createServer(app);

app.set("view engine", "pug");
app.set("views", `${__dirname}/views`);
app.use("/public", express.static(`${__dirname}/public`));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

// combinators
function handleSocket(handler, eventName) {
  return (socket) =>
    eventName !== undefined ? socket.on(eventName, handler) : handler(socket);
}

function attachHandler(handler, eventName) {
  return (hs) => (socket) => {
    hs(socket);
    handleSocket(handler, eventName)(socket);
  };
}

// socket connection
const sockets = [];
function makeSocketConnection(server) {
  const wss = new ws.Server({ server });
  return (hs) =>
    wss.on("connection", (socket) => {
      sockets.push(socket);
      socket.on("message", (msg) => {
        const { type, payload } = JSON.parse(msg);
        type === "nick"
          ? (socket.nickname = payload)
          : sockets
              .filter((aSocket) => aSocket.nickname !== payload)
              .forEach((aSocket) =>
                aSocket.send(`${socket.nickname}: ${payload}`)
              );
      });
      hs(socket);
    });
}

const handleConnection = makeSocketConnection(server);

// business logic
const attachGreeting = attachHandler(() => console.log("Connected to Server"));

// excution
function pipe(...funcs) {
  return (x) => funcs.reduce((f, g) => g(f), x);
}

pipe(
  attachGreeting,
  handleConnection
)(handleSocket(() => console.log("Disconnected to Server"), "close"));

server.listen(3000, () => console.log(`Listening on http://localhost:3000`));
