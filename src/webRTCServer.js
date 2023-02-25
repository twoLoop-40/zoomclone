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

server.listen(3000, () => console.log("Listening on http://localhost:3000"));
