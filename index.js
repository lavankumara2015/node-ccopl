const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const app = express();
app.use(express.json());
require("dotenv").config();
const PORT = process.env.PORT || 3007;

let client = new MongoClient(
  "mongodb+srv://sanjukanki56429:dmX96TLZGz7OYS9A@cluster0.eg2lxgb.mongodb.net/"
);
let db;

let initializeDBAndServer = async (req, res) => {
  try {
    db = await client.db("test");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

initializeDBAndServer();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (request, response) {
  response.send(
    "Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!"
  );
});

app.get("/webhook", function (req, res) {
  res.sendStatus(200);
});

app.post("/webhook", function (request, response) {
  console.log(request.body);
  const { entry } = request.body;
  const { changes } = entry[0];
  const { value } = changes[0];
  console.log(changes);
  console.log(value);
  console.log(JSON.stringify(value));
});
