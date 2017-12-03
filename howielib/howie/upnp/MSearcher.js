'use strict';

/* nodejs */
const dgram = require('dgram');
const util = require('util');

/* user modules */
const logger = require('../util/logger');

const MISServiceName = "ICPO-CameraSystemService";
const SSDPMulticastAddress = "239.255.255.250";
const SSDPMulticastPort = 1900;

let mSearchTimer;

// private functions
function parseHeaderFields(buffer) {
  let header = {};
  let lines = buffer.toString().split('\n');
  for (let line of lines) {
    let field = line.match(/([^:\ ]*):\ (.*)/);
    if (field !== null) {
      header[field[1]] = field[2];
    }
  }
  return header;
}

/* Return true if the headers contain a service, else false */
function checkForServiceName(headers, serviceName) {
	return (headers.USN && headers.USN.indexOf(serviceName) !== -1);
}


/* Return URL of device description XML file or undefined if not found */
function getDeviceDescUrl(headers) {
  let xmlUrl = headers.Location;
  let address;

  if (xmlUrl !== undefined) {
    address = (xmlUrl.split('/')[2]).split(':')[0];
  }

  let usn = headers.USN;
  let uuid, schema, service, version;

  if (typeof usn === 'string') {
    usn = usn.split(':');
    if (usn.length >= 7) {
      uuid = usn[1];
      schema = usn[4];
      service = usn[6];
      version = usn[7];
    }
  }

  return {
    xmlUrl: xmlUrl,
    address: address,
    uuid: uuid,
    schema: schema,
    service: service,
    version: version
  };
}

function makeMSearch(serviceName) {

  let st;
  if (typeof serviceName !== 'string') {
    st = 'ST: ssdp:all';
  } else {
    st = 'ST: urn:schemas-canon-com:service:' + serviceName + ':1';
  }

  return Buffer.from([
		'M-SEARCH * HTTP/1.1',
    'HOST: ' + SSDPMulticastAddress + ':' + SSDPMulticastPort,
		'MAN: "ssdp:discover"',
    st,
		'MX: 3',
		'\r\n'
	].join('\r\n'));

}


// Constructor
function MSearcher() { }


MSearcher.prototype.startSSDP = function(ipLocationCallback) {

  this.msearch = makeMSearch(MISServiceName);

  this.udp = dgram.createSocket('udp4');

  this.udp.on('error', (err) => {
    logger.debug.red('server error');
    logger.debug.log(err);
    this.udp.close();
  });

  this.udp.on('message', (buffer, rinfo) => {

		let headers = parseHeaderFields(buffer);
    let desc = getDeviceDescUrl(headers);

    // See if it is the MIS Service
    if (desc.service === MISServiceName) {

      logger.debug.cyan('=================================');
      logger.debug.yellow(util.inspect(headers,{depth:null}));
      logger.debug.blue('=================================');
      logger.debug.blue(rinfo.address + ':' + rinfo.port);
      logger.debug.blue('=================================');

      // See if it includes the Location field
      if (desc.xmlUrl !== undefined && typeof ipLocationCallback === 'function') {
        ipLocationCallback(desc);
      }

    }
  });

  this.udp.on('listening', () => {
    const address = this.udp.address();
    logger.debug.yellow('udp server listening ' + address.address + ':' + address.port);

    this.udp.addMembership(SSDPMulticastAddress);

    this.udp.send(this.msearch, 0, this.msearch.length, SSDPMulticastPort, SSDPMulticastAddress);

    mSearchTimer = setInterval(()=> {
      this.udp.send(this.msearch, 0, this.msearch.length, SSDPMulticastPort, SSDPMulticastAddress);
    });
    }, 1000);

  this.udp.bind(SSDPMulticastPort);

};

/*
 * Scan for cameras and keep return
 *
 */
MSearcher.prototype.Scan = function(scanResultCallback) {

  this._startSSDP(function(desc) {
    if (typeof scanResultCallback === 'function') {
      // don't stop scanning, just pass along a result
      scanResultCallback(desc);
    }
  });

};

MSearcher.prototype._startSSDP = function(onDiscovered) {

  this.msearch = Buffer.from([
		'M-SEARCH * HTTP/1.1',
    'HOST: ' + SSDPMulticastAddress + ':' + SSDPMulticastPort,
		'MAN: "ssdp:discover"',
    'ST: urn:schemas-canon-com:service:' + MISServiceName + ':1',
    //'ST: ssdp:all',
		'MX: 3',
		'\r\n'
	].join('\r\n'));

  //TODO implement timeout 

  this.udp = dgram.createSocket('udp4');

  this.udp.on('error', (err) => {
    logger.red('UPNP discovery error');
    logger.red(err);
    this.udp.close();
  });

  this.udp.on('message', (buffer, rinfo) => {

    let msg = buffer.toString();
		let headers = parseHeaderFields(buffer);

    // see if it is the target
    if (checkForServiceName(headers, MISServiceName) === true) {

      logger.debug.cyan('=================================');
      logger.debug.yellow(util.inspect(headers,{depth:null}));
      logger.debug.blue('=================================');
      logger.debug.log(rinfo.address + ':' + rinfo.port);
      logger.debug.blue('=================================');

      // see if it includes the location
      const desc = getDeviceDescUrl(headers);
      if (desc.xmlUrl !== undefined) {
        if (typeof onDiscovered === 'function') {
          onDiscovered(desc);
        }
      }
    }
  });

  this.udp.on('listening', () => {
    const address = this.udp.address();
    logger.debug.yellow('udp server listening ' + address.address + ':' + address.port);
    this.udp.addMembership(SSDPMulticastAddress);

    this.udp.send(this.msearch, 0, this.msearch.length, SSDPMulticastPort, SSDPMulticastAddress);

    mSearchTimer = setInterval(()=> {
      this.udp.send(this.msearch, 0, this.msearch.length, SSDPMulticastPort, SSDPMulticastAddress);
    });
  }, 1000);

  this.udp.bind(SSDPMulticastAddress);

}

MSearcher.prototype.GetCamera = function(callback) {
  this._startSSDP((desc)=> {
    this.StopScan();
    if (typeof callback === 'function') {
      callback(desc);
    }
  });
};

MSearcher.prototype.StopScan = function() {
  clearInterval(mSearchTimer);
  if (this.udp !== undefined) {
    this.udp.close();
  }
};

module.exports = MSearcher;
