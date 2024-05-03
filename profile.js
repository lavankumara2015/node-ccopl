const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// let data = {
//   messaging_product: "whatsapp",
//   file: fs.createReadStream('pictures/img1.jpg')
// };

// let data = new FormData();
// data.append("messaging_product", "whatsapp");
// data.append("file", fs.createReadStream("pictures/img1.jpg"));

// let mediaData = {
//   method: "post",
//   maxBodyLength: Infinity,
//   url: "https://graph.facebook.com/v19.0/232950459911097/media",
//   headers: {
//     Authorization: `Bearer EABqxsZAVtAi8BO5NGN3eqiJVzY3iv5Ywjkt82T6KMfQhZB1yMHfGsQy8XX45UghCu8rHCYb5YxlZCvoYMA7AgHYZCF1ZAzxhIT0ocI9i2m8SZB5MmW1sRj0yiMoIYl6WdCLd2iaGYzS5LMegZAOtEByCFToSEZCbmTZCWvhQjcFXvCXklY1CIdETRZB0QkxIEwXb6rDZBuQBDTO4yp5ftOURpJI`,
//     "Content-Type": "image/jpeg",
//     ...data.getHeaders(),
//   },
//   data: data,
// };

// axios
//   .request(mediaData)
//   .then((response) => {
//     const mediaId = response.data.id;
//     console.log(mediaId);
//   })
//   .catch((error) => {
//     console.log(error);
//   });

// let getMedia = {
//   method: 'get',
//   maxBodyLength: Infinity,
//   url: 'https://graph.facebook.com/v19.0/3624855854429820',
//   headers: {
//     Authorization: 'Bearer EABqxsZAVtAi8BO5NGN3eqiJVzY3iv5Ywjkt82T6KMfQhZB1yMHfGsQy8XX45UghCu8rHCYb5YxlZCvoYMA7AgHYZCF1ZAzxhIT0ocI9i2m8SZB5MmW1sRj0yiMoIYl6WdCLd2iaGYzS5LMegZAOtEByCFToSEZCbmTZCWvhQjcFXvCXklY1CIdETRZB0QkxIEwXb6rDZBuQBDTO4yp5ftOURpJI',
//   }
// };

let data = new FormData();
data.append("messaging_product", "whatsapp");
data.append("file", fs.createReadStream("pictures/img1.jpg"));

fetch("https://graph.facebook.com/v19.0/232950459911097/media", {
  method: "POST",
  headers: {
    Authorization: `Bearer EABqxsZAVtAi8BO5NGN3eqiJVzY3iv5Ywjkt82T6KMfQhZB1yMHfGsQy8XX45UghCu8rHCYb5YxlZCvoYMA7AgHYZCF1ZAzxhIT0ocI9i2m8SZB5MmW1sRj0yiMoIYl6WdCLd2iaGYzS5LMegZAOtEByCFToSEZCbmTZCWvhQjcFXvCXklY1CIdETRZB0QkxIEwXb6rDZBuQBDTO4yp5ftOURpJI`,
    ...data.getHeaders(),
  },
  body: data,
})
  .then((response) => {
    return response.json();
  })
  .then((jsonData) => {
    console.log(jsonData);
  })
  .catch((error) => {
    console.log(error);
  });


// axios.request(getMedia)
// .then((response) => {
//   console.log(JSON.stringify(response.data)+"download Media");
// })
// .catch((error) => {
//   console.log(error);
// });
