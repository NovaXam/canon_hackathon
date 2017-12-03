'use strict';

/*------------------------------------------------------------------
 * NPM modules
 *-----------------------------------------------------------------*/
const net = require('net');

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const PTPOperationRequest = require('../ptp/PTPOperationRequest');
const BufferParser = require('../ptp/BufferParser');
const PTPOperationResponse = require('../ptp/PTPOperationResponse');
const PTPInterruptEvent = require('../ptp/PTPInterruptEvent');
const PTPParser = require('../ptp/PTPParseHelper');
const PTPDefine = require('../ptp/PTPDefine');
const Stringify = require('../ptp/PTPStringify').Stringify;

/*------------------------------------------------------------------
 * Private data
 *-----------------------------------------------------------------*/
const PTPIPPort = 15740;

/*------------------------------------------------------------------
 * Private functions
 *-----------------------------------------------------------------*/
function parseInitCommandAck(packet) {

  let result = BufferParser.parseObject(packet, [
    {field: 'Length', size: 4},
    {field: 'PacketType', size: 4},
    {field: 'ConnectionNumber', size: 4},
    {field: 'ResponserGUID', size: 16},
    {field: 'ResponderFriendlyName', size: null},
    // TODO figure out why this next size doesn't work as 4:
    {field: 'ResponderProtocolVersion', size: 2},
  ]);

  logger.debug.green('parsed InitCommandAck:');
  logger.debug.dir(result);

  return result.ConnectionNumber;
}

function parseInitEventAck(packet) {

  let result = BufferParser.parseObject(packet, [
    {field: 'Length', size: 4},
    {field: 'PacketType', size: 4},
  ]);

  logger.debug.green('parsed InitEventAck:');
  logger.debug.dir(result);
}

/*------------------------------------------------------------------
 * Public prototype
 *-----------------------------------------------------------------*/
function PTPIP(eventCallback) {
  this.connectComplete = false;
  this.receivedCommandAck = false;
  this.receivedEventAck = false;
  this.connectionNumber = undefined;
  this.onInitComplete = undefined;
  this.eventCallback = eventCallback;

  this._partial = {};
}

PTPIP.prototype.connect = function(address, onInitComplete) {

  logger.debug.green(address);

  // store the camera's IP address
  this.cameraAddress = address;

  // set the user callback
  this.onInitComplete = onInitComplete;

  // fail initialization if it takes longer than 5 seconds
  this.initTimeout = setTimeout((function() {
    if (this.connectComplete === false) {
      this._initCompleteRoutine(false);
    }
  }).bind(this), 5000);

  // open the Command Channel Socket
  this.commandClient = net.Socket();
  this.commandClient.connect(PTPIPPort, this.cameraAddress, (this._onCommandConnect).bind(this));
  this.commandClient.on('data', (this._onCommandData).bind(this));
  this.commandClient.on('close', (this._onCommandClose).bind(this));
  this.commandClient.on('error', (this._onCommandError).bind(this));

};

PTPIP.prototype._onEventConnect = function() {
  logger.debug.cyan('connected to Event Channel');
  logger.debug.cyan('sending InitEventRequest...');
  let buffer = PTPOperationRequest.InitEventRequestPacket(this.connectionNumber);
  this.eventClient.write(buffer, 'hex');
};

PTPIP.prototype._onEventData = function(data) {
  logger.debug.blue('==received data on event channel=========================');
  logger.debug.log(data);

  let packets = this._splitPackets(data);
  for (let packet of packets) {

    let packetType = {};
    packetType.val = PTPParser.packetType(packet);
    packetType.key = Stringify(packetType.val, PTPDefine.PacketType);

    switch (packetType.val) {

      case PTPDefine.PacketType.InterruptEvent:
        PTPInterruptEvent.newPacket(packet, this.eventCallback);
        return;

      case PTPDefine.PacketType.InitEventAck:
        this.receivedEventAck = true;
        // Done with the initialization, give control to the user's callback
        this._initCompleteRoutine(true);
        return;

      case PTPDefine.PacketType.InitFail:
        logger.debug.red('ERROR: InitEventRequest received InitFail');
        this._initCompleteRoutine(false);
        return;
    }

  }
};

PTPIP.prototype._onEventError = function(err) {
  logger.red("PTPIP.eventClient.on('error'):" + err); 
};

PTPIP.prototype._onEventClose = function(data) {
  logger.yellow('closed Event Channel with camera');
};

PTPIP.prototype._onCommandConnect = function() {
  logger.debug.cyan('connected to Command Channel');
  logger.debug.cyan('sending InitCommandRequest...');
  let buffer = PTPOperationRequest.InitCommandRequestPacket();
  this.commandClient.write(buffer, 'hex');
};


PTPIP.prototype._onCommandData = function(data) {

  //logger.debug.blue('==received data on command channel=========================');
  //logger.debug.log(data);

  let packets = this._splitPackets(data);

  for (let packet of packets) {

    let packetType = {};
    packetType.val = PTPParser.packetType(packet);
    packetType.key = Stringify(packetType.val, PTPDefine.PacketType);

    //logger.debug.cyan('processing packet: ' + packetType.key);

    switch (packetType.val) {


      case PTPDefine.PacketType.InitCommandAck:
        this.receivedCommandAck = true;
        this.connectionNumber = parseInitCommandAck(data);

        // Open the Event Channel Socket
        this.eventClient = net.Socket();
        this.eventClient.connect(PTPIPPort, this.cameraAddress, (this._onEventConnect).bind(this));
        this.eventClient.on('data', (this._onEventData).bind(this));
        this.eventClient.on('error', (this._onEventError).bind(this));
        this.eventClient.on('close', (this._onEventClose).bind(this));
        break;

      case PTPDefine.PacketType.InitFail:
        logger.debug.red('ERROR: InitCommandRequest received InitFail');
        this._initCompleteRoutine(false);
        break;

      // Pass along the data to the response pool
      default: 
        PTPOperationResponse.newPacket(packet, packetType.key);
        break;
    }
  }
};


PTPIP.prototype._onCommandError = function(err) {
  logger.red("PTPIP.commandClient.on('error'):" + err); 
};

PTPIP.prototype._onCommandClose = function(data) {
  logger.yellow('closed Command Channel with camera');
  this._initCompleteRoutine(false);
};


PTPIP.prototype._initCompleteRoutine = function(success) {
  this.connectComplete = success;
  if (typeof this.onInitComplete === 'function') {
    this.onInitComplete(success);
    this.onInitComplete = undefined;
  }
};


/*
 * Return an <Array> of <Buffer> objects that are each a complete PTP packet
 */
PTPIP.prototype._splitPackets = function(buf) {

  // see if we need to complete a partial packet
  if (this._partial.responsePacket !== undefined) {
    buf = Buffer.concat([this._partial.responsePacket, buf]);
    this._partial.responsePacket = undefined;
  }

  // check for 0 or 1 packets
  let advertisedLength = PTPParser.length(buf);
  if (buf.length < advertisedLength) {
    this._partial.responsePacket = buf;
    return [];
  } else if (buf.length === advertisedLength){
    return [buf];
  }

  // split multiple packets 
  let packets = [];
  let size;
  let head;
  let tail = buf;

  while (tail.length > 0) {

    // parse the size of next packet
    let size = PTPParser.length(tail);
    // grab the head (next packet)
    head = tail.slice(0, size);
    packets.push(head);
    // grab the tail (any remaining packets)
    tail = tail.slice(size);
  }

  // check if the last packet is a complete packet 
  let last = packets[packets.length-1];
  if (last !== undefined && PTPParser.length(last) !== last.length) {
    this._partial.responsePacket = packets.pop();
  }

  return packets;
};


PTPIP.prototype.close = function() {
  if (this.commandClient !== undefined && this.commandClient !== null) {
    this.commandClient.destroy();
    delete this.commandClient;
  }
};

/*
 * Initiate an Operation Request
 *  request - PTPOperationRequest
 *  responseCallback - function
 *
 * return null if sent,
 *        error message if failed
 */
PTPIP.prototype.operationRequest = function(request, responseCallback) {

  if (this.commandClient === undefined || this.commandClient === null) {
    let error = 'socket not available to send over';
    logger.debug.red(error);
    return error;
  }

  PTPOperationResponse.newRequest(request, responseCallback);

  let requestBuffer = request.getRequestBuffer();
  logger.debug.log(requestBuffer);

  // Send operation request
  this.commandClient.write(requestBuffer, 'hex');

  // Send outgoing data phase, if necessary
  if (request.isSendingData()) {

    let start = request.getStartDataBuffer();
    let data = request.getDataBuffer();
    let end = request.getEndDataBuffer();

    this.commandClient.write(request.getStartDataBuffer(), 'hex');
    this.commandClient.write(request.getDataBuffer(), 'hex');
    this.commandClient.write(request.getEndDataBuffer(), 'hex');

  }

  return null;
};

module.exports = PTPIP;
