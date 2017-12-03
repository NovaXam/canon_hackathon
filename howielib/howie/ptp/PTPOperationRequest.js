'use strict'; 

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const BufferBuilder = require('../ptp/BufferBuilder');
const PTPDefine = require('../ptp/PTPDefine');

/*------------------------------------------------------------------
 * Private class data
 *-----------------------------------------------------------------*/
let classData = {
  transactionID: 0
};

/*------------------------------------------------------------------
 * Private class functions 
 *-----------------------------------------------------------------*/

/* return a new ID for an upcoming transaction */
function getNextTransactionID() {
  if (classData.transactionID > 4294967294) {
    classData.transactionID = 0;
  }
  let id = classData.transactionID;
  classData.transactionID++;
  return id;
}

/*------------------------------------------------------------------
 * Public prototype
 *-----------------------------------------------------------------*/

/* Create a new PTPOperationRequest
 *
 *  code - <number> operation opcode (standard PTP or extension)
 *  params - <Array> of up to 5 <number>/<Buffer<UINT32>> parameters or empty <Array> for none
 *  dataBufToSend - <Buffer> of data or undefined
 *
 * --------------------------------------------------
 * e.g., no params, no outgoing data
 * --------------------------------------------------
 * new PTPOperationRequest(0x1001, [], undefined);
 * --------------------------------------------------
 *
 * e.g., two params, with outgoing data packet
 * --------------------------------------------------
 * let packet = new PTPOperationRequest(0x1001, [0x01, 0x05], Buffer.from([0x03, 0x44]);
 * --------------------------------------------------
 */
function PTPOperationRequest(code, params, dataBufToSend) {

// Packet format is:
// 1. [32] Length
// 2. [32] PacketType
// 3. [32] DataDirection
// 4. [16] OperationCode
// 5. [32] TransactionID
// 6. [32] Parameters

  let paramCount = 0;
  if (params !== undefined && params.constructor === Array) {
    paramCount = params.length;
  }

  this._transactionID = getNextTransactionID();
  this._dataBuffer = dataBufToSend;
  this._opCode = code;

  logger.debug.blue('opcode:' + code);
  logger.debug.blue('paramCount: ' + paramCount);
  logger.debug.blue('transID: ' + this._transactionID);
  logger.debug.blue('sendingData: ' + this.isSendingData());

  this.requestBuilder = new BufferBuilder();

  // add required fields
  this.requestBuilder.append(PTPDefine.PacketType.OperationRequest, PTPDefine.FieldSize.PacketType);
  if (this.isSendingData()) {
    this.requestBuilder.append(PTPDefine.DataDirection.Out, PTPDefine.FieldSize.DataDirection);
  } else {
    this.requestBuilder.append(PTPDefine.DataDirection.InOrNone, PTPDefine.FieldSize.DataDirection);
  }
  this.requestBuilder.append(code, PTPDefine.FieldSize.OperationCode);
  this.requestBuilder.append(this._transactionID, PTPDefine.FieldSize.TransactionID);

  // add params
  for (let i = 0; i < paramCount; i++) {
    this.requestBuilder.append(params[i], PTPDefine.FieldSize.Parameter);
  }

  // pad empty params
  let emptyParamCount = 5 - paramCount;
  for (let i = 0; i < emptyParamCount; i++) {
    this.requestBuilder.append(0, PTPDefine.FieldSize.Parameter);
  }
  logger.debug.blue('done packing');

}

PTPOperationRequest.prototype.isSendingData = function() {
  return Buffer.isBuffer(this._dataBuffer);
};

PTPOperationRequest.prototype.getOpCode = function() {
  return this._opCode;
};

PTPOperationRequest.prototype.getTransactionID = function() {
  return this._transactionID;
};

/*
 * Return the outgoing Data Packet buffer,
 * or undefined if there is none
 */
PTPOperationRequest.prototype.getDataBuffer = function() {
  let builder = new BufferBuilder();

  builder.append(PTPDefine.PacketType.DataPacket, 4),
  builder.append(this._transactionID, 4);
  builder.append(this._dataBuffer);
  
  return builder.build();
};

/*
 * Return the Operation Request Packet buffer
 */
PTPOperationRequest.prototype.getRequestBuffer = function() {
  return this.requestBuilder.build();
};

/*
 * Return StartDataPacket buffer
 */
PTPOperationRequest.prototype.getStartDataBuffer = function() {
  // 1. [32] Length
  // 2. [32] PacketType
  // 3. [32] TransactionID
  // 4. [64] TotalDataLength
  
  if (!this.isSendingData) {
    logger.debug.red('ERROR: PTPOPerationRequest.prototype.getStartDataBuffer has no data buffer');
    return undefined;
  }

  let builder = new BufferBuilder();
  builder.append(PTPDefine.PacketType.StartDataPacket, 4);
  builder.append(this._transactionID, 4);
  builder.append(this._dataBuffer.length, 8);
  return builder.build();

};

/*
 * Return EndDataPacket buffer
 */
PTPOperationRequest.prototype.getEndDataBuffer = function() {
  // 1. [32] Length
  // 2. [32] PacketType
  // 3. [32] TransactionID
  // 4. [?] Optional DataPayload
  //
  // NOTE: This function currently does not support the optional DataPayload
  if (!this.isSendingData) {
    logger.debug.red('ERROR: PTPOPerationRequest.prototype.getEndDataBuffer has no data buffer');
    return undefined;
  }
  
  let builder = new BufferBuilder();
  builder.append(PTPDefine.PacketType.EndDataPacket, 4);
  builder.append(this._transactionID, 4);
  return builder.build();

};

/*------------------------------------------------------------------
 * Public functions
 *-----------------------------------------------------------------*/

/* 
 * return InitCommandRequestPacket buffer
 */
PTPOperationRequest.InitCommandRequestPacket = function() {
  // 1. [32] Length
  // 2. [32] PacketType
  // 3. [64] GUID hi
  // 4. [64] GUID lo
  // 5. [?] null-terminated friendly name
  // 6. [32] ProtocolVersion
  //
  // NOTE: This function currently sends all-zeros for the initiatior GUID
  
  let GUIDHI = 0x0000000000000000;
  let GUIDLO = 0x0000000000000000;

  let builder = new BufferBuilder();
  builder.append(PTPDefine.PacketType.InitCommandRequest, 4);
  builder.append(GUIDHI, 8);
  builder.append(GUIDLO, 8);
  builder.append(0x0000, 2);
  builder.append(0x00010000, 4);
  return builder.build();
};

/*
 * return InitEventRequestPacket buffer
 */
PTPOperationRequest.InitEventRequestPacket = function(connectionNumber) {
  // 1. [32] Length
  // 2. [32] PacketType
  // 3. [32] ConnectionNumber
  
  let builder = new BufferBuilder();
  builder.append(PTPDefine.PacketType.InitEventRequest, 4);
  builder.append(connectionNumber, 4);
  return builder.build();

};


/*------------------------------------------------------------------
 * Exports
 *-----------------------------------------------------------------*/
module.exports = PTPOperationRequest;

