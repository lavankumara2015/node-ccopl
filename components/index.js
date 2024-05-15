const Jimp = require("jimp");
const fs = require("fs");
const axios = require("axios");

async function compressImageBuffer(
  imageBuffer,
  quality = 5,
  outputFormat = Jimp.MIME_JPEG
) {
  try {
    const image = await Jimp.read(imageBuffer);
    const compressedImageBuffer = await image
      .quality(quality)
      .getBufferAsync(outputFormat);
    return compressedImageBuffer;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
}

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

const addTimestamps = (document) => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  document.timestamp = nowInSeconds.toString();
  return document;
};

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

module.exports = {
  compressImageBuffer,
  MediaFunction,
  addTimestamps,
  getMessageObject,
};
