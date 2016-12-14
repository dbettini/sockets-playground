const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
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
const people = {};

io.on("connection", socket => {
    socket.on("join", name => {
        people[socket.id] = name;
        socket.emit("update", "You have connected to the server.");
        io.emit("update", name + " has joined the server.");
        io.emit("update-people", people);
    });
    socket.on("disconnect", () => {
        io.emit("update", people[socket.id] + " has left the server.");
        delete people[socket.id];
        io.emit("update-people", people);
    });
    socket.on("send", (msg) => io.emit("send", people[socket.id], msg));
});
// maybe remove socket id entirely?
