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
const path = require("path");
require("dotenv").config();
const { compressImageBuffer } = require("./components/index.js");
const bcrypt = require("bcryptjs");
const { sign, verify } = require("jsonwebtoken");

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

let baseUrl = "https://node-ccoplnfjedo.onrender.com";

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  fetch(`${baseUrl}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then((r) => {
      if (r.ok) {
        console.log("Socket Verified");
        next();
      } else {
        socket.emit("on_auth_error", "Auth failed");
      }
      return r.json();
    })
    .then((jsonData) => console.log(jsonData))
    .catch((err) => socket.emit("on_auth_error", "Auth failed"));
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.io = io;
  next();
});

const PORT = process.env.PORT || 3007;
let db;

let initializeDBAndServer = async (req, res) => {
  try {
    const uploadsFolderPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsFolderPath)) {
      fs.mkdir(uploadsFolderPath, (err) => {
        if (err) {
          console.error("Error creating uploads folder:", err);
        } else {
          console.log("Uploads folder created successfully.");
        }
      });
    }
    const client = new MongoClient(
      "mongodb+srv://cionchat:Cionchat%401234@cluster0.xliikxl.mongodb.net/"
    );
    db = client.db("test");
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

initializeDBAndServer();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const userAuthentication = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    let token;
    if (authorization !== undefined) {
      token = authorization.split(" ")[1];
    }

    if (token === undefined) {
      res.status(400);
      res.send({ msg: "Missing Token" });
    } else {
      verify(token, process.env.TOKEN_SECRET_KEY, async (err, payload) => {
        if (err) {
          res.status(401).send({ msg: "Invalid Token" });
        } else {
          const collection = await db.collection("coaches");
          const isUserAuthenticated = await collection.findOne({
            email: payload.email,
          });
          if (isUserAuthenticated) {
            const isPasswordMatched = await bcrypt.compare(
              payload.password,
              isUserAuthenticated.password
            );
            if (isPasswordMatched) {
              req.email = payload.email;
              req.token = token;
              req.username = isUserAuthenticated.username;
              next();
            } else {
              res.status(400).json({ msg: "Not a valid tdoken" });
            }
          } else {
            res.status(404).json({ msg: "Token is not of valid user" });
          }
        }
      });
    }
  } catch (error) {
    console.log(`Error occured in Middleware: ${error}`);
    res.status(500).send({ msg: `Error occured in Middleware: ${error}` });
  }
};

const ourApps = ["carrier_page", "chat_app", "crm_page", "is_admin"];

// use to check permission of user
const permissionCheck = async (req, res, next, page = "carrier_page") => {
  try {
    let { email } = req;
    console.log(email);
    if (!email) {
      email = req.body.email;
      console.log(email);
    }

    const permissionCollection = await db.collection("permission");
    const permission = await permissionCollection.findOne({ email });
    if (permission) {
      if (permission[page]) {
        console.log(`You have permission for ${page}`);
        return next();
      } else {
        console.log(`You don't have permission for ${page}`);
        res.status(401).json({ msg: "Unauthorized" });
      }
    } else {
      console.log(`You don't have permission for ${page}`);
      res
        .status(401)
        .json({ msg: "You don't have permission to access this resource" });
    }
  } catch (error) {
    console.log("You don't have permission 3", error);
    res.status(400).json({ msg: "Unauthorized" });
  }
};

app.post("/coach/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (username === "")
      return res.status(401).json({ msg: "username is empty" });
    else if (email === "") return res.send(401).json({ msg: "email is empty" });
    else if (password === "")
      return res.send(401).json({ msg: "password is empty" });
    const collection = await db.collection("coaches");
    const isUserExists = await collection.findOne({ email });
    if (isUserExists) {
      res.status(401).json({ msg: "User with this email already exists" });
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await collection.insertOne({
        username,
        password: hashedPassword,
        email,
      });
      res.send({ msg: "Registered Successfully" });
      const permission = await db.collection("permission");
      await permission.insertOne({
        email,
        crm_page: false,
        chat_app: false,
        carrier_page: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.send({ msg: error.message });
  }
});

app.post("/coach/login", async (req, res) => {
  try {
    const { password, email } = req.body;
    if (email === "") return res.status(401).json({ msg: "email is empty" });
    else if (password === "")
      return res.status(401).json({ msg: "password is empty" });
    const collection = await db.collection("coaches");
    const isUserExists = await collection.findOne({ email });
    if (isUserExists) {
      const isPasswordMatched = await bcrypt.compare(
        password,
        isUserExists.password
      );
      if (isPasswordMatched) {
        let payload = { email, password };
        let token = sign(payload, process.env.TOKEN_SECRET_KEY);
        res.send({ msg: "Login Success", token });
      } else {
        res.status(400).send({
          msg: "Wrong password",
        });
      }
    } else {
      res.status(401).send({ msg: "Invalid user" });
    }
  } catch (error) {
    console.log(error);
    res.send({ msg: error.message });
  }
});

console.log(path.join(__dirname));

app.use(express.static(path.join(__dirname, "build")));

// app.get("/dashboard", (req, res) => {
//   res.send("Mess");
// });

app.get("/", (req, res) => {
  console.log(path.join(__dirname, "first"));
  res.sendFile(path.join(__dirname, "./build/index.html"));
});

app.get("/app", (req, res) => {
  console.log(path.join(__dirname, "first"));
  res.sendFile(path.join(__dirname, "./build/index.html"));
});

app.get("/app/*", (req, res) => {

  let param = req.params.param
  console.log(req.param[0])
  // console.log(path.join(__dirname, "second",param));
  res.sendFile(path.join(__dirname, "./build/",req.params[0]));
});

app.post("/verify", userAuthentication, async (req, res) => {
  res.status(201).json({ msg: "Verified" });
});

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
    console.log(contentType, "contentType");
    let item;
    if (contentType.startsWith("image")) {
      item = { image: response.data };
    } else if (contentType.startsWith("video")) {
      item = { video: response.data };
    } else if (contentType.startsWith("application")) {
      item = { document: response.data };
    } else if (contentType.startsWith("text/plain")) {
      item = { document: response.data };
    } else if (contentType.startsWith("audio")) {
      item = { audio: response.data };
    } else if (contentType.startsWith("sticker")) {
      item = { sticker: response.data };
    } else {
      item = { document: response.data };
    }
    item.docTypeData = ourData;
    return item;
  }
};

function deleteAllFiles(folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log("File deleted:", filePath);
        }
      });
    });
  });
}

app.post("/webhook", async function (req, res) {
  let patient_mobile_number;
  try {
    let patientsCollection = await db.collection("patients");
    let messagesCollection = await db.collection("messages");
    const { entry } = req.body;
    const { changes, id } = entry[0];
    const { value } = changes[0];
    patient_mobile_number = value.messages[0].from;

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
          stage: "Pre-OP",
          patient_phone_number_id: id,
        })
      );
      res.io.emit("update patient", {
        patientId: createdPatient.insertedId,
        userNumber: value.messages[0].from,
      });
      fetchData(patient_mobile_number);
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
        // res.io.emit("update user message", {
        //   messageId: createdMessageId.insertedId,
        //   userNumber: value.messages[0].from,
        //   whatsappMessageId: value.messages[0].reaction.message_id,
        // });
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
        }

        let createdMessageId = await messagesCollection.insertOne(
          createdMessage
        );

        res.io.emit("update user message", {
          messageId: createdMessageId.insertedId,
          userNumber: value.messages[0].from,
          whatsappMessageId: value.messages[0].id,
        });
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
        return res.status(200).json({ msg: "Media Added" });
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

app.use(userAuthentication);

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
      console.log(error.response);
    }
  }
}

app.post("/message", async function (request, response) {
  try {
    const { type, data, to } = await request.body;
    console.log(type);
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
    if (ourResponse.ok) {
      let coachMessage = addTimestamps({
        coach_phone_number: "+15556105902",
        from: to,
        coach_name: request.username,
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
    console.log(error);
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

app.post("/messageData", async (req, res) => {
  try {
    const { message_id, user_id, is_last = true, messageLimit } = req.body;
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

app.get(
  "/mediaData",

  async (req, res) => {
    try {
      const collection = await db.collection("media");
      let data = await collection.find({}, { media: 1 });
      data = await data.toArray();
      res.send({ data: data });
    } catch (error) {
      res.status(400).json({ msg: "Something went wrong", status: 400 });
    }
  }
);

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

app.use("/recieve-media", express.static("public"));
app.post(
  "/recieve-media",

  upload.single("file"),
  async (req, res) => {
    let { to, type } = req.body;
    let { token } = req;
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
        Authorization: `Bearer ${token}`,
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
        deleteAllFiles("./uploads");
        res.send({ msg: "Added", data: jsonData });
      })
      .catch((error) => {
        console.log(error.message, "Error");
        res.send({ msg: error.message });
      });
  }
);

let users = {};
io.on("connection", (socket) => {
  socket.join("", (name) => {});
  socket.on("join", (name) => {
    users[socket.id] = name;
  });

  socket.on("update message", (offlineMessage) => {
    socket.broadcast.emit("update message", offlineMessage);
  });

  socket.on("join room", (name, room) => {
    socket.join(room);
    socket.broadcast.emit("joined", name, room);
  });
});

let messageArray = [
  "Hiiii",
  "Thanks for reach out to us",
  "We will call you in next 1 hour",
];

async function sendMessage(num) {
  for await (let message of messageArray) {
    let data = {
      messaging_product: "whatsapp",
      to: num,
      type: "text",
      data: {
        text: message,
      },
    };
    try {
      let response = await fetch(`${baseUrl}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhd2FuQGdtYWlsLmNvbSIsInBhc3N3b3JkIjoicGF3YW4iLCJpYXQiOjE3MTYyNzExNTF9.EEroowdMS2M0a-2WF4OIiA7aqEKkeOG0AgbhfVsI-r4",
        },
        body: JSON.stringify(data),
      });
      let responseData = await response.json();
    } catch (error) {
      console.log(error);
    }
  }
}

function fetchData(num) {
  sendMessage(num)
    .then((r) => console.log(r))
    .catch((err) => console.log(err));
}

// fetchData(917895441429);

app.post("/get-user-note", async (req, res) => {
  try {
    const { note, patient_phone_number } = req.body;
    const collection = db.collection("patients");
    const result = await collection.updateOne(
      { patient_phone_number },
      { $set: { note } }
    );

    res.status(200).json({ message: "Note updated successfully" });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/get-coach-details", async (req, res) => {
  try {
    const { email, username } = req;
    const collection = await db.collection("coaches");
    // let coach = await collection.findOne(
    //   { email },
    //   {
    //     $project: {
    //       _id: 0, // Exclude _id field
    //       username: 1,
    //     },
    //   }
    // );
    // console.log(username)

    if (username) {
      res.json({ data: { coachName: username } });
    } else {
      res.status(404).json({ message: "Coach not found" });
    }
  } catch (error) {
    console.error("Error getting coach details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/update-patient", async (req, res) => {
  try {
    const { from, name, coach, stage, center, area } = req.body;
    const collection = await db.collection("patients");
    console.log(from, name, coach, stage, center, area);
    await collection.updateOne(
      {
        patient_phone_number: from,
      },
      {
        $set: {
          name,
          stage,
          center,
          area,
          coach,
        },
      }
    );
    console.log("updated");
    res.status(200).json({ msg: "Updated Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error " + error.message });
  }
});
