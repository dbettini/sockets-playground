const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const moniker = require("moniker");
const socketio = require("socket.io");

app.use(express.static("public"));

app.get("/name", (req, res) => {
    res.send({ name: moniker.choose() });
});
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/index.html"));
});

const http = app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

const io = socketio(http);

io.on("connection", socket => {
    console.log("a user connected");
    socket.on("disconnect", () => console.log("a user disconnected"));
})