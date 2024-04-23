const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const app = express();
app.use(express.json());
require("dotenv").config();
const PORT = process.env.PORT || 3007;

let db;

let initializeDBAndServer = async (req, res) => {
  try {
    client = new MongoClient(
      "mongodb+srv://sanjukanki56429:dmX96TLZGz7OYS9A@cluster0.eg2lxgb.mongodb.net/"
    );
    db = await client.db("test");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

initializeDBAndServer();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", async function (request, response) {
  response.send(
    "Simple WhatsApp Webhook tester</br>There is no front-end, see server.js for implementation!"
  );
});

app.get("/webhook", function (req, res) {
  res.sendStatus(200);
});

const addTimestamps = (document) => {
  const now = new Date();
  document.created_at = now;
  document.updated_at = now;
  return document;
};

app.post("/webhook", async function (req, res) {
  try {
    let patientsCollection = await db.collection("patients");
    let messagesCollection = await db.collection("messages");
    console.log(JSON.stringify(req.body));
    const { entry } = req.body;
    const { changes } = entry[0];
    const { value } = changes[0];

    if (value.statuses !== undefined) {
      return res.status(200).json({msg: "Not need status"})
    }
    let isPatientExists = await patientsCollection.findOne({
      from: value.messages[0].from,
    });

    if (!isPatientExists) {
      await patientsCollection.insertOne(
        addTimestamps({
          patient_phone_number: value.messages[0].from,
          messageIds: [value.messages[0].id],
          coach: "",
          area: "",
          stage: "",
        })
      );
      await messagesCollection.insertOne(
        addTimestamps({
          ...value.messages[0],
          message_type: "Incoming",
        })
      );
      res.sendStatus(200);
    } else {
      console.log(exists);
    }
    res.send({ msg: "Okay" });
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

app.get("/users", async (req, res) => {
  try {
    const collection = await db.collection("patients");
    let data = await collection.find({}, { messages: 1 });
    data = await data.toArray();
    console.log(data);
    res.send({ data: data });
  } catch (error) {
    res.status(201).json({ msg: "Something Went Wrong", status: 400 });
    console.log(error.message);
  }
});

// await collection.findOneAndUpdate([{ "messages.id": value.messages[0].id }, {$reaction: [{emoji: "", userNumber: value.metadata.display_phone_number}]}]);
