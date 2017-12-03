'use strict';

const fs = require('fs');

/* user modules */
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;

logger.setLevel('normal');
const camera = new Camera();

camera.ipConnect((responseCode) => {

  if (responseCode !== 'OK') {
    logger.red('connection problem: ' + responseCode);
    process.exit(0);
  }

  // ask the camera for a live view frame
  camera.getLiveViewFrame()
  .then((response) => {

    logger.green('got live view frame');

    // save the json sensor data
    let json = JSON.stringify(response, null, 4);
    fs.writeFileSync('json/liveview.json', json);
    logger.green('saved json data to json/liveview.json');

    // save the image
    let img = response.image;
    fs.writeFileSync('img/liveview.jpg', img);
    logger.green('saved image to img/liveview.jpg');

    process.exit(0);

  })
  .catch((error) => {

    logger.red('got error: ');
    logger.red(error);

  });

});

