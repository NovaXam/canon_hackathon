'use strict';

const Discovery = require('howielib').Discovery;

let discovered = {};
let scanTime = 10000;

// Accept a scan time arg in milliseconds
(function parseScanTime() {
  if (process.argv[2] !== undefined) {
    let t = parseInt(process.argv[2]);
    if (!isNaN(t)) {
      scanTime = t;
    }
  }
  console.log('scanning for ' + scanTime + ' ms...');
}());


// Start the discovery scan
Discovery.start(function(result) {

  // print new results of the scan
  if (discovered[result.uuid] === undefined) {
    discovered[result.uuid] = result;
    console.dir(result);
  }

});

// Stop the scan after the scan time expires
setTimeout(function stopDiscovery() {

  console.log('done scanning.');
  Discovery.stop();

}, scanTime);

