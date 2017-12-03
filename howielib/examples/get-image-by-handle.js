/* nodejs modules */
const readline = require('readline');
const fs = require('fs');

/* howielib */
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

logger.setLevel('normal');
const camera = new Camera();

// connect 
camera.ipConnect((responseCode) => {

  if (responseCode !== 'OK') {
    logger.red('connection problem: ' + responseCode);
    process.exit(0);
  }

  // ask the camera for a list of files
  camera.listFiles()
  .then((response) => {

    logger.green('here is all files');
    logger.log(response);
    logger.yellow('--------------');
    rl.question('which file handle do you want to retrieve?\n', (answer) => {

      answer = parseInt(answer);
      if (isNaN(answer)) {
        logger.yellow('handle not valid');
        logger.yellow('exiting.');
        process.exit(0);
      }
      if (response.indexOf(answer) === -1) {
        logger.yellow('handle not found');
        logger.yellow('exiting.');
        process.exit(0);
      }
      // request the image
      camera.getImageByHandle(answer)
      .then((response) => {
        // save the image
        fs.writeFileSync('img/get-image-by-handle.jpg', response.image);
        logger.green('file saved to img/get-image-by-handle.jpg');
        process.exit(0);
      })
      .catch((error) => {
        logger.red('got error: ');
        logger.red(error);
        process.exit(0);
      });

    });

  })
  .catch((error) => {

    logger.red('got error: ');
    logger.red(error);

  });

});

