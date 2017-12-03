'use strict';

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const PTPDefine = require('../ptp/PTPDefine');

/*------------------------------------------------------------------
 * Exports 
 *-----------------------------------------------------------------*/
module.exports = {

  Stringify: (value, options) => {
    return getValueString(value, options);
  }

};

/*------------------------------------------------------------------
 * Private functions
 *-----------------------------------------------------------------*/
/*
 * Map the hex code for a field in the response to its string value
 */
function getValueString(value, options) {

  for (let key in options) {

    // See if it is the target
    if (value === options[key]) {
      logger.debug.green('\t{' + key + ': ' + options[key] + '}\n');

      return key;
    } else {
      //logger.debug.cyan('\t{' + key + ': ' + options[key] + '}');
    }
  }

  logger.debug.red('no match - value was ' + value);
  return 'Unknown (' + value + ')';
}
