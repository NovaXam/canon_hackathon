/* nodejs modules */
const fs = require('fs');

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

  // ask the camera for the last thumbnail
  camera.getLastThumb()
  .then((response) => {

    // get the first and only item in the response array
    let lastItem = response[0];
    logger.green('got thumb');

    // print the information about the thumb
    logger.dir(lastItem.info);

    // save the thumb
    let filename = 'img/last-thumb.jpg';
    fs.writeFileSync(filename, lastItem.image, {encoding: 'binary'});
    logger.green('saved thumb to ' + filename);

    process.exit(0);

  })
  .catch((error) => {

    logger.red('got error: ');
    logger.red(error);

  });

});

