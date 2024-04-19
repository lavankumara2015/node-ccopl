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
