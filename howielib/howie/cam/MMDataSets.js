'use strict';

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const Lookup = require('../util/lookup');
const BufferParser = require('../ptp/BufferParser');
const EventKinds = require('../cam/MMCodes').EventKinds;
const Properties = require('../cam/MMCodes').Properties;

/* Return object: 
 * {
 *    name: 'DataSetName',     // name of the data set
 *    type: 'DataType',        // ('Array'|'Object'|'Binary')
 *    payload: {}              // output of the parsing, <Array> or <Object> 
 * }
 */
module.exports = {

  parseData: (opName, buf) => {

    let dataSet = DataSets[opName];
    let parsedData;

    if (dataSet === undefined) {
      logger.debug.red('WARNING: no DataSet definition defined for operation ' + opName);
      return undefined;
    }


    let parseFunction = BufferParser.getParseFunction(dataSet);

    if (parseFunction === undefined) {
      logger.debug.red('WARINING: invalid data set type in DataSet definition for ' + opName);
      return undefined;
    }

    parsedData  = parseFunction(buf, dataSet.definition);

    return {
      name: dataSet.name,
      type: dataSet.type,
      payload: parsedData,
    };
  },

  getValue: (propertyName, valueName) => {
    let vals = values[propertyName];
    if (vals !== undefined) {
      let val = vals[valueName];
      if (val !== undefined) {
        return val;
      }
    }

    logger.debug.red('WARNING! property value not found for ' + propertyName + ': ' + valueName);
    return undefined;

  },

  parseProperty: (propName, valueBuf) => {
    let simple = SimpleProperties[propName];
    if (simple) {
      // all lookups are 32 bit
      let val = valueBuf.readUInt32LE(0);
      if (val === 0xffffffff) {
        return 'MustBeInRemoteShooting';
      }
      let valName = Lookup(val, simple.values);
      if (valName) {
        return valName;
      } else {
        return val;
      }
    } else {
      logger.debug.red('Dataset definition not available for ' + propName);
      //TODO: add data sets for complex properties
    }
  },

  listSimpleProperties: () => {

    return SimpleProperties;

  },


};

/*------------------------------------------------------------------
 * Event notification data sets
 *-----------------------------------------------------------------*/
let SimpleProperties = Object.freeze({

  AutoLevel: {
    remoteShootingRequired: true,
    values: {
      enable: 0x00,
      disable: 0x01,
    }
  },

  Exposure: {
    remoteShootingRequired: true,
    values: {
      "+2.00": 0x10,
      "+1.67": 0x0d,
      "+1.33": 0x0b,
      "+1.00": 0x08,
      "+0.67": 0x05,
      "+0.33": 0x03,
      "0.00": 0x00,
      "-0.33": 0xfd,
      "-0.67": 0xfb,
      "-1.00": 0xf8,
      "-1.33": 0xf5,
      "-1.67": 0xf3,
      "-2.00": 0xf0,
    }
  },
  StillImageAspectRatio: {
    remoteShootingRequired: true,
    values: {
      '4:3': 0x02,
      '16:9': 0x07
    }
  },
  MaxISOSpeedForStill: {
    remoteShootingRequired: true,
    values: {
      ISO_400: 0x08,
      ISO_800: 0x0B,
      ISO_1600: 0x0E,
      ISO_3200: 0x11,
      ISO_6400: 0x14,
    }
  },
  RecordingMovieStatus: {
    remoteShootingRequired: false,
    values: {
      stop: 0x00,
      start: 0x04
    }
  },
  MaxISOSpeedForMovie: {
    remoteShootingRequired: true,
    values: {
      ISO_400: 0x01,
      ISO_800: 0x02,
      ISO_1600: 0x03,
      ISO_3200: 0x04,
      ISO_6400: 0x05,
      ISO_12800: 0x06,
    }
  },
  VideoSystem: {
    remoteShootingRequired: true,
    values: {
      NTSC: 0x00,
      PAL: 0x01
    }
  },
  DigitalIS: {
    remoteShootingRequired: true,
    values: {
      disable: 0x00,
      enable: 0x01,
      enhanced: 0x02
    }
  },
  AudioRecordingLevel: {
    remoteShootingRequired: true,
    values: { /* literal 0-63 */ }
  },
  WirelessCommunicationStatus: {
    remoteShootingRequired: true,
    values: {
      disconnected: 0x00,
      connected: 0x07
    }
  },
  LiveviewSize: {
    remoteShootingRequired: true,
    values: {
      middle: 0x02,
      small: 0x08,
      large: 0x10
    }
  },
  RecordableShots: {
    remoteShootingRequired: true,
    values: { /* literal */ }
  },
  RemainingTime: {
    remoteShootingRequired: true,
    values: { /* literal seconds */ },
    min: 0,
    max: 63
  },

  BatteryLevelExtended: {
    remoteShootingRequired: false,
    values: {
      nearly_depleted: 0x00,
      slightly_depleted: 0x01,
      sufficient_charge: 0x02,
      depleted: 0x03,
      battery_error: 0x06,
      unknown: 0x10,
      ac_adapter: 0x11
    }
  },
  BatteryKind: {
    remoteShootingRequired: false,
    values: {
      battery: 0x00,
      ac_adapter: 0x02
    }
  },
  InternalTemperature: {
    remoteShootingRequired: false,
    values: {
      normal: 0x00,
      caution: 0x01,
      emergency: 0x02
    }
  },
  UTC: {
    remoteShootingRequired: false,
    values: { /* literal seconds */ }
  },
  DaylightSavingTime: {
    remoteShootingRequired: false,
    values: {
      off: 0x00,
      on: 0x01
    }
  },
  Mute: {
    remoteShootingRequired: false,
    values: {
      enable: 0x00,
      disable: 0x01
    }
  },
  DisplayBrightness: {
    remoteShootingRequired: false,
    values: {
      low: 0x01,
      medium: 0x02,
      high: 0x03
    }
  },
  Language: {
    remoteShootingRequired: false,
    values: {
      english: 0x00,
      german: 0x03,
      french: 0x06,
      spanish: 0x07,
      italian: 0x15
    }
  },
  AutoDisplayOff: {
    remoteShootingRequired: false,
    values: {
      '10': 0x0a,
      '15': 0x0f,
      '20': 0x14,
      '30': 0x1e,
      '60': 0x3c,
      '120': 0x78,
      '180': 0xb4
    }
  },
  AutoPowerOff: {
    remoteShootingRequired: false,
    values: {
      enable: 0x00,
      disable: 0x01
    }
  },
  CreateFolder: {
    remoteShootingRequired: false,
    values: {
      daily: 0x01,
      monthly: 0x02
    }
  },

  FileNumbering: {
    remoteShootingRequired: true,
    values: {
      auto_reset: 0x00,
      continuous: 0x01
    }
  },
});


/*------------------------------------------------------------------
 * Nested data sets
 *-----------------------------------------------------------------*/
let detectionInfoDataset = [
  {field: 'DatasetLength', size: 4},
  {field: 'Kind', size: 4, values: { DetectionInfoDatset: 0x80000004} },
  {field: 'DetectionID', size: 2},
  {field: 'DetectionType', size: 2,
    values: {
      Unknown: 0x00,
      Human: 0x01,
      Object: 0x02
    }
  },
  {field: 'DetectionMode', size: 2,
    values: {
      Auto: 0x00,
      Manual: 0x01
    }
  },
  {field: 'ImageSizeH', size: 2},
  {field: 'ImageSizeV', size: 2},
  {field: 'SubjectInfoArray', type: 'Array',
    definition: [ 
      {field: 'DatasetLength', size: 4},
      {field: 'SubjectID', size: 2},
      {field: 'State', size: 2,
        values: {
          Detecting: 0x00,
          Tracking: 0x01,
          Keeping: 0x02
        }
      },
      {field: 'SubjectPosH', size: 2},
      {field: 'SubjectPosV', size: 2},
      {field: 'SubjectSizeH', size: 2},
      {field: 'SubjectSizeV', size: 2},
      {field: 'LeftEyePosH', size: 2},
      {field: 'LeftEyePosV', size: 2},
      {field: 'RightEyePosH', size: 2},
      {field: 'RightEyePosV', size: 2},
      {field: 'Rotate', size: 2},
    ]
  }
];

let motionInfoDataset = [
  {field: 'DatasetLength', size: 4},
  {field: 'Kind', size: 4, values: { MotionInfoDataset: 0x80000003} },
  {field: 'PitchVelocity', size: 4, transform: computeAngularVelocity},
  {field: 'YawVelocity', size: 4, transform: computeAngularVelocity},
  {field: 'RollVelocity', size: 4, transform: computeAngularVelocity},
  {field: 'XAcceleration', size: 2, transform: computeAxisAcceleration},
  {field: 'YAcceleration', size: 2, transform: computeAxisAcceleration},
  {field: 'ZAcceleration', size: 2, transform: computeAxisAcceleration},
  {field: 'ShakeLevel', size: 2,
    values: {
      SmallVibration: 0x00,
      MediumVibration: 0x01,
      LargeVibration: 0x02
    }
  },
  {field: 'HorizontalAngle', size: 2, transform: computeHorizontalAngle},
  {field: 'TiltAngle', size: 2, transform: computeHorizontalAngle},
  {field: 'ShockForce', size: 4, transform: computeImpactForce},
];

let angleOfViewDataset = 
[
  {field: 'DatasetLength', size: 4},
  {field: 'Kind', size: 4, values: { AngleOfViewDataset: 0x80000002} },
  {field: 'AngleOfViewStatus', size: 4, 
    values: {
      Normal: 0x00,
      Narrow: 0x01
    }
  }
];

let liveviewSizeDataset = 
[
  {field: 'DatasetLength', size: 4},
  {field: 'Kind', size: 4, values: { LiveviewSizeDataset: 0x80000001 } },
  {field: 'Width', size: 4},
  {field: 'Height', size: 4}
];

let imageDataset = 
[
  {field: 'DatasetLength', size: 4},
  {field: 'Kind', size: 4, values: { ImageDataset: 0x0B } },
  {field: 'ImageData', type: 'Binary'}
];

let terminatorDataset = 
[
  {field: 'DatasetLength', size: 4},
  {field: 'Kind', size: 4, values: { TerminatorDataset: 0x00 } },
];

let values = {

  storageType: {
    Undefined: 0x00,
    FixedROM: 0x01,
    RemovableROM: 0x02,
    FixedRAM: 0x03,
    RemovableRAM: 0x04
  },

  filesystemType: {
    Undefined: 0x00,
    GenericFlat: 0x01,
    GenericHierarchical: 0x02,
    DCF: 0x03,
  },

  accessCapability: {
    ReadWrite: 0x00,
    Read: 0x01,
    ReadDelete: 0x02
  },

  objectFormat: {
    EXIFJPEG: 0x3801,
    JFIF: 0x3808
  },


  protectionStatus: {
    NoProtection: 0x00,
    ReadOnly: 0x01
  },

  associationType: {
    Undefined: 0x00,
    GenericFolder: 0x01,
    Album: 0x02,
    TimeSequence: 0x03,
    HorizontalPanoramic: 0x04,
    VerticalPanoramic: 0x05,
    "2DPanoramic": 0x06,
    AncillaryData: 0x07
  },

  networkType: {
    Unset: 0x00,
    AccessPointMode: 0x01,
    ClientMode: 0x02
  },

  essidDisplayType: {
    Visible: 0x00,
    Hidden: 0x01
  },

  authenticationType: {
    None: 0x00,
    "WPA/2": 0x06,
    // value of 6 reported as well
  },

  encryptionType: {
    None: 0x00,
    "AES/TKIP": 0x04
    // value of 4 reported as well
  },

  addressingType: {
    Manual: 0x01,
    Auto: 0x02
    // value of 2 reported as well
  },

  dnsSettingType: {
    Auto: 0x00,
    Manual: 0x01
  }
};
/*------------------------------------------------------------------
 * Operation response (top-level) data sets
 *-----------------------------------------------------------------*/

const DataSets = {



/*
  
  EXAMPLE:

  FooObjectOperation: {       // operation code name
    name: 'Foo',              // name of the data set
    type: 'Object',           // type of the data ('Object'|'Array'|'Binary')
    definition: [             // fields in the data set to parse
      {field: 'field1Name', size: 4},   // 4 bytes
      {field: 'field2Name', size: 8},   // 8 bytes
      {field: 'field3Name', size: null} // NULL-terminated string
      {field: 'field3Name', size: undefined} // variable data length
    ]
  },

  NOTE:

   (obj.type === 'Array') means there will be 0 or more objects that fit the obj.definition
   (obj.type === 'Object') means there will be at most 1 object that fit the obj.definition
   (obj.type === 'Binary') means there will be one binary data buffer

*/

  GetStorageIDs: {
    name: 'StorageIDArray',
    type: 'Array',
    definition: [
      {field: 'PhysicalStorageID', size: 2},
      {field: 'LogicalStorageID', size: 2}
    ]
  },

  GetStorageInfo: {
    name: 'StorageInfo',
    type: 'Object',
    definition: [
      {field: 'StorageType', size: 2, values: values.storageType},
      {field: 'FilesystemType', size: 2, values: values.filesystemType},
      {field: 'AccessCapability', size: 2, values: values.accessCapability },
      {field: 'MaxCapacity', size: 8},
      {field: 'FreeSpaceInBytes', size: 8},
      {field: 'FreeSpaceInImages', size: 4},
      {field: 'StorageDescription', size: null, type: 'String'},
      {field: 'VolumeLabel', size: null, type: 'String'},
    ]
  },

  GetObjectHandles: {       
    name: 'ObjectHandleArray',
    type: 'Array',
    definition: [
      {field: 'ObjectHandle', size: 4}
    ]
  },

  GetObjectInfo: {
    name: 'ObjectInfo',
    type: 'Object',
    definition: [
      {field: 'StorageID', size: 4},
      {field: 'ObjectFormat', size: 2, values: values.objectFormat},
      {field: 'ProtectionStatus', size: 2, values: values.protectionStatus },
      {field: 'ObjectCompressedSize', size: 4},
      {field: 'ThumbFormat', size: 2, values: values.objectFormat},
      {field: 'ThumbCompressedSize', size: 4},
      {field: 'ThumbPixWidth', size: 4},
      {field: 'ThumbPixHeight', size: 4},
      {field: 'ImagePixWidth', size: 4},
      {field: 'ImagePixHeight', size: 4},
      {field: 'ImageBitDepth', size: 4},
      {field: 'ParentObject', size: 4},
      {field: 'AssociationType', size: 2, values: values.associationType},
      {field: 'AssociationDesc', size: 4},
      {field: 'SequenceNumber', size: 4},
      {field: 'Filename', size: null, type: 'String'},
      {field: 'CaptureDate', size: null, type: 'String'},
      {field: 'ModificationDate', size: null, type: 'String'},
      {field: 'Keywords', size: null, type: 'String'},
    ]
  },

  GetObject: {
    name: 'Object',
    type: 'Binary',
  },

  GetThumb: {
    name: 'Object',
    type: 'Binary'
  }, 

  GetLiveviewData: {
    name: 'LiveviewData',
    type: 'Object',
    definition: [
      {field: 'Image', type: 'Object', definition: imageDataset },
      {field: 'LVSize', type: 'Object', definition: liveviewSizeDataset },
      {field: 'AngleOfView', type: 'Object', definition: angleOfViewDataset },
      {field: 'MotionInfo', type: 'Object', definition: motionInfoDataset },
      {field: 'DetectionInfo', type: 'Object', definition: detectionInfoDataset },
      {field: 'Terminator', type: 'Object', definition: terminatorDataset }
    ]
  },

  GetWirelessSettingInfo: {
    name: 'WirelessSetting',
    type: 'Object',
    definition: [
      {field: 'DatasetLength', size: 4},
      {field: 'UUID', size: 17, type: 'UUID'},
      {field: 'NetworkType', size: 4, values: values.networkType},
      {field: 'ESSID', size: 33, type: 'ASCII'},
      {field: 'ESSIDDisplayType', size: 4, values: values.essidDisplayType},
      {field: 'AuthenticationType', size: 4, values: values.authenticationType},
      {field: 'EncryptionType', size: 4, values: values.encryptionType},
      {field: 'Passphrase', size: 65, type: 'ASCII'},
      {field: 'Channel', size: 4},
      {field: 'AddressingType', size: 4, values: values.addressingType},
      {field: 'IPAddress', size: 16},
      {field: 'SubnetMask', size: 16},
      {field: 'DefaultGateway', size: 16},
      {field: 'DNSSettingType', size: 4, values: values.dnsSettingType},
      {field: 'PreferredDNS', size: 16},
      {field: 'AlternateDNS', size: 16},
      {field: 'LeaseStartAddress', size: 16},
    ]
  },

  NotifyDevicePropValue: {
    name: 'NotifyDevicePropValue',
    type: 'Object',
    definition: [
      {field: 'DatasetLength', size: 4},
      {field: 'EventKind', size: 4},
      {field: 'PropertyCode', size: 4, values: Properties},
      {field: 'PropertyValue', type: 'Binary'}
    ]
  },

};




/*------------------------------------------------------------------
 * Transform functions
 *-----------------------------------------------------------------*/
function computeAngularVelocity(buf32LE) {

  // read signed value
  let value = buf32LE.readInt32LE(0);
  // multiply by 0.01 to get deg/sec
  value *= 0.01;

  return value;
}

function computeAxisAcceleration(buf16LE) {

  // read signed value
  let value = buf16LE.readInt16LE(0);
  // divide by 1024 to get G
  value /= 1024;

  return value;
}

function computeHorizontalAngle(buf16LE) {

  // read signed value
  let value = buf16LE.readInt16LE(0);
  // divide by 10 to get deg
  value /= 10;

  return value;
}

function computeImpactForce(buf32LE) {

  // read signed value
  let value = buf32LE.readInt32LE(0);
  // divide by 4096
  value /= 4096;
  // take the square root to get value in G
  value = Math.sqrt(value);

  return value;

}
