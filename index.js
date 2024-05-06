const express = require("express");
const FormData = require("form-data");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const app = express();
const cors = require("cors");
app.use(cors());
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
  const nowInSeconds = Math.floor(Date.now() / 1000);
  document.timestamp = nowInSeconds.toString();
  return document;
};

const MediaFunction = async (media_id) => {
  const ourResponse = await fetch(
    `https://graph.facebook.com/v19.0/${media_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${process.env.MADE_WITH} `,
      },
    }
  );
  const ourData = await ourResponse.json();
  //console.log(ourData.url);
  if (ourData.url !== undefined) {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${ourData.url}`,
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${process.env.MADE_WITH} `,
      },
    };
    const response = await axios.request(config);
    let contentType = response.headers["content-type"];
    const collection = await db.collection("messages");
    let item;
    if (contentType.startsWith("image")) {
      item = { image: response.data };
    } else if (contentType.startsWith("video")) {
      item = { video: response.data };
    } else if (contentType.startsWith("application/pdf")) {
      item = { document: response.data };
    } else if (contentType.startsWith("audio")) {
      item = { audio: response.data };
    } else if (contentType.startsWith("sticker")) {
      item = { sticker: response.data };
    } else {
      console.log("error");
    }
    return item;
  }
};

async function uploadImageToWhatsAppMediaAPI() {
  let imagePath = "./pictures/img1.png";
  try {
    const imageData = fs.readFileSync(IMAGE_PATH, { encoding: "base64" });
    const response = await axios.post(API_URL, imageData, {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        "Content-Type": MEDIA_TYPE,
      },
    });
    console.log("Upload successful!");
    console.log("Media ID:", response.data.mediaId);
  } catch (error) {
    console.error("Upload failed:", error.response.data);
  }
}

async function checkUserAndCreateIfNotExist(value, create = false) {
  try {
    let patientsCollection = await db.collection("patients");
    let patient = await patientsCollection.findOne({
      patient_phone_number: value.messages[0].from,
    });
    if (create) {
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
    }
    return true;
  } catch (error) {
    return false;
  }
}

app.post("/webhook", async function (req, res) {
  try {
    //console.log(JSON.stringify(req.body));
    let patientsCollection = await db.collection("patients");
    let messagesCollection = await db.collection("messages");
    const { entry } = req.body;
    const { changes, id } = entry[0];
    const { value } = changes[0];
    //console.log(value.messages[0].type);

    if (value.statuses !== undefined) {
      //console.log("this applied");
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
            patient_phone_number_id: id,
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
                    if: { $in: [value.messages[0].from, "$reactions.user"] },
                    then: {
                      $map: {
                        input: "$reactions",
                        as: "reaction",
                        in: {
                          $cond: {
                            if: {
                              $eq: ["$$reaction.user", value.messages[0].from],
                            },
                            then: {
                              user: value.messages[0].from,
                              emoji: value.messages[0].reaction.emoji,
                            },
                            else: "$$reaction",
                          },
                        },
                      },
                    },
                    else: {
                      $concatArrays: [
                        "$reactions",
                        [
                          {
                            user: value.messages[0].from,
                            emoji: value.messages[0].reaction.emoji,
                          },
                        ],
                      ],
                    },
                  },
                },
              },
            },
          ]
        );
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
          patient_phone_number_id: id,
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
      if (
        ["video", "audio", "image", "document", "sticker"].includes(
          value.messages[0].type
        )
      ) {
        // console.log(value.messages[0]);
        let mediaData = await MediaFunction(
          value.messages[0][`${value.messages[0].type}`].id
        );
        //  console.log(mediaData?.insertedId)
        //  console.log(value.messages[0][`${value.messages[0].type}`].id);

        await messagesCollection.insertOne(
          addTimestamps({
            ...value.messages[0],
            message_type: "Incoming",
            reactions: [],
            delivery_status: "",
            media_data: mediaData,
          })
        );
        console.log(value.messages[0].id, "media");
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
        return res.send({ msg: "Media Added" });
      }

      await messagesCollection.insertOne(
        addTimestamps({
          ...value.messages[0],
          message_type: "Incoming",
          reactions: [],
          delivery_status: "",
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

async function getMessageObject(data, to, type = "text") {
  if (type === "text") {
    let messages = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
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
      to: to,
      type: "reaction",
      reaction: {
        message_id: data.message_id,
        emoji: data.emoji,
      },
    };
  } else if (
    ["video", "audio", "image", "document", "sticker"].includes(type)
  ) {
    let formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("file", fs.createReadStream(data.path));

    let mediaData = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://graph.facebook.com/v19.0/232950459911097/media",
      headers: {
        Authorization: `Bearer ${process.env.MADE_WITH}`,
        // "Content-Type": "image/jpeg",
        ...formData.getHeaders(),
      },
      data: formData,
    };

    try {
      let response = await axios.request(mediaData);
      const mediaId = response.data.id;
      console.log("media Id", mediaId);
      return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: type,
        [`${type}`]: {
          id: mediaId,
        },
      };
    } catch (error) {
      throw new Error(error);
    }
  }
}

app.post("/message", async function (request, response) {
  try {
    const { type, data, to } = await request.body;
    let patientsCollection = await db.collection("patients");
    let messagesCollection = await db.collection("messages");

    let formattedObject = await getMessageObject(data, to, type);
    const ourResponse = await fetch(
      "https://graph.facebook.com/v19.0/232950459911097/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MADE_WITH} `,
        },
        body: JSON.stringify(formattedObject),
      }
    );
    let responseData = await ourResponse.json();
    console.log(responseData);
    if (ourResponse.ok) {
      let coachMessage = addTimestamps({
        coach_phone_number: "+15556105902",
        from: to,
        coach_name: "",
        id: responseData.messages[0].id,
        type: type,
        text: {
          body: data.text,
        },
        reactions: [],
        message_type: "Outgoing",
        delivery_status: "",
      });
      if (type !== "reaction") {
        if (["video", "audio", "image", "document", "sticker"].includes(type)) {
          let bufferFormat = await MediaFunction(formattedObject[`${type}`].id);
          delete coachMessage.text;
          coachMessage.media_data = bufferFormat;
        }
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
      } else {
        let num = "+15556105902";
        delete coachMessage.text;
        await messagesCollection.updateOne(
          {
            id: data.message_id,
          },
          [
            {
              $set: {
                updated_at: new Date(),
                reactions: {
                  $cond: {
                    if: { $in: [num, "$reactions.user"] },
                    then: {
                      $map: {
                        input: "$reactions",
                        as: "reaction",
                        in: {
                          $cond: {
                            if: {
                              $eq: ["$$reaction.user", num],
                            },
                            then: {
                              user: num,
                              emoji: data.emoji,
                            },
                            else: "$$reaction",
                          },
                        },
                      },
                    },
                    else: {
                      $concatArrays: [
                        "$reactions",
                        [
                          {
                            user: num,
                            emoji: data.emoji,
                          },
                        ],
                      ],
                    },
                  },
                },
              },
            },
          ]
        );
      }
      response.status(201).json({ msg: "Created Successfully" });
    } else {
      response
        .status(401)
        .json({ msg: "Something Unexpected", error: responseData.message });
    }
  } catch (error) {
    response.status(400).json({ msg: `Something Went Wrong ${error.message}` });
  }
});

app.post("/coach", async (req, res) => {
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
    //console.log(data);
    res.send({ data: data });
  } catch (error) {
    res.status(201).json({ msg: "Something Went Wrong", status: 400 });
    //console.log(error.message);
  }
});

app.get("/messageData", async (req, res) => {
  try {
    const collection = await db.collection("messages");
    let data = await collection.find({}, { messages: 1 }).limit(10).sort({_id: -1});
    data = await data.toArray();
    res.send({ data: data });
  } catch (error) {
    res.status(400).json({ msg: "Something Went Wrong", status: 400 });
    //console.log(error.message);
  }
});

app.get("/mediaData", async (req, res) => {
  try {
    const collection = await db.collection("media");
    let data = await collection.find({}, { media: 1 });
    data = await data.toArray();
    res.send({ data: data });
  } catch (error) {
    res.status(400).json({ msg: "Something went wrong", status: 400 });
  }
});

// await collection.findOneAndUpdate([{ "messages.id": value.messages[0].id }, {$reaction: [{emoji: "", userNumber: value.metadata.display_phone_number}]}]);

setTimeout(() => {
  let a = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "{{Recipient-Phone-Number}}",
    type: "image",
    image: {
      link: "http(s)://image-url",
    },
  };
}, 5000);
