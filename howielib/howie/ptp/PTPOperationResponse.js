'use strict';

const fs = require('fs');
/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const PTPParser = require('../ptp/PTPParseHelper');
const PTPDefine = require('../ptp/PTPDefine');

/*------------------------------------------------------------------
 * Private class data
 *-----------------------------------------------------------------*/
const RESPONSE_TIMEOUT_MS = 100000; 
let transactionPool = {};

/*------------------------------------------------------------------
 * Public class functions
 *-----------------------------------------------------------------*/
PTPOperationResponse.newRequest = function(request, callback) {
  let transID = request.getTransactionID();
  let opCode = request.getOpCode();
  let response = new PTPOperationResponse(transID, opCode, callback);
  transactionPool[transID] = response;
};

PTPOperationResponse.newPacket = function(packet, packetType) {

  //logger.debug.green('PTPOperationResponse.newPacket()');
  //logger.debug.green(packetType);

  if (PTPParser[packetType] === undefined) {
    logger.debug.red('WARNING: received unknown packet type: ' + packetType);
    return;
  }

  let transID = PTPParser[packetType].transactionID(packet);

  let response = transactionPool[transID];

  if (response === undefined) {
    logger.debug.red('WARNING: transaction ID not found in transaction pool');
    return;
  } else if (response[packetType] !== undefined) {
    // give the packet to the correct response object
    response[packetType](packet);
  } else {
    logger.debug.red('WARNING: response object received invalid packet type: ' + packetType);
  }
};

PTPOperationResponse._removeFromTransactionPool = function(transID) {
  let response = transactionPool[transID];
  if (response !== undefined) {
    delete transactionPool[transID];
  }
};

/*------------------------------------------------------------------
 * Public prototype
 *-----------------------------------------------------------------*/

/*
 *  transactionID - <number>
 */
function PTPOperationResponse(transactionID, opCode, callback) {

  this._transactionID = transactionID;
  this._opCode = opCode;
  this._callback = callback;
  this._params = [];

  // set the response timeout
  this._timeout = setTimeout(() => {
    logger.debug.red('WARNING: transaction #' + this._transactionID + ' timed out waiting for a response');
    this._code = 'TIMEOUT';
    this._runCallback();
  }, RESPONSE_TIMEOUT_MS);
}

/* 
 * Pass in a Buffer of the StartDataPacket
 *  packet - <Buffer>
 */
PTPOperationResponse.prototype.StartDataPacket = function(packet) {

  //logger.debug.yellow('PTPOperationResponse.StartDataPacket()');
  
  // store the payload size
  let totalDataLength = PTPParser.StartDataPacket.totalDataLength(packet);

  //logger.debug.yellow('Data Length: ' + totalDataLength);
  this._payloadSize = totalDataLength;

  this._payload = Buffer.alloc(this._payloadSize);
  this._payloadIndex = 0;

  if (typeof totalDataLength === 'string') {
    logger.debug.red('ERROR: Data payload size is greater than 32 bits. Data parsing for this has not yet been implemented!');
  }
};

PTPOperationResponse.prototype.DataPacket = function(packet) {

  //logger.debug.yellow('PTPOperationResponse.DataPacket()');
  // store the payload buffer


  let partialData = PTPParser.DataPacket.dataPayload(packet);
  this._payloadIndex += partialData.copy(this._payload, this._payloadIndex);

};

PTPOperationResponse.prototype.EndDataPacket = function(packet) {

  //logger.debug.yellow('PTPOperationResponse.EndDataPacket()');

  let packetSize = PTPParser.length(packet);

  let optionalPayloadSize = packetSize - 12;
  //logger.debug.yellow('optional payload size: ' + optionalPayloadSize);
  if (optionalPayloadSize > 0) {
    let optionalPayload = PTPParser.EndDataPacket.dataPayload(packet, optionalPayloadSize);

    this._payloadIndex += optionalPayload.copy(this._payload, this._payloadIndex);
  }
};

PTPOperationResponse.prototype.OperationResponse = function(packet) {

  //logger.debug.yellow('PTPOperationResponse.OperationResponse()');

  this._code = PTPParser.OperationResponse.responseCode(packet);

  let param;
  for (let i = 0; i < 5; i++) {
    param = PTPParser.OperationResponse.param(packet, i);
    if (param === undefined) {
      break;
    }
    this._params.push(param);
  }

  this._runCallback();
};

/*
 * Run the response callback, passing the return obj:
 * {
 *   response - <Buffer>
 *   data - <Buffer> or undefined
 * }
 */
PTPOperationResponse.prototype._runCallback = function() {

  if (this._callback !== undefined &&
      this.callback !== null &&
      typeof this._callback === 'function') {

    this._callback({
      opCode: this._opCode,
      code: this._code,
      params: this._params,
      data: this._payload,
    });
  }
  this._removeSelf();
};

PTPOperationResponse.prototype._removeSelf = function() {
  clearTimeout(this._timeout);
  PTPOperationResponse._removeFromTransactionPool(this._transactionID);
};

/*------------------------------------------------------------------
 * Exports 
 *-----------------------------------------------------------------*/
module.exports = PTPOperationResponse;
