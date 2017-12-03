'use strict';

/*------------------------------------------------------------------
 * nodejs modules
 *-----------------------------------------------------------------*/
const http = require('http');

/*------------------------------------------------------------------
 * NPM modules
 *-----------------------------------------------------------------*/
const P = require('bluebird');

/*------------------------------------------------------------------
 * Howie modules
 *-----------------------------------------------------------------*/
const logger = require('../util/logger');
const Cleanup = require('../util/cleanup');
const MSearcher = require('../upnp/MSearcher');
const XmlParser = require('../upnp/XmlParser');
const PTPIP = require('../ptp/PTPIP');
const PTPOperationRequest = require('../ptp/PTPOperationRequest');
const BufferBuilder = require('../ptp/BufferBuilder');
const Hex = require('../util/hex');

/*------------------------------------------------------------------
 * This camera's modules
 *-----------------------------------------------------------------*/
const OpCodes = require('../cam/MMCodes').Operations;
const Events = require('../cam/MMCodes').Events;
const Params = require('../cam/MMRequestParams');
const DataSets = require('../cam/MMDataSets');
const Properties = require('../cam/MMCodes').Properties;
const Stringify = require('../cam/MMStringify').Stringify;
const StringifyOpCode = require('../cam/MMStringify').StringifyOpCode;
const StringifyEventData = require('../cam/MMStringify').StringifyEventData;
const JsonResponse = require('../cam/MMJsonResponse');

/*------------------------------------------------------------------
 * Public prototype
 *-----------------------------------------------------------------*/
/*
 * Create a new MMCamera instance to discover, connect to, and
 * control a Canon MM100-WS camera
 */
function MMCamera() {

  // Set the cleanup callback
  Cleanup.set((this._cleanupCallback).bind(this));

  // Initialize the camera state
  this._clearConnectionState();

  this.openSessionCallback = undefined;
  this.ptpip = undefined;

}


MMCamera.prototype._clearConnectionState = function() {
  this.state = {
    connection: {
      discovered: false,
      connecting: false,
      connected: false
    },
    mode: {
      remoteShooting: false,
      streaming: false,
      streamHalted: false
    },
    objects: {
      waitCount: 0,
    },
    propertyPromise: {}
  };

};

/*
 * Discover and connect to an available camera on the network
 *  openSessionCallback - <function> to run when connected
 */
MMCamera.prototype.ipConnect = function(openSessionCallback, options) {

  this.openSessionCallback = openSessionCallback;

  // Start the MSearch
  const searcher = new MSearcher();
  searcher.GetCamera((this._onDiscovered).bind(this), options);

};

/*
 * Start a remote shoot session (required for snapping photos or
 * getting live view)
 *
 * Return a bluebird promise
 */
MMCamera.prototype.startRemoteShoot = function() {

  if (this.state.mode.remoteShooting) {
    return P.resolve({
      code: 'OK'
    });
  }

  return new P((resolve, reject) => {

    return this._operationRequest(OpCodes.SetRemoteShootingMode, [Params.remoteShootingMode.startRemoteShooting])
    .then((response) => {
      if (response.code === 'OK') {
        this.state.mode.remoteShooting = true;
      }
      return resolve(response);
    })
    .catch((error) => {
      return reject(error);
    });

  });

};

/*
 * Take a still photo on the camera.
 *
 * Return a bluebird promise
 */
MMCamera.prototype.snap = function() {
  // Must be in remoteShootingMode
  // Snap is two step operation
  // 1. PressShutterButton
  // 2. ReleaseShutterButton
  
  // IncremenWAIT_INTERVALt the waitCount for each object snapped
  this.state.objects.waitCount += 1;

  // Send the result of PressShutterButton as the final response
  let finalResponse;

  return new P((resolve, reject) => {

    return this.startRemoteShoot()
    .then((response) => {
      if (response.code !== 'OK') {
        return reject(response.code);
      }
      return this._operationRequest(OpCodes.PressShutterButton,
          [Params.shutterButtonAction.pressShutterButton,
           Params.shutterButtonAFStatus.shootingWithoutAF]);
    })
    .then((response) => {
      if (response.code!== 'OK') {
        return reject(response.code);
      }
      finalResponse = response;
      return this._operationRequest(OpCodes.ReleaseShutterButton,
          [Params.shutterButtonAction.releaseShutterButton]);
    })
    .then((response) => {
      return resolve(finalResponse);
    })
    .catch((error) => {
      return reject(error);
    });
  });
};


/* 
 * Retrieve 1 (default) or more thumbnails of the last pictures in the main disk
 *
 * Return a bluebird promise.
 */
MMCamera.prototype.getLastThumb = function(numItems) {

  const self = this;
  numItems = numItems || 1;

  return new P((resolve, reject) => {
    return this._waitForObjectAdded()
    .then((response) => {
      return self.listFiles()
    })
    .then((fileList) => {
      return self._retrievalLoop(OpCodes.GetThumb, fileList, numItems);
    })
    .then((results) => {
      return resolve(results);
    })
    .catch((error) => {
      return reject(error);
    });
  });

};

MMCamera.prototype.getImageByHandle = function(handle) {

  const self = this;

  if (typeof handle !== 'number') {
    return this.getLastImage();
  } else {
    return this._retrieveItem(OpCodes.GetObject, handle)
  }

};

MMCamera.prototype.getThumbByHandle = function(handle) {

  const self = this;

  if (typeof handle !== 'number') {
    return this.getLastThumb();
  } else {
    return this._retrieveItem(OpCodes.GetThumb, handle)
  }

};

/* 
 * Retrieve 1 (default) or more full images of the last pictures in the main disk
 *
 * Return a bluebird promise.
 */
MMCamera.prototype.getLastImage = function(numItems) {

  const self = this;
  numItems = numItems || 1;

  return new P((resolve, reject) => {

    return this._waitForObjectAdded()
    .then((response) => {
      return self.listFiles()
    })
    .then((fileList) => {
      return this._retrievalLoop(OpCodes.GetObject, fileList, numItems)
    })
    .then((results) => {
      return resolve(results);
    })
    .catch((error) => {
      return reject(error);
    });
  });

};

MMCamera.prototype.getAllImages = function() {

  const self = this;

  return new P((resolve, reject) => {

    return this._waitForObjectAdded()
    .then((response) => {
      return self.listFiles()
    })
    .then((fileList) => {
      return this._retrievalLoop(OpCodes.GetObject, fileList, fileList.length)
    })
    .then((results) => {
      return resolve(results);
    })
    .catch((error) => {
      return reject(error);
    });
  });

};

MMCamera.prototype.getAllThumbs = function() {

  const self = this;

  return new P((resolve, reject) => {

    return this._waitForObjectAdded()
    .then((response) => {
      return self.listFiles()
    })
    .then((fileList) => {
      return this._retrievalLoop(OpCodes.GetThumb, fileList, fileList.length)
    })
    .then((results) => {
      return resolve(results);
    })
    .catch((error) => {
      return reject(error);
    });
  });

};

MMCamera.prototype._retrievalLoop = function(opCode, handles, numItems) {

  const self = this;

  return new P((resolve, reject) => {
    let results = [];
    let i = numItems;

    function next() {
      self._retrieveItem(opCode, handles[handles.length - i])
      .then(function(result) {
        results.push(result);
        i--;
        if (i > 0) {
          logger.debug.yellow('getting item #' + i);
          next();
        } else {
          resolve(results);
        }
      }, reject)
    }

    // start the recursion
    next();
  });

};

MMCamera.prototype._retrieveItem = function(opCode, handle) {

  const self = this;
  let objectInfo;
  let handleParam = Hex.makeParam(handle);

  return new P((resolve, reject) => {

    return self._operationRequest(OpCodes.GetObjectInfo, [handleParam])
    .then((response) => {

      if (response.code !== 'OK') {
        return reject(response.code);
      }

      objectInfo = response.data.payload;
      return self._operationRequest(opCode, [handleParam]);

    })
    .then((response) => {

      if (response.code !== 'OK') {
        return reject(response.code);
      }

      return resolve({
        info: objectInfo,
        image: response.data.payload
      });

    })
    .catch((error) => {
      logger.debug.red(error);
      return reject(error);
    });

  });

};


/*
 * Get a list of all the files on the camera.
 *
 * Return a bluebird promise
 */
MMCamera.prototype.listFiles = function() {

  let storageIDBuf;
  let storageInfo;

  return new P((resolve, reject) => {
    this._operationRequest(OpCodes.GetStorageIDs)
    .then((response) => {
      if (response.code !== 'OK') {
        return reject(response.code);
      }

      storageIDBuf = response.data.payload[0].buf;
      return this._operationRequest(OpCodes.GetStorageInfo, [storageIDBuf]);
      
    })
    .then((response) => {

      storageInfo = response;
      return this._operationRequest(OpCodes.GetObjectHandles, [storageIDBuf]);
      
    })
    .then((response) => {

      return resolve(JsonResponse(response));

    })
    .catch((error) => {
      return reject(error);
    });
  });
};


MMCamera.prototype.stopStream = function() {

  if (this.state.mode.streaming) {
    this.state.mode.streamHalted = true;
  }

};

/*
 * get a new frame delivered to the onFrame callback at the specified framerate
 *
 *  onFrame - <function> to deliver the frame JSON to
 */
MMCamera.prototype.startStream = function(onFrame) {

  let self = this;

  if (self.state.mode.streaming) {
    logger.debug.red('stream already in progress');
    return;
  }

  self.state.mode.streaming = true;

  var promiseWhile = P.method((condition, action) => {
    if (!condition()) return;
    return action().then(promiseWhile.bind(null, condition, action));
	});

  promiseWhile(() => {
    if (self.state.mode.streamHalted === true) {
      self.state.mode.streamHalted = false;
      self.state.mode.streaming = false;
      // halt
      return false;
    }
    // continue
    return true;
  }, () => {
    return self.getLiveViewFrame().then((response) => {
      if (typeof onFrame === 'function') {
        onFrame(response);
      }
    });
  });

};


MMCamera.prototype.getLiveViewFrame = function() {

  return this.startRemoteShoot()
  .then((response) => {
    if (response.code !== 'OK') {
      return P.reject(response.code);
    }
    return this._operationRequest(OpCodes.GetLiveviewData,
                                  [0xFFFFFFFF, 0x01, 0x00]);
  }).then((response) => {
    return JsonResponse(response);
  })
  .catch((error) => {
    return P.reject(error);
  });

}

MMCamera.prototype.getWirelessSettings = function() {
  this._requestedWirelessSettings = true;

  return this._operationRequest(OpCodes.GetWirelessSettingInfo)
    .then((response) => {
      this._requestedWirelessSettings = undefined;
      return JsonResponse(response);
    });
};

/*
 * settings = {
 *  dhcp: false,
 *  hiddenEssid: true
 * }
 */
MMCamera.prototype.setWirelessSettings = function(essid, passphrase, settings) {

  let addressingType;
  let essidDisplayType;
  let encryptionType;
  let authenticationType;

  // Check for custom settings
  settings = settings || {};
  addressingType = (settings.dhcp === false) ? ('Manual') : ('Auto');
  essidDisplayType = (settings.hiddenEssid === true) ? ('Hidden') : ('Visible');

  // Check for passphrase
  if (passphrase === '' || typeof passphrase !== 'string') {
    passphrase = '';
    encryptionType = 'None';
    authenticationType = 'None';
  } else {
    encryptionType = 'AES/TKIP';
    authenticationType = 'WPA/2';
  }

  let data = [
    ['UUID', {value: '', size: 17}],
    ['NetworkType', {value: DataSets.getValue('networkType', 'ClientMode'), size: 4}],
    ['ESSID', {value: essid, size: 33}],
    ['ESSIDDisplayType', {value: DataSets.getValue('essidDisplayType', essidDisplayType), size: 4}],
    ['AuthenticationType', {value: DataSets.getValue('authenticationType', authenticationType), size: 4}],
    ['EncryptionType', {value: DataSets.getValue('encryptionType', encryptionType), size: 4}],
    ['Passphrase', {value: passphrase, size: 65}],
    ['Channel', {value: 0, size: 4}],
    ['AddressingType', {value: DataSets.getValue('addressingType', addressingType), size: 4}],
    ['IPAddress', {value: '', size: 16}],
    ['SubnetMask', {value: '', size: 16}],
    ['DefaultGateway', {value: '', size: 16}],
    ['DNSSettingType', {value: DataSets.getValue('dnsSettingType', 'Auto'), size: 4}],
    ['PreferredDNS', {value: '', size: 16}],
    ['AlternateDNS', {value: '', size: 16}],
    ['LeaseStartAddress', {value: '', size: 16}]
  ];

  let builder = new BufferBuilder();
  builder.from(data);
  let dataBuf = builder.build();

  this._requestedWirelessSettings = true;

  return this._operationRequest(OpCodes.SetWirelessSettingInfo, [], dataBuf)
    .then((response) => {
      this._requestedWirelessSettings = undefined;
      return response;
    });
};

MMCamera.prototype.getSimpleProperty = function(propName) {

  // check for valid property
  if (typeof propName !== 'string') {
    return P.reject('invalid property name');
  }
  let code = Properties[propName];

  if (code === undefined) {
    return P.reject('unknown propName: ' + propName);
  }

  if (this.state.propertyPromise[propName] !== undefined) {
    return P.reject('property request in progress: ' + propName);
  }

  let propDefinition = (this.listSimpleProperties())[propName];
  if (propDefinition === undefined) {
    return P.reject('property is not a simple property');
  }



  return new P((resolve, reject) => {
    // store the promise reference
    this.state.propertyPromise[propName] = {
      resolve: resolve,
      reject: reject
    }; 

    if (propDefinition.remoteShootingRequired === true) {
      return this.startRemoteShoot()
        .then((response) => {
          return this._operationRequest(OpCodes.RequestDevicePropValue, [code]);
        });
    } else {
      return this._operationRequest(OpCodes.RequestDevicePropValue, [code]);
    }
  });

};

MMCamera.prototype.setSimpleProperty = function(propName, value) {

  if (typeof propName !== 'string') {
    return P.reject('invalid property name');
  }
  let code = Properties[propName];
  
  if (code === undefined) {
    return P.reject('unknown propName: ' + propName);
  }

  let simpleProperties = this.listSimpleProperties();
  let propDefinition = simpleProperties[propName] 
  if (propDefinition === undefined) {
    return P.reject('property is not a simple property');
  }

  let cleanValue;
  if (Object.keys(propDefinition.values).length > 1) {
    // check if the value is on the list
    for (let key in propDefinition.values) {
      if (value === key || value === propDefinition.values[key]) {
        cleanValue = propDefinition.values[key];
        break;
      }
    }
  } else if (propDefinition.min && propDefinition.max) {
    // check if the value meets the constraints
    if (value < propDefinition.min || value > propDefinition.max) {
      return P.reject('value ' + value + 'is out of range, expected: ' + propDefinition.min + '-' + propDefinition.max);
    } else {
      cleanValue = value;
    }
  } else {
    // accept any value 
    cleanValue = value;
  }

  if (cleanValue === undefined) {
    return P.reject('value ' + value + ' invalid for ' + propName);
  }

  return new P((resolve, reject) => {

    let data = [
      ['PropertyCode', {value: code, size: 4}],
      ['PropertyValue', {value: cleanValue, size: 4}],
    ];

    let builder = new BufferBuilder();
    builder.from(data);
    let dataBuf = builder.build();

    if (propDefinition.remoteShootingRequired === true) {
      return this.startRemoteShoot()
        .then((response) => {
          return this._operationRequest(OpCodes.SetExtendedDevicePropValue, [], dataBuf);
        })
        .then((response) => { resolve(response) })
        .catch((error) => {
          reject(error);
        });
    } else {
      return this._operationRequest(OpCodes.SetExtendedDevicePropValue, [], dataBuf)
        .then((response) => { resolve(response) })
        .catch((error) => {
          reject(error);
        });
    }
  });

};

MMCamera.prototype.listSimpleProperties = function() {

  return DataSets.listSimpleProperties();

};

MMCamera.prototype.resetWirelessSettings = function() {

  return this._operationRequest(OpCodes.ResetWirelessSettings);

};

MMCamera.prototype.close = function() {

  return new P((resolve, reject) => {
    return this._operationRequest(OpCodes.CloseSession)
    .then((response) => {

      this._clearConnectionState();
      this.ptpip.close();

      return resolve(response);

    });
  });

};


MMCamera.prototype.getIPAddress = function() {
  return this._description.address;
}

MMCamera.prototype.getUUID = function() {
  return this._description.uuid;
};

MMCamera.prototype.getDescription = function() {
  return this._description;
};

/*------------------------------------------------------------------
 * Private methods
 *-----------------------------------------------------------------*/
MMCamera.prototype._operationRequest = function(opCode, params, dataOut) {

  if (this.state.connection.connected !== true) {
    return P.reject('no connection to camera');
  }

  return new P((resolve, reject) => {

    logger.debug.cyan('sending request: ' + StringifyOpCode(opCode));
    let request = new PTPOperationRequest(opCode, params, dataOut);
    let error = this.ptpip.operationRequest(request, (response) => {

      response = Stringify(response);

      return resolve(response);

    });

    if (error) { return reject(error); }

  });

};

MMCamera.prototype._waitForObjectAdded = function() {
  let self = this;

  let checkCount =  0;
  const WAIT_INTERVAL = 200;

  return new P((resolve, reject) => {

    let waitCountTimer = setInterval(() => {
      checkWaitCount();
    }, WAIT_INTERVAL);

    function checkWaitCount() {
      if (self.state.objects.waitCount === 0 || checkCount > 10) {

        clearInterval(waitCountTimer);
        self.state.objects.waitCount = 0;
        return resolve();

      } else {

        logger.debug.yellow('waiting for ' + self.state.objects.waitCount + ' more objects to be added');
        checkCount++;

      } 
    }

  });
}

/*------------------------------------------------------------------
 * Private event callbacks
 *-----------------------------------------------------------------*/
MMCamera.prototype._onDiscovered = function(description) {

  if (this.state.connection.discovered) return;

  this.state.connection.discovered = true;

  this._uuid = description.uuid;
  this._description = description;

  // Request the XML page
  http.get(description.xmlUrl, (res) => {
    res.setEncoding('utf8');
    let body = '';
    res.on('data', data => {
      body += data;
    });
    res.on('end', () => {
      logger.debug.green(body);
      this._onXMLRetrieved(body);
    });
  });

};

MMCamera.prototype._onXMLRetrieved = function(body) {

  const parser = new XmlParser();
  parser.parse(body, (obj) => {
    if (obj === null) {
      logger.debug.red('ERROR: unable to parse URL from device description XML');
      return;
    }

    logger.debug.dir(obj);
    const address = obj.root.URLBase[0].replace('http://','').replace('/upnp/', '').slice(0,-6);
    logger.debug.blue(address);
    this._onAddressObtained(address);
    return;

  });
};

MMCamera.prototype._onAddressObtained = function(address) {
  if (this.state.connection.connecting === true) return;
if (address === null) {
    return;
  }

  this.state.connection.connecting = true;

  this.ptpip = new PTPIP((this._onInterruptEvent).bind(this));
  this.ptpip.connect(address, (this._onConnect).bind(this));
};

MMCamera.prototype._onInterruptEvent = function(eventObject) {

  switch (eventObject.eventCode) {
    case Events.ObjectAdded:
      this.state.objects.waitCount -= 1;
      break;
    case Events.RequestGetEventData:
      if (this._requestedWirelessSettings === true) {
        break;
      }

      if ((Object.keys(this.state.propertyPromise)).length > 0) {
        // retrieve the event data
        let request = new PTPOperationRequest(OpCodes.GetEventData);
        this.ptpip.operationRequest(request, (this._onEventData).bind(this));
      }
      break;

    default:
      logger.debug.yellow('got event: ');
      logger.debug.yellow((eventObject.eventCode).toString(16));
      break;
  }

};

MMCamera.prototype._onEventData = function(response) {

  logger.debug.yellow('GetEventData response...');

  logger.dev.cyan('response: ');
  logger.dev.dir(response);

  let parsed = StringifyEventData(response);

  logger.dev.cyan('parsed: ');
  logger.dev.dir(parsed);

  switch (parsed.eventKind) {
    case 'NotifyDevicePropValue':

      let propName = parsed.data.payload.PropertyCode;
      let value = parsed.data.payload.PropertyValue;
      logger.debug.dir(this.state.propertyPromise);
      let promise = this.state.propertyPromise[propName]; 
      if (promise) {
        promise.resolve({
          propertyName: propName,
          value: value
        });
        delete this.state.propertyPromise[propName];
      }
      break;

    default:
      logger.debug.yellow('Event Kind: ' + parsed.eventKind);
      break;
  }
};

MMCamera.prototype._onConnect = function(success) {
  if (success === false)  {
    if (typeof this.openSessionCallback === 'function') {
      this.openSessionCallback('Unavailable');
    }
    return;
  }
  this.state.connection.connected = true;
  logger.debug.cyan('sending OpenSession...');

  let request = new PTPOperationRequest(OpCodes.OpenSession, [1]);
  this.ptpip.operationRequest(request, (this._onOpenSession).bind(this));
};

MMCamera.prototype._onOpenSession = function(response) {

  response = Stringify(response);
  
  logger.debug.yellow('OpenSession response...');
  logger.debug.dir(response);

  // enable interrupt mode
  let request = new PTPOperationRequest(OpCodes.SetEventNotificationMode, [
      0x02
  ]);
  this.ptpip.operationRequest(request, (this._onInterruptEnabled).bind(this));
};

MMCamera.prototype._onInterruptEnabled = function(response) {
  response = Stringify(response);
  logger.debug.yellow('SetEventNotificationMode response...');
  logger.debug.dir(response);

  // run the callback to complete the connection/initialization process
  if (typeof this.openSessionCallback === 'function') {
    this.openSessionCallback(response.code);
    this.openSessionCallback = undefined;
  }
};

// cleanup callback
MMCamera.prototype._cleanupCallback = function() {
  if (this.ptpip !== undefined && this.ptpip !== null) {
    this.ptpip.close();
  }
};

module.exports = MMCamera;

