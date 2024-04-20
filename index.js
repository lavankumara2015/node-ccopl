const express = require("express");
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

app.post("/webhook", async function (req, res) {
  try {
    const { entry } = req.body;
    const { changes } = entry[0];
    const { value } = changes[0];
    const senderMobileNumber = value.messages[0].from;
    const patientName = value?.contacts[0]?.profile?.name || "";

    const collection = await db.collection("patients");
    const isSenderExists = await collection.findOne({
      from: senderMobileNumber,
    });
    console.log(value.messages[0].type);
    if (value.messages[0].type === "reaction") {
      console.log(value.messages[0].reaction)
      await collection.findOneAndUpdate(
        {
          from: senderMobileNumber,
          "messages.id": value.messages[0].reaction.message_id,
        },
        {
          $push: {
            "messages.$.reaction": [
              { emoji: value.messages[0].reaction.emoji },
            ],
          },
        }
      );
      res.send({ msg: "Reaction sent" });
    } else if (isSenderExists) {
      await collection.updateOne(
        { from: senderMobileNumber },
        { $push: { messages: value.messages[0] } }
      );
      console.log("Document updated successfully.");
      res.status(201).json({ msg: "Document updated successfully." });
    } else {
      console.log("option 2");
      await collection.insertOne({
        name: patientName,
        from: senderMobileNumber,
        coachId: "",
        coachName: "",
        messages: [value.messages[0]],
        imageUrl: "",
        area: "",
        stage: "",
      });
      console.log("New document inserted successfully.");
      res.status(201).json({ msg: "Created Successfully" });
    }
  } catch (error) {
    res.status(400).json({ msg: "Something Went Wrong", error: error.message });
  }
});

function getMessageObject(data, type = "text") {
  if (type === "text") {
    let messages = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "918096255759",
      type: "text",
      text: {
        preview_url: false,
        body: data.text,
      },
    };
    return messages;
  } else if (type === "reaction") {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "918096255759",
      type: "reaction",
      reaction: {
        message_id:
          "wamid.HBgMOTE4MDk2MjU1NzU5FQIAEhggQUU0MjZDMUJCMUEyODQ1NTI3NjZDM0M0NEU1RjY2RDgA",
        emoji: data.emoji,
      },
    };
  }
}

app.post("/message", async function (request, response) {
  try {
    const { type, data } = await request.body;
    let formattedObject = getMessageObject(data, type);
    const ourResponse = await fetch(
      "https://graph.facebook.com/v19.0/232950459911097/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization:
            "Bearer EABqxsZAVtAi8BO4TjmZBatrXr0IlGIZAOP7xVpt1zqCLZCOL5TPQ6n2Se3ZCeYTqJEa3LrssVHS8i9wpTwdSW81e7lRnBrLqjkETZCjRCvlp9ZBne5ZCpfOv86t4AWU1htKtEhvHfNM7eJIrSRThr5LIamYejQjmkVI1Bhi0UVctw0bWF1eTNknbTLAvOmTI11qgvorpeoGkOl9npZCfksEYZD",
        },
        body: JSON.stringify(formattedObject),
      }
    );
    console.log(ourResponse);
    if (ourResponse.ok) {
      console.log("Yes all is well");
      response.status(201).json({ msg: "Created Successfully" });
    } else {
      response.status(401).json({ msg: "Something Unexpected" });
    }
  } catch (error) {
    response.status(400).json({ msg: `Something Went Wrong ${error.message}` });
  }
});

app.post("/coach", async (req, res) => {
  console.log("Process started");
  try {
    const collection = await db.collection("coachs");
    const { name, mobile, password } = req.body;
    if (!name || !mobile || !password)
      return res.status(201).json({ msg: "Data cannot be empty", status: 400 });
    const coach = {
      username: name,
      mobileNum: mobile,
      password: password,
    };
    await collection.insertOne(coach);
    res.status(201).json({ msg: "Coaches Created", status: 201, password });
  } catch (error) {
    res.status(201).json({ msg: "Something Went Wrong", status: 400 });
  }
});

app.post("/patient", async (req, res) => {
  try {
    const { name } = req.body;
  } catch (error) {
    res.status(201).json({ msg: "Something Went Wrong Message", status: 400 });
  }
});

// await collection.findOneAndUpdate([{ "messages.id": value.messages[0].id }, {$reaction: [{emoji: "", userNumber: value.metadata.display_phone_number}]}]);
