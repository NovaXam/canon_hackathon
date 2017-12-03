var cam = require('./cam/MMCamera');
var logger = require('./util/logger');
var discovery = require('./upnp/Discovery');

module.exports = {
  MMCamera: cam,
  Logger: logger,
  Discovery: discovery
}
