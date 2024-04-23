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
  document.updated_at = null;
  return document;
};

app.post("/webhook", async function (req, res) {
  try {
    console.log(JSON.stringify(req.body));
    let patientsCollection = await db.collection("patients");
    let messagesCollection = await db.collection("messages");
    const { entry } = req.body;
    const { changes } = entry[0];
    const { value } = changes[0];

    if (value.statuses !== undefined) {
      console.log("this applied");
      return res.status(200).json({ msg: "Not need status" });
    }
    let patient = await patientsCollection.findOne({
      patient_phone_number: value.messages[0].from,
    });
    if (value.messages[0].type === "reaction") {
      let message = await messagesCollection.findOne({
        id: value.messages[0].reaction.message_id,
      });
      if (!patient) {
        await patientsCollection.insertOne(
          addTimestamps({
            name: value?.contacts[0]?.profile?.name || "",
            image_url: "",
            patient_phone_number: value.messages[0].from,
            message_ids: [value.messages[0].id],
            coach: "",
            area: "",
            stage: "",
          })
        );
      } else if (message) {
        await messagesCollection.updateOne(
          {
            id: value.messages[0].reaction.message_id,
          },
          [
            {
              $set: {
                updated_at: new Date(),
                reactions: {
                  $cond: {
                    if: { $in: [value.messages[0].from, "$reactions.user"] }, // Check if user exists in reactions array
                    then: {
                      $map: {
                        input: "$reactions",
                        as: "reaction",
                        in: {
                          $cond: {
                            if: { $eq: ["$$reaction.user", value.messages[0].from] }, // Find the reaction object for the user
                            then: { user: value.messages[0].from, emoji: value.messages[0].reaction.emoji }, // Update emoji if user exists
                            else: "$$reaction",
                          },
                        },
                      },
                    },
                    else: {
                      $concatArrays: [
                        "$reactions",
                        [{ user: value.messages[0].from, emoji: value.messages[0].reaction.emoji }],
                      ],
                    }, // Add new reaction if user doesn't exist
                  },
                },
              },
            },
          ]
        );
        // messagesCollection.updateOne(
        //   {
        //     id: value.messages[0].reaction.message_id,
        //   },
        //   {
        //     $set: {
        //       updated_at: new Date(),
        //     },
        //     $addToSet: {
        //       reactions: {
        //         $each: [
        //           {
        //             user: value.messages[0].from,
        //             emoji: value.messages[0].reaction.emoji,
        //           },
        //         ],
        //       },
        //     },
        //   }
        // );
      }

      return res.send({ msg: "Reaction Updated" });
    } else if (!patient) {
      await patientsCollection.insertOne(
        addTimestamps({
          name: value?.contacts[0]?.profile?.name || "",
          image_url: "",
          patient_phone_number: value.messages[0].from,
          message_ids: [value.messages[0].id],
          coach: "",
          area: "",
          stage: "",
        })
      );
      await messagesCollection.insertOne(
        addTimestamps({
          ...value.messages[0],
          message_type: "Incoming",
          reactions: [],
        })
      );
      return res.sendStatus(200);
    } else {
      await messagesCollection.insertOne(
        addTimestamps({
          ...value.messages[0],
          message_type: "Incoming",
          reactions: [],
        })
      );
      console.log(value.messages[0].id, "jjjj");
      await patientsCollection.findOneAndUpdate(
        {
          patient_phone_number: value.messages[0].from,
        },
        {
          $push: {
            message_ids: value.messages[0].id,
          },
        }
      );
    }
    res.send({ msg: "Reaction Updated" });
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
    const { type, data, to } = await request.body;
    let patientsCollection = await db.collection("patients");
    let messagesCollection = await db.collection("messages");
    let formattedObject = getMessageObject(data, type);
    const ourResponse = await fetch(
      "https://graph.facebook.com/v19.0/232950459911097/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer EABqxsZAVtAi8BOwPlAZApIQv6MjiAtYA19t7o4dZBOjjvgbJsIDDbTggtX6Ay7FEf6ZAAL9vRL1TvtVFWYj4wIrIKEBjtKRZBhnLi8lcpX1rdjgNZClzaN4e6XEZC7ajq3PWdRCZBOviBjTs8sfRsZBfy27SUFRizHCxNexwicVq5DKRE2LVZCZBHtynJIrl2ixDypt8canOjC9ZB0ebEcg1vlAZD",
        },
        body: JSON.stringify(formattedObject),
      }
    );
    if (ourResponse.ok) {
      let responseData = await ourResponse.json();
      let coachMessage = addTimestamps({
        from: to,
        id: responseData.messages[0].id,
        type: "text",
        text: {
          body: data.text,
        },
        message_type: "Outgoing",
      });
      await messagesCollection.insertOne(coachMessage);
      await patientsCollection.findOneAndUpdate(
        {
          patient_phone_number: to,
        },
        {
          $push: {
            message_ids: responseData.messages[0].id,
          },
        }
      );
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
