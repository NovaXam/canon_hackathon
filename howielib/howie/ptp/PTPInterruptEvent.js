'use strict';

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const PTPParser = require('../ptp/PTPParseHelper');
const PTPDefine = require('../ptp/PTPDefine');


/*------------------------------------------------------------------
 * Public class functions
 *-----------------------------------------------------------------*/

function PTPInterruptEvent() {}

PTPInterruptEvent.newPacket = function(packet, eventCallback) {

  let transID = PTPParser.InterruptEvent.transactionID(packet);
  let eventCode = PTPParser.InterruptEvent.eventCode(packet);

  let param;
  let params = [];
  for (let i = 0; i < 5; i++) {
    param = PTPParser.InterruptEvent.param(packet, i);
    if (param === undefined) {
      break;
    }
    params.push(param);
  }

  if (eventCode !== undefined && typeof eventCallback === 'function') {
    eventCallback({
      transactionID: transID,
      eventCode: eventCode,
      params: params
    });
  }
};

/*------------------------------------------------------------------
 * Exports 
 *-----------------------------------------------------------------*/
module.exports = PTPInterruptEvent;
