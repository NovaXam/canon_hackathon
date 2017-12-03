'use strict';

/* user modules */
const Camera = require('howielib').MMCamera;
const logger = require('howielib').Logger;


logger.setLevel('normal');
const camera = new Camera();

let STREAM_SECONDS = 20;
let frameCounter = 0;

function onFrame(frame) {

  frameCounter++;

  logger.cyan('x: ' + frame.accel.x);
  logger.cyan('y: ' + frame.accel.y);
  logger.cyan('z: ' + frame.accel.z);
  logger.cyan('yaw:   ' + frame.gyro.yaw);
  logger.cyan('pitch: ' + frame.gyro.pitch);
  logger.cyan('roll:  ' + frame.gyro.roll);
  logger.cyan('tilt:  ' + frame.angle.tilt);
  logger.cyan('horiz: ' + frame.angle.horizontal);
  logger.yellow('-------------------');

  /* uncomment to see all available frame properties: */
  //console.dir(JSON.stringify(frame));
}


// connect to the camera 
camera.ipConnect((responseCode) => {

  if (responseCode !== 'OK') {
    logger.red('connection problem: ' + responseCode);
    process.exit(0);
  }

  // schedule to stop the stream after STREAM_SECONDS
  setTimeout(() => {
    camera.stopStream();

    logger.green('finished stream');
    logger.green('average frame rate was approximately ' + (frameCounter / STREAM_SECONDS) + ' fps');
    process.exit(0);

  }, STREAM_SECONDS * 1000);

  // start the stream
  logger.green('starting stream');
  camera.startStream(onFrame);

});


