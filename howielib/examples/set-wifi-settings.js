/* user modules */
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;

logger.setLevel('normal');
const camera = new Camera();

let essid = process.argv[2];
let passphrase = process.argv[3];

if (essid === undefined || passphrase === undefined) {
  logger.red('plase specify an essid and passphrase as args, e.g.:');
  logger.cyan('\tnode set-wifi-settings <YourNetworkName> <YourNetworkPassword>');
  process.exit(0);
}

// connect to the camera 
camera.ipConnect((responseCode) => {

  if (responseCode !== 'OK') {
    logger.red('connection problem: ' + responseCode);
    process.exit(0);
  }

  // set the wireless settings for the next PTP-IP session
  camera.setWirelessSettings(essid, passphrase)
  .then((response) => {

    logger.green('got response');
    logger.dir(response);
    return camera.close();

  })
  .then((response) => {
    logger.green('session closed');
    logger.dir(response);
    process.exit(0);

  })
  .catch((error) => {

    logger.red('got error: ');
    logger.red(error);

  });

});

