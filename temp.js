let reaction = {
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
              {
                profile: {
                  name: "Lavan Adicherla",
                },
                wa_id: "918096255759",
              },
            ],
            messages: [
              {
                from: "918096255759",
                id: "wamid.HBgMOTE4MDk2MjU1NzU5FQIAEhggNzJFRjg4RTFBRkIwNzZDRjk1OEQ3QTBDMjQ2MzNDN0YA",
                timestamp: "1713500803",
                type: "reaction",
                reaction: {
                  emoji: "😡",
                  messsage_id: "wamid.ABGGFlCGg0cvAgo-sJQh43L5Pe4W",
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
let text = {
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
              {
                profile: {
                  name: "Lavan Adicherla",
                },
                wa_id: "918096255759",
              },
            ],
            messages: [
              {
                from: "918096255759",
                id: "wamid.HBgMOTE4MDk2MjU1NzU5FQIAEhggNzJFRjg4RTFBRkIwNzZDRjk1OEQ3QTBDMjQ2MzNDN0YA",
                timestamp: "1713500803",
                type: "text",
                text: {
                  body: "hello jaanu",
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

adb.patients.updateOne(
  {
    "messages.id": 203410447948670,
  },
  [
    {
      $set: {
        "messages.$[msg].reactions": {
          $cond: {
            if: {
              $eq: [
                {
                  $size: {
                    $filter: {
                      input: "$messages.$[msg].reactions",
                      cond: {
                        $eq: ["this.user", "918096255759"],
                      },
                    },
                  },
                },
                0,
              ],
            },
            then: {
              $concatArrays: [
                "$messages.$[msg].reactions",
                [{ emoji: "🥵", user: "918096255759" }],
              ],
            },
            else: {
              $map: {
                input: "$messages.$[msg].reactions",
                as: "reaction",
                in: {
                  $cond: {
                    if: {
                      $eq: ["$$reaction.user", "918096255759"],
                    },
                    then: {
                      emoji: "😐",
                      user: "918096255759",
                    },
                    else: "$$reaction",
                  },
                },
              },
            },
          },
        },
      },
    },
  ],
  {
    arrayFilters: [
      {
        "msg.message_id": "203410447948670",
      },
    ],
    upsert: false,
  }
);

let c = {
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
            statuses: [
              {
                id: "wamid.HBgMOTE3ODk1NDQxNDI5FQIAERgSMjNFRERFQkU0QzlBMUU3NkIyAA==",
                status: "read",
                timestamp: "1713847878",
                recipient_id: "917895441429",
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};
