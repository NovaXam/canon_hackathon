/* user modules */
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;

logger.setLevel('normal');
const camera = new Camera();

// connect to the camera using PTP-IP
camera.ipConnect((responseCode) => {

  if (responseCode !== 'OK') {
    logger.red('connection problem: ' + responseCode);
    process.exit(0);
  }

  // ask the camera to take a photo
  camera.snap()
  .then((response) => {

    logger.green('got valid snap response: ');
    console.dir(response);

    // ask the camera to list the files on the device
    return camera.listFiles();

  })
  .then((response) => {

    logger.green('got file list');
    console.dir(response);
    process.exit(0);

  })
  .catch((error) => {

    logger.red('got error: ');
    logger.red(error);

  });

});


