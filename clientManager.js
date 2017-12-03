const cloudinary = require('cloudinary');
const axios = require('axios');
const config = require('./config');
const fs = require('fs');

cloudinary.config({
  cloud_name: 'photo-upload-cloud',
  api_key: '373322164857891',
  api_secret: 'ww4_CBdcyVWdO1MrwJACzjTun2A'
});

module.exports = (function () {
  function clientManager(io) {
    this.io = io;
  };

  clientManager.prototype.uploadToLocal = function (image, callback) {
    const fileName = 'image.jpeg';

    const data = image.replace(/^data:image\/\w+;base64,/, "");
    const buf = new Buffer(data, 'base64');

    fs.writeFile(fileName, buf, function (err) {
      if (err) {
        console.log(err);
      }

      cloudinary.v2.uploader.upload(fileName, callback);
    });
  }

  clientManager.prototype.uploadImage = function (image, callback) {
    this.uploadToLocal(image, callback);
  }

  clientManager.prototype.sendData = function (data) {
    this.io.emit('cameraSnap', data);
  }

  clientManager.prototype.sendToCloud = function (url, res) {
    const params = {};

    return axios({
      method: 'GET',
      header: {
        "Ocp-Apim - Subscription - Key": "a48fab4bcaf247f7b039a816609a2ae2",
      },
      url: 'https://eastus2.api.cognitive.microsoft.com/face/v1.0/facelists/shurouq',
      query: params,
      body: {
        url: url,
      },
    });
  }

  clientManager.prototype.sendImage = function (buff) {
    console.log(buff);
    // send the image buffer to the client in a format the browser can understand.
    this.io.emit('cameraSnap', { image: true, buffer: buff.toString('base64') });
  };

  return clientManager;
})();



