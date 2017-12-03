/*
generate-gif

generate an animated gif from a series of triggered photos 

- NOTE: Requires ImageMagick to be installed and available through the `convert` command on your terminal (download from [imagemagick.org](https://www.imagemagick.org/script/download.php))

*/

/* nodejs modules */
const fs = require('fs');

/* npm modules */
const P = require('bluebird');
let exec = require('child_process').exec;

/* user modules */
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;

/***
 ***  NOTE: ImageMagick is required to generate the gif
 ***/

const camera = new Camera();

/* command line options: 
 *
 * size=full, default: thumb
 * frames=N, default: 5
 * interval=MS, default: 500
 * debug=true, default:false
 */

let IMG_COUNT = 10;
let INTERVAL_MS = 500;
let FULL_SIZE = false;

const options = process.argv.slice(2).reduce((acc, arg) => {

    let [k, v = true] = arg.split('=');
    switch (k) {

      case 'frames':
        v = parseInt(v);
        if (typeof v === 'number' && v < 20 && v > 0) {
          IMG_COUNT = v;
        } 
        break;
      case 'interval':
        v = parseInt(v);
        if (typeof v === 'number' && v > 500) {
          INTERVAL_MS = v;
        }
        break;
    }

    acc[k] = v;
    return acc;

}, {})

if (options.debug === 'true') {
  logger.setLevel('debug');
}

if (options.size !== undefined && options.size === 'full') {
  FULL_SIZE = true;
}


let imgCounter = 0;
let imageFiles = [];


// connect to the camera using PTP-IP
camera.ipConnect((responseCode) => {
  if (responseCode === 'OK') {
    gifLoop();
  } else {
    logger.red('Problem connecting: ' + responseCode);
    process.exit(0);
  }

});


function gifLoop() {

  if (imgCounter < IMG_COUNT) {

    camera.snap()
    .then((response) => {

      logger.green('snapped img ' + imgCounter);
      imgCounter++;

      setTimeout(function() {
        gifLoop();
      }, INTERVAL_MS);

    })
    .catch((error) => {
      logger.red('snap error: ');
      logger.red(error);
    });

  } else {

    let objects;
		if (FULL_SIZE) {
			objects = camera.getLastImage(IMG_COUNT);
    } else {
			objects = camera.getLastThumb(IMG_COUNT);
    }

    objects.then((response) => {

      logger.green('got ' + response.length + ' thumbs');

      for (let i = 0; i < response.length; i++) {

        let filename = 'gif/gif-img-' + i + '.jpg';

        let obj = response[i].image;

        fs.writeFileSync(filename, obj, {encoding: 'binary'});

        logger.green('saved ' + filename);
        imageFiles[i] = filename;
      }

      // generate gif
      generateGif(imageFiles);

    })
    .catch((error) => {
      logger.red('getLastImage error');
      logger.red(error);
    });

  }

}

function generateGif(files) {

  logger.cyan('generating gif...');
  console.dir(options);

  let inputString = (() => {
    let str = '';
    for (let name of files) {
      str += (name + ' ');
    }
    return str;
  })();

  let convert = exec('convert -loop 0 -delay ' + (INTERVAL_MS/10) + ' ' + inputString + 'gif/img.gif');

  convert.stdout.on('data', data => {
    console.log( `convert: ${data}` );
  });

  convert.stderr.on('data', data => {
    console.log( `convert: ${data}` );
  });

  convert.on('close', code => {
    logger.cyan( 'convert exited with code ' + code );
    if (code === 0) {
      logger.green('done');
      exec('qlmanage -p gif/img.gif >& /dev/null');
    } else {
      logger.red('ImageMagick had a problem');
      logger.red('Ensure it is installed on your machine');
    }
		process.exit(0);
  });

}
