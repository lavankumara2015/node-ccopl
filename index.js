var express = require("express");
var bodyParser = require("body-parser");
require("dotenv").config();

const PORT = process.env.PORT || 3007;
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (request, response) {
  response.send(
    "Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!"
  );
});
app.get("/webhook", function (req, res) {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == "token"
  ) {
    console.log("Incoming webhook: " + JSON.stringify(req.body));
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
});
app.post("/webhook", function (request, response) {
  console.log(request.body);
  const { entry } = request.body;
  const { changes } = entry;
  console.log(changes);
});
var listener = app.listen(PORT, function () {
  console.log("Your app is listening on port " + PORT);
});
