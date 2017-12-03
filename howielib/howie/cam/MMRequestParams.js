'use strict';

module.exports = Object.freeze({
  /* Operation Request Parameters Codes */
  shutterButtonAction: {
    pressShutterButton: 0x03,
    releaseShutterButton: 0x03
  },
  shutterButtonAFStatus: {
    shootingWithAF: 0x00, // NOT AVAILABLE ON MM100-WS!
    shootingWithoutAF: 0x01
  },
  remoteShootingMode: {
    stopRemoteShooting: 0x00,
    startRemoteShooting: 0x01,
  }
});
