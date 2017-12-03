'use strict';

/* npm modules */
const parseString = require('xml2js').parseString;

/* user modules */
const logger = require('../util/logger');

function XmlParser() {}

XmlParser.prototype.parse = function(xml, callback) {
  parseString(xml, function(err, result) {
    if (err) {
      logger.debug.red('XmlParser.parse: ' + err);
      callback(null);
      return;
    } 
    callback(result);
    return;
  });
};

module.exports = XmlParser;

