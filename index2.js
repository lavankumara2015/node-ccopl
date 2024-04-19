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


object.entry?.changes

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
                id: "wamid.HBgMOTE4MDk2MjU1NzU5FQIAEhggMTBBNDk0MDhGRTU2NDFGRDc3RENENDQ0Njk0MUVGRDcA",
                timestamp: "1713500803",
                text: { body: "Lavankumar" },
                type: "text",
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};
