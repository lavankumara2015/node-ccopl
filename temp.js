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

let a = {
  messaging_product: "whatsapp",
  contacts: [{ input: "918096255759", wa_id: "918096255759" }],
  messages: [
    {
      id: "wamid.HBgMOTE4MDk2MjU1NzU5FQIAERgSMUUwNDIwOEIwREE3QThCNjAwAA==",
    },
  ],
};

app.post("/applicantSetNewPassword", userAuthentication, async (req, res) => {
  try {
    const { email_id } = req;
    const { new_password } = req.body;
    const hashedPassword = await hash(password, 10);

    let table_name = "";

    const query = `UPDATE ${table_name} SET password = "${hashedPassword} WHERE email_id = "${email_id}"`;

    res.send({
      msg: "Updated Successfully",
    });
  } catch (error) {
    console.log(error + "applicantSetNewPassword");
  }
});


let error = {     
  [Symbol(realm)]: null,
  [Symbol(state)]: {
    aborted: false,
    rangeRequested: false,
    timingAllowPassed: true,
    requestIncludesCredentials: true,      
    type: 'default',
    status: 401,
    timingInfo: {
      startTime: 22531.673399984837,       
      redirectStartTime: 0,
      redirectEndTime: 0,
      postRedirectStartTime: 22531.673399984837,
      finalServiceWorkerStartTime: 0,      
      finalNetworkResponseStartTime: 0,    
      finalNetworkRequestStartTime: 0,     
      endTime: 0,
      encodedBodySize: 30,
      decodedBodySize: 30,
      finalConnectionTimingInfo: null      
    },
    cacheState: '',
    statusText: 'Unauthorized',
    headersList: HeadersList {
      cookies: null,
      [Symbol(headers map)]: [Map],        
      [Symbol(headers map sorted)]: null   
    },
    urlList: [ URL {} ],
    body: { stream: undefined }
  },
  [Symbol(headers)]: HeadersList {
    cookies: null,
    [Symbol(headers map)]: Map(8) {        
      'x-powered-by' => [Object],
      'access-control-allow-origin' => [Object],
      'content-type' => [Object],
      'content-length' => [Object],        
      'etag' => [Object],
      'date' => [Object],
      'connection' => [Object],
      'keep-alive' => [Object]
    },
    [Symbol("headers map sorted)"]: null     
  }
}