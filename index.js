const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const axios = require("axios");
const fs = require("fs");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3001",
      "http://localhost:3000",
      "https://todoassignmentfrontend.onrender.com",
      "http://192.168.29.41:3000",
      "https://cion-chat-app-frontend-11-1rwobmyui-tejas-projects-a32dbdf2.vercel.app",
      "https://cion-chat-app-frontend-11.vercel.app",
    ],
  },
});

app.use(cors());
app.use((req, res, next) => {
  res.io = io;
  next();
});
app.use(express.json());
require("dotenv").config();
const PORT = process.env.PORT || 3007;

let db;

let initializeDBAndServer = async (req, res) => {
  try {
    client = new MongoClient(
      "mongodb+srv://cionchat:Cionchat%401234@cluster0.xliikxl.mongodb.net/"
    );
    db = await client.db("test");
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
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

const Jimp = require("jimp");

async function compressImageBuffer(
  imageBuffer,
  quality = 5,
  outputFormat = Jimp.MIME_JPEG
) {
  try {
    // Read the image buffer
    const image = await Jimp.read(imageBuffer);

    // Compress the image with the specified quality
    const compressedImageBuffer = await image
      .quality(quality)
      .getBufferAsync(outputFormat);
    return compressedImageBuffer;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
}

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
  console.log(ourData);
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
    item.docTypeData = ourData;
    return item;
  }
};

app.post("/webhook", async function (req, res) {
  try {
    let patientsCollection = await db.collection("patients");
    let messagesCollection = await db.collection("messages");
    const { entry } = req.body;
    const { changes, id } = entry[0];
    const { value } = changes[0];

    if (value.statuses !== undefined) {
      return res.status(200).json({ msg: "Not need status" });
    }

    let patient = await patientsCollection.findOne({
      patient_phone_number: value.messages[0].from,
    });

    if (!patient) {
      let createdPatient = await patientsCollection.insertOne(
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
      res.io.emit("update patient", {
        patientId: createdPatient.insertedId,
        userNumber: value.messages[0].from,
      });
    }

    if (value.messages[0].type === "reaction") {
      let message = await messagesCollection.findOne({
        id: value.messages[0].reaction.message_id,
      });
      if (!patient) {
        let createdPatient = await patientsCollection.insertOne(
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
        res.io.emit("update patient", {
          patientId: createdPatient.insertedId,
          userNumber: value.messages[0].from,
        });
      } else if (message) {
        let createdMessageId = await messagesCollection.updateOne(
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
        res.io.emit("update user message", {
          messageId: createdMessageId.insertedId,
          userNumber: value.messages[0].from,
          whatsappMessageId: value.messages[0].reaction.message_id,
        });
      }

      return res.send({ msg: "Reaction Updated" });
    } else if (
      !["video", "audio", "image", "document", "sticker"].includes(
        value.messages[0].type
      )
    ) {
      let createdMessageId = await messagesCollection.insertOne(
        addTimestamps({
          ...value.messages[0],
          message_type: "Incoming",
          reactions: [],
        })
      );
      res.io.emit("update user message", {
        messageId: createdMessageId.insertedId,
        userNumber: value.messages[0].from,
        whatsappMessageId: value.messages[0].id,
      });
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

        delete mediaData["docTypeData"];

        let createdMessage = addTimestamps({
          ...value.messages[0],
          message_type: "Incoming",
          reactions: [],
          delivery_status: "",
          media_data: mediaData,
        });
        let compressedImage;
        if (mediaData && value.messages[0].type === "image") {
          compressedImage = await compressImageBuffer(mediaData.image, 5);
          createdMessage.compressedImage = compressedImage;
          console.log(createdMessage);
        }

        let createdMessageId = await messagesCollection.insertOne(
          createdMessage
        );

        res.io.emit("update user message", {
          messageId: createdMessageId.insertedId,
          userNumber: value.messages[0].from,
          whatsappMessageId: value.messages[0].id,
        });
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

      let createdMessageId = await messagesCollection.insertOne(
        addTimestamps({
          ...value.messages[0],
          message_type: "Incoming",
          reactions: [],
          delivery_status: "",
        })
      );
      res.io.emit("update user message", {
        messageId: createdMessageId.insertedId,
        userNumber: value.messages[0].from,
        whatsappMessageId: value.messages[0].id,
      });
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
    // res.io.emit("update user message", "data");
    res.send({ msg: "Reaction Updated" });
  } catch (error) {
    res.status(400).json({ msg: "Something Went Wrong", error: error.message });
  } finally {
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
        ...formData.getHeaders(),
      },
      data: formData,
    };

    try {
      let response = await axios.request(mediaData);
      const mediaId = response.data.id;
      console.log("media Id", mediaId, response.data);
      let obj = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: type,
        [type]: {
          id: mediaId,
        },
      };
      if (type === "audio") {
        delete obj[`${type}`].caption;
        delete obj[`${type}`].filename;
      }
      return obj;
    } catch (error) {
      console.log(error);
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
    let lastId = null;
    console.log(responseData, "Reaponse");
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
          let bufferData = await MediaFunction(formattedObject[`${type}`].id);
          delete coachMessage.text;
          coachMessage[`${type}`] = bufferData.docTypeData;
          delete bufferData.docTypeData;
          coachMessage["media_data"] = bufferData;
          let compressedImage;
          if (type === "image") {
            compressedImage = await compressImageBuffer(bufferData.image, 5);
            coachMessage.compressedImage = compressedImage;
          }
        }

        let messageResponse = await messagesCollection.insertOne(coachMessage);
        lastId = messageResponse.insertedId;
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
        let reactionResponse = await messagesCollection.updateOne(
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
        lastId = reactionResponse.insertedId;
        console.log(lastId, "lastId");
      }
      response.status(201).json({
        msg: "Created Successfully",
        whatsappMessageId: responseData.messages[0].id,
        id: lastId,
      });
    } else {
      response.status(401).json({ msg: "Something Unexpected" });
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

app.post("/users", async (req, res) => {
  try {
    let { user_number } = req.body;
    console.log(user_number, "User number");
    const collection = await db.collection("patients");
    const messageCollection = await db.collection("messages");
    let data;

    if (user_number) {
      data = await collection.findOne(
        { patient_phone_number: user_number },
        { messages: 1 }
      );

      if (!data) {
        return res.status(404).json({ msg: "User not found", status: 404 });
      }

      const lastMessageId = data.message_ids[data.message_ids.length - 1];
      const lastMessage = await messageCollection.findOne(
        { id: lastMessageId },
        { projection: { media_data: 0 } }
      );

      data.lastMessage = lastMessage;
    } else {
      data = await collection.find({}, { messages: 1 }).toArray();

      for (let userData of data) {
        const lastMessageId =
          userData.message_ids?.[userData.message_ids.length - 1];
        if (lastMessageId) {
          const lastMessage = await messageCollection.findOne(
            { id: lastMessageId },
            { projection: { media_data: 0 } }
          );
          userData.lastMessage = lastMessage;
        }
      }

      data = data.filter((userData) => userData.lastMessage); // Remove users without a last message
      data.sort(
        (i1, i2) => i2.lastMessage.timestamp - i1.lastMessage.timestamp
      );
    }

    res.json({ data: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal Server Error", status: 500 });
  }
});

// app.post("/users", async (req, res) => {
//   try {
//     let { user_id } = req.body;
//     const collection = await db.collection("patients");
//     const messageCollection = await db.collection("messages");
//     let data;
//     if (user_id) {
//       user_id = ObjectId(user_id);
//       data = await collection.findOne({ _id: user_id }, { messages: 1 });
//       let lastMessageId = data.message_ids.at(-1);
//       let lastMessage = await messageCollection.findOne(
//         { id: lastMessageId },
//         { projection: { media_data: 0 } }
//       );
//       data.lastMessage = lastMessage;
//       console.log(data);
//     } else {
//       data = await collection.find({}, { messages: 1 });
//       data = await data.toArray();
//       for (let userData of data) {
//         let lastMessageId = userData.message_ids.at(-1);
//         let lastMessage = await messageCollection.findOne(
//           { id: lastMessageId },
//           { projection: { media_data: 0 } }
//         );
//         userData.lastMessage = lastMessage;
//       }
//       data = data.sort(
//         (i1, i2) => i2.lastMessage.timestamp - i1.lastMessage.timestamp
//       );
//     }

//     res.send({ data: data });
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({ msg: "Something Went Wrong", status: 400 });
//   }
// });

app.post("/messageData", async (req, res) => {
  try {
    const { message_id, user_id, is_last = true, messageLimit } = req.body;
    console.log(message_id, user_id);
    let data;
    const collection = await db.collection("messages");
    if (message_id) {
      if (is_last) {
        data = await collection.findOne(
          { id: message_id },
          { projection: { media_data: 0 } }
        );
      } else {
        data = await collection.findOne({ id: message_id });
      }
    } else {
      data = await collection.aggregate([
        { $match: { from: user_id } },
        { $sort: { _id: -1 } },
        { $skip: 20 * messageLimit },
        { $limit: 20 },
        { $project: { media_data: 0 } },
        { $sort: { _id: 1 } },
      ]);

      data = await data.toArray();
    }
    res.send({ data: data });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: "Something Went Wrong", status: 400 });
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
});

let baseUrl =
  "http://localhost:3005" || "https://node-ccoplnfjedo.onrender.com";
app.use("/recieve-media", express.static("public"));
app.post("/recieve-media", upload.single("file"), async (req, res) => {
  let { to, type } = req.body;
  let pData = {
    messaging_product: "whatsapp",
    to: to,
    type: type || req.file?.mimetype?.split("/")[0] || "",
    data: {
      path: `uploads/${req.file.filename}`,
    },
  };
  console.log(pData);
  fetch(`${baseUrl}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pData),
  })
    .then((response) => {
      if (response.status === 401) {
        throw new Error(response?.error || "Data couldn't upload");
      }
      return response.json();
    })
    .then((jsonData) => {
      console.log(jsonData, "JSOOOOOOOOOOS");
      res.send({ msg: "Added", data: jsonData });
    })
    .catch((error) => {
      console.log(error.message, "Error");
      res.send({ msg: error.message });
    });
});

let users = {};
io.on("connection", (socket) => {
  socket.join("", (name) => {});
  socket.on("join", (name) => {
    users[socket.id] = name;
  });

  socket.on("update message", (offlineMessage) => {
    console.log(offlineMessage, "offline message");
    socket.broadcast.emit("update message", offlineMessage);
  });

  socket.on("join room", (name, room) => {
    console.log("joined");
    socket.join(room);
    socket.broadcast.emit("joined", name, room);
  });
});

let messageArray = [
  "hiiiiiiiiii",
  "Hiiiiiiiiiiiii Sanju",
  "What are you doing",
  "Please complete your task",
];

async function sendMessage(time = 2) {
  let j = 0;
  let i = 0;
  let interval = setInterval(async () => {
    if (i === time) {
      clearInterval(interval);
    }
    console.log(messageArray[j]);

    let data = {
      messaging_product: "whatsapp",
      to: "916301156429",
      type: "text",
      data: {
        text: messageArray[j],
      },
    };
    let response = await fetch("http://localhost:3005/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    let responseData = await response.json();
    console.log(responseData);
    j++;
    if (j === 4) {
      j = 0;
    }
    i++;
  }, 500);
}

function fetchData() {
  sendMessage(30)
    .then((r) => console.log(r))
    .catch((err) => console.log(err));
}
