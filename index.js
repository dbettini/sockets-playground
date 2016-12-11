const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const moniker = require("moniker");

app.use(express.static("public"));

app.get("/name", (req, res) => {
    res.send({ name: moniker.choose() });
});
app.get("*", (req, res) => {
    res.sendFile("/public/index.html");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});