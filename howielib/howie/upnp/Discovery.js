'use strict';

let MSearcher = require('../upnp/MSearcher');

function Discovery() {}

Discovery.start = function(scanResultCallback) {

  this.searcher = new MSearcher();
  this.searcher.Scan(function(description) {

    if (typeof scanResultCallback === 'function') {
      scanResultCallback(description);
    }

  });

};

Discovery.stop = function() {
  if (this.searcher !== undefined) {
    this.searcher.StopScan();
  }
};

module.exports = Discovery;

