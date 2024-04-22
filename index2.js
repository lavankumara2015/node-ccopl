const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/webhook", async (req, res) => {
  try {
    const fetch = await import("node-fetch");
    const response = await fetch.default(
      "https://node-ccoplnfjedo.onrender.com/webhook"
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});

object.entry?.changes;

let a = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "293442527182997",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "15556105902",
              phone_number_id: "232950459911097",
            },
            contacts: [
              { profile: { name: "Lavan Adicherla" }, wa_id: "918096255759" },
            ],
            messages: [
              {
                from: "918096255759",
                id: "wamid.HBgMOTE4MDk2MjU1NzU5FQIAEhggMTZDMzNCNTVFRDA4NDA5Njg4Q0JDMEY2REI3RTIzREYA",
                timestamp: "1713500803",
                type: "reaction",
                reaction: {
                  emoji: "💖",
                  messsage_id: "<WAMID>",
                },
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};

let b = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "8856996819413533",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "<PHONE_NUMBER>",
              phone_number_id: "27681414235104944",
            },
            contacts: [
              {
                profile: {
                  name: "<CONTACT_NAME>",
                },
                wa_id: "<WA_ID>",
              },
            ],
            messages: [
              {
                from: "sender_wa_id",
                id: "message_id",
                timestamp: "message_timestamp",
                type: "reaction",
                reaction: {
                  emoji: "<emoji>",
                  messsage_id: "<WAMID>",
                },
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};

try {
  console.log(request.body);
  const { entry } = request.body;
  const { changes } = entry[0];
  const { value } = changes[0];
  if (value.statuses) {
    let {} = value?.statuses[0];
  }
  console.log(value);
  const collection = await db.collection("our_messages");
  if (value.messages[0]?.type === "reaction") {
    const messageId = value.messages[0].reaction.message_id;
    await collection.findOneAndUpdate(
      { "messages.id": messageId },
      {
        $set: {
          reaction: [
            {
              emoji: value.messages[0].reaction.emoji,
              userNumber: value.metadata.display_phone_number,
            },
          ],
        },
      }
    );
    return response
      .status(202)
      .json({ msg: "Updated successfully", status: 202 });
  }

  await collection.insertOne({ ...value, status: "" });
  response.status(201).json({ msg: "Created Successfully" });
} catch (error) {
  response
    .status(400)
    .json({ msg: "Something Went Wrong", error: error.message });
}


let a = await findOne({
  from: senderMobileNumber,
  "messages.id": value.messages[0].reaction.message_id,
  "messages.reaction.user": value.messages[0].from,
});
await collection.findOneAndUpdate(
  {
    from: senderMobileNumber,
    "messages.id": value.messages[0].reaction.message_id,
    "messages.reaction.user": value.messages[0].from,
  },
  {
    $set: {
      "messages.$[elem].reaction": {
        $ifNull: ["$messages.$[elem].reaction", []],
      },
      "messages.$[elem2].reaction.$[elem3].emoji":
        value.messages[0].reaction.emoji,
    },
  },
  {
    arrayFilters: [
      {
        "elem.user": value.messages[0].from,
        "elem.id": value.messages[0].reaction.message_id,
      },
      {
        "elem2.user": value.messages[0].from,
      },
      {
        "elem3.user": value.messages[0].from,
        "elem3.id": value.messages[0].reaction.message_id,
      },
    ],
    returnOriginal: false, // Optionally, to return the updated document
    upsert: true, // Create the `messages.reaction` array if it doesn't exist
  }
);
console.log(a, "aaaa");
if (a) return res.send({ msg: "Reaction Updated" });
let isReactionExists = await collection.findOneAndUpdate(
  {
    from: senderMobileNumber,
    "messages.id": value.messages[0].reaction.message_id,
    "messages.reaction.user": value.messages[0].from,
  },
  {
    $push: {
      "messages.$.reaction": {
        emoji: value.messages[0].reaction.emoji,
        user: value.messages[0].from,
      },
    },
  }
);
if (isReactionExists) return res.send({ msg: "Reaction Updated" });
await collection.findOneAndUpdate(
  {
    from: senderMobileNumber,
    "messages.id": value.messages[0].reaction.message_id,
  },
  {
    $push: {
      "messages.$.reaction": {
        emoji: value.messages[0].reaction.emoji,
        user: value.messages[0].from,
      },
    },
  }
);
res.send({ msg: "Reaction sent" });