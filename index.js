
var express = require("express");
var bodyParser = require("body-parser");
require('dotenv').config()

const PORT = process.env.PORT || 3017;

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (request, response) {
  response.send(
    "Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!"
  );
});

let data ;

app.get("/webhook", function (req, res) {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == "token"
  ) {
    // res.send(req.query["hub.challenge"]);
    response.status(200).json({data});

  } else {
    res.sendStatus(400);
  }

});

app.post("/webhook", function (request, response) {
  console.log(request.body);
  console.log("Incoming webhook: " + JSON.stringify(request.body));
  data = JSON.stringify(request.body)
});
var listener = app.listen(PORT, function () {
  console.log("Your app is listening on port " + PORT);
});

