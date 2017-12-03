'use strict';

module.exports = {
  PacketType : {
    InvalidValue: 0x00000000,
    InitCommandRequest: 0x00000001,
    InitCommandAck: 0x00000002,
    InitEventRequest: 0x00000003,
    InitEventAck: 0x00000004,
    InitFail: 0x00000005,
    OperationRequest: 0x00000006,
    OperationResponse: 0x00000007,
    InterruptEvent: 0x00000008,
    StartDataPacket: 0x00000009,
    DataPacket: 0x0000000A,
    CancelPacket: 0x0000000B,
    EndDataPacket: 0x0000000C
  },
  FieldSize: {
    Length: 4,
    PacketType: 4,
    DataDirection: 4,
    OperationCode: 2,
    ResponseCode: 2,
    TransactionID: 4,
    Parameter: 4,
    TotalDataLength: 8,
    EventCode: 2
  },
  DataDirection: {
    InOrNone: 1,
    Out: 2
  },

  SharedFieldIndex: {
    Length: 0,
    PacketType: 4
  },

  RequestFieldIndex: {
    DataDirection: 8,
    OperationCode: 10,
    TransactionID: 14,
    Parameter: [18, 22, 26, 30, 34]
  },

  ResponseFieldIndex: {
    ResponseCode: 8,
    TransactionID: 10,
    Parameter: [14, 18, 22, 26, 30]
  },
  StartDataFieldIndex: {
    TransactionID: 8,
    TotalDataLength: 12
  },
  DataFieldIndex: {
    TransactionID: 8,
    DataPayload: 12
  },
  EndDataFieldIndex: {
    TransactionID: 8,
    DataPayload: 12
  },
  InterruptFieldIndex: {
    EventCode: 8,
    TransactionID: 10,
    Parameter: [14, 18, 22, 26, 30]
  }

};
