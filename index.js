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

app.post("/webhook", async function (request, response) {
  try {
    console.log(request.body);
    const { entry } = request.body;
    const { changes } = entry[0];
    const { value } = changes[0];
    console.log(value)
    const collection = await db.collection("our_messages");
    if (value.messages[0].type === "reaction") {
      const messageId = value.messages[0].id;
      await collection.findOneAndUpdate(
        { "messages.id": value.messages[0].id },
        {
          $set: {
            reaction: [
              { emoji: value.messages[0].reaction.emoji, userNumber: value.metadata.display_phone_number },
            ],
          },
        }
      );
      return response.status(202).json({ msg: "Updated successfully", status: 202 });
    }

    await collection.insertOne({ ...value, status: "delivered", coachId: "1" });
    response.status(201).json({ msg: "Created Successfully" });
  } catch (error) {
    response
      .status(400)
      .json({ msg: "Something Went Wrong", error: error.message });
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

// await collection.findOneAndUpdate([{ "messages.id": value.messages[0].id }, {$reaction: [{emoji: "", userNumber: value.metadata.display_phone_number}]}]);
