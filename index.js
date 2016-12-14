const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const moniker = require("moniker");
const socketio = require("socket.io");
const _ = require("lodash");
const webPush = require("./webPush");

app.use(express.static("public"));

app.get("/api/name", (req, res) => {
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
const pushConfigs = {};

io.on("connection", socket => {
    socket.on("join", (data) => {
        let {name, endpoint, authSecret, key} = JSON.parse(data);
        pushConfigs[endpoint] = { name, authSecret, key };
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
    socket.on("send", (msg) => {
        io.emit("send", people[socket.id], msg);
        const endpoint = _.findKey(pushConfigs,
            config => config.name == people[socket.id]);
        const {name, key, authSecret} = pushConfigs[endpoint];
        console.log(name, endpoint, key, authSecret)
        webPush.sendNotification(endpoint,
            {
                TTL: 0,
                payload: msg,
                userPublicKey: key,
                userAuth: authSecret,
                delay: 0
            });
    });
    socket.on("leave", (name) => {
        _.remove(pushConfigs, config => config.name == name)
    })
});
