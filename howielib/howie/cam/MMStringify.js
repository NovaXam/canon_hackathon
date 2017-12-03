'use strict';

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const MMCodes = require('../cam/MMCodes');
const OpCodes = MMCodes.Operations;
const ResponseCodes = MMCodes.Responses;
const EventKinds = MMCodes.EventKinds;
const ResponseParams = require('../cam/MMResponseParams');
const DataSets = require('../cam/MMDataSets');
const BufferParser = require('../ptp/BufferParser');

/*------------------------------------------------------------------
 * Exports 
 *-----------------------------------------------------------------*/
module.exports = {

  Stringify: (inObj) => {

    let outObj = {};

    outObj.operation = getValueString(inObj.opCode, OpCodes);
    outObj.code = getValueString(inObj.code, ResponseCodes); 

    // parse params
    for (let i = 0; i < inObj.params.length; i++) {
      let paramDef = ResponseParams[outObj.operation][i];
      outObj[paramDef.name] = getValueString(inObj.params[i], paramDef.values);
    }

    // parse data
    if (inObj.data !== undefined) {
      outObj.data = DataSets.parseData(outObj.operation, inObj.data);
    }

    return outObj;

  },

  StringifyOpCode: (opCode) => {
    return getValueString(opCode, OpCodes);
  },

  StringifyEventData: (inObj) => {

    let outObj = {};
    outObj.code = getValueString(inObj.code, ResponseCodes);
    let kind = inObj.data.readUInt32LE(4);
    outObj.eventKind = getValueString(kind, EventKinds);

    outObj.data = DataSets.parseData(outObj.eventKind, inObj.data);

    if (outObj.data !== undefined) {
      if (outObj.data.payload.EventKind === EventKinds.NotifyDevicePropValue) {
        let propName = outObj.data.payload.PropertyCode;
        let valueBuf = outObj.data.payload.PropertyValue;

        outObj.data.payload.PropertyValue = DataSets.parseProperty(propName, valueBuf);
      }
    }

    return outObj;

  },

};

/*------------------------------------------------------------------
 * Private functions
 *-----------------------------------------------------------------*/
/*
 * Map the hex code for a field in the response to its string value
 * TODO: improve the lookups with better data structures
 */
function getValueString(value, options) {

  if (options === undefined) {
    return value;
  }

  for (let key in options) {

    // See if it is the target
    if (value === options[key]) {
      //logger.debug.green('\t{' + key + ': ' + options[key] + '}');
      return key;
    } else {
      //logger.debug.cyan('\t{' + key + ': ' + options[key] + '}');
    }
  }
  logger.debug.red('no match - value was ' + value);
  return 'Unknown (' + value + ')';
}
