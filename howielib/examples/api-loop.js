'use strict';

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

const apiFunctions = [
  'close',
  'snap',
  'getLiveViewFrame',
  'getLastThumb',
  'getLastImage',
  'listFiles'
]

// connect
camera.ipConnect((responseCode) => {
  if (responseCode !== 'OK') {
    logger.red('connection problem: ' + responseCode);
    process.exit(0);
  }

  askForFunction(askForFunction);

});

function askForFunction(next) {

  logger.yellow('available camera functions: ');
  logger.dir(apiFunctions);
  logger.yellow('----------------------------------');

  rl.question('Which function do you want to use?\n', (answer) => {

    let fn = undefined;
    answer = answer.toLowerCase();

    for (let name of apiFunctions) {
      if (name.toLowerCase() === answer) {
        fn = name;
        break;
      }
    }

    if (fn) {

      logger.yellow('performing function: ' + fn);

      camera[fn]()
      .then((response) => {

        logger.green('got result:');
        logger.dir(response);
        if (typeof processResult[fn] === 'function') {
          processResult[fn](response, next);
        } else {
          next(next);
        }

      })
      .catch((error) => {

        logger.red('got error: ');
        logger.red(error);
        next(next);

      });


    } else {
      logger.yellow('unknown function (not found in list)');
    }

  });

}

let processResult = {
  close: (result, next) => {
    rl.close();
    process.exit(0);
  },
  snap: undefined,
  listFiles: undefined,
  getLastImage: (result, next) => {
    logger.dir(result);
    saveImage(result[0].image, next);
  },
  getLastThumb: (result, next) => {
    logger.dir(result);
    saveImage(result[0].image, next);
  },
  getLiveViewFrame: (result, next) => {
    logger.dir(result);
    saveImage(result.image, next);
  }

};

function saveImage(data, next) {
  rl.question('what do you want to save the image as?\n', (answer) => {
    if (!answer.endsWith('.jpg')) {
      answer = answer + '.jpg';
    }
    fs.writeFileSync(answer, data);
    next(next);
  });
}
