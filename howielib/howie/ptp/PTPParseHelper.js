'use strict';

/*------------------------------------------------------------------
 * NPM modules
 *-----------------------------------------------------------------*/
const Hex = require('../util/hex');

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const PTPDefine = require('../ptp/PTPDefine');
const logger = require('../util/logger');

/*------------------------------------------------------------------
 * Exports
 *-----------------------------------------------------------------*/
module.exports = {

  // length and packetType are the same size/position for all packets
  length: (buf) => {
    const i = PTPDefine.SharedFieldIndex.Length;
    const s = PTPDefine.FieldSize.Length;
    return read(buf, i, s);
  },

  packetType: (buf) => {
    const i = PTPDefine.SharedFieldIndex.PacketType;
    const s = PTPDefine.FieldSize.PacketType;
    return read(buf, i, s);
  },

  OperationResponse: {

    transactionID: (buf) => {
      const i = PTPDefine.ResponseFieldIndex.TransactionID;
      const s = PTPDefine.FieldSize.TransactionID;
      return read(buf, i, s);
    },


    responseCode: (buf) => {
      const i = PTPDefine.ResponseFieldIndex.ResponseCode;
      const s = PTPDefine.FieldSize.ResponseCode;
      return read(buf, i, s);
    },


    param: (buf, paramNumber) => {
      const i = PTPDefine.ResponseFieldIndex.Parameter[paramNumber];
      const s = PTPDefine.FieldSize.Parameter;
      return read(buf, i, s);
    }
  },

  StartDataPacket: {
    transactionID: (buf) => {
      const i = PTPDefine.StartDataFieldIndex.TransactionID;
      const s = PTPDefine.FieldSize.TransactionID;
      return read(buf, i, s);
    },

    totalDataLength: (buf) => {
      const i = PTPDefine.StartDataFieldIndex.TotalDataLength;
      const s = PTPDefine.FieldSize.TotalDataLength;
      return read(buf, i, s);
    }
  },

  DataPacket: {
    transactionID: (buf) => {
      const i = PTPDefine.DataFieldIndex.TransactionID;
      const s = PTPDefine.FieldSize.TransactionID;
      return read(buf, i, s);
    },
    dataPayload: (buf) => {
      return buf.slice(PTPDefine.DataFieldIndex.DataPayload);
    }
  },

  EndDataPacket: {
    transactionID: (buf) => {
      const i = PTPDefine.EndDataFieldIndex.TransactionID;
      const s = PTPDefine.FieldSize.TransactionID;
      return read(buf, i, s);
    },

    dataPayload: (buf, size) => {
      if (size === undefined) {
        return undefined;
      }
      const i = PTPDefine.EndDataFieldIndex.DataPayload;
      if (buf.length < i + size) {
        return undefined;
      }
      let payload = Buffer.alloc(size);
      buf.copy(payload, 0, i);
      return payload;
    }
  },

  InterruptEvent: {
    transactionID: (buf) => {
      const i = PTPDefine.InterruptFieldIndex.TransactionID;
      const s = PTPDefine.FieldSize.TransactionID;
      return read(buf, i, s);
    },
    eventCode: (buf) => {
      const i = PTPDefine.InterruptFieldIndex.EventCode;
      const s = PTPDefine.FieldSize.EventCode;
      return read(buf, i, s);
    },
    param: (buf, paramNumber) => {
      const i = PTPDefine.InterruptFieldIndex.Parameter[paramNumber];
      const s = PTPDefine.FieldSize.Parameter;
      return read(buf, i, s);
    }

  }

};

/*------------------------------------------------------------------
 * Private functions
 *-----------------------------------------------------------------*/
function read(buf, index, size) {
  if (buf.length < index+size) {
    return undefined;
  }
  switch(size) {
    case 2: return buf.readUInt16LE(index);
    case 4: return buf.readUInt32LE(index);
    default: return Hex.readLarge(buf, index, size);
  }
}
