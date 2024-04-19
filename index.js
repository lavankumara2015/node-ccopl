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
  // if (req.query["hub.mode"] == "subscribe" &&
  //   req.query["hub.verify_token"] == "token"
  // ) {
  //   res.send(req.query["hub.challenge"]);
  // } else {
  //   res.sendStatus(200);
  // }

  res.sendStatus(200)
});

app.post("/webhook", function (request, response) {
  console.log(request.body);
  const { entry } = request.body;
  const { changes } = entry[0];
  const { value } = changes[0];
  console.log(changes);
  console.log(value);
  console.log(JSON.stringify(value))
  // console.log(JSON.stringify(request.body))
});
var listener = app.listen(PORT, function () {
  console.log("Your app is listening on port " + PORT);
});
