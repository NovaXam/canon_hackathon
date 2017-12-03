const config = require('./config');
const logger = require('./howielib/howie').Logger;
const fs = require('fs');


module.exports = (function () {
  function cameraManager(camera) {
    logger.setLevel('normal');
    this.camera = camera;
    this.socket;

  };

  // listen for all events from the camera
  cameraManager.prototype.listen = function (io) {
    this.io = io;

    this.camera.ipConnect(() => {
      this._connectSocketToServer();
    });
  };

  // handle the client (camera) socket connections.
  cameraManager.prototype._connectSocketToServer = function () {
    // socket for the camera.
    this.socket = require('socket.io-client')(config.SERVER_URL);

    // handle camera connect
    this.socket.on('connect', () => {
      console.log('camera connected to server.');
      // consider sending current camera status using a interval
    });

    // handle camera disconnect
    this.socket.on('disconnect', () => {
      console.log('camera has disconnected from the server.');
    });
  };

  cameraManager.prototype.snap = function (image_count) {
    // take a picture and return the a promise with the data.
    return Promise.all([
      this.camera.snap(),
      this.camera.getLastImage(image_count),
    ])
  };

  // return an array of images without.
  cameraManager.prototype.getImage = function (image_count) {
    // console.log(data[1][0].info);
    // console.log(data[1][0].image);
    return this.snap(image_count)
      .then(data => data[1][0].image)
      .catch(err => console.error(err));
  }

  // get the image with all of its info.
  cameraManager.prototype.getImageWithInfo = function (image_count) {
    // console.log(data[1][0].info);
    // console.log(data[1][0]);
    return this.snap(image_count)
      .then(data => data[1][0])
      .catch(err => console.error(err));
  }

  cameraManager.prototype.close = function () {
    this.camera.close();
  };

  return cameraManager;
})();



