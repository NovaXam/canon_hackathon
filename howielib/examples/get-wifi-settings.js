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

  camera.getWirelessSettings()
  .then((response) => {

    logger.green('got wifi settings');
    logger.dir(response);

    process.exit(0);

  })
  .catch((error) => {

    logger.red('got error: ');
    logger.red(error);

  });

});

