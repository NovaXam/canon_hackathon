'use strict';

const logger = require('../util/logger');

String.prototype.lpad = function(padString, length) {
  let str = this;
  while(str.length < length) {
    str = padString + str;
  }
  return str;
}

function Hex() {}

Hex.makeParam = function(val) {

  return Hex.convertLE(val, 4);

};

Hex.convertLE = function(num, size) {

  let buf = Buffer.alloc(size);
  switch(size) {
    case 1:
      buf.writeUInt8(num, 0);
      break;
    case 2:
      buf.writeUInt16LE(num, 0);
    case 4: 
      buf.writeUInt32LE(num, 0);
      break;
    default:
      Hex.writeLargeLE(buf, num, 0, size);
      break;
  }
  return buf;

};

Hex.writeLargeLE = function(buf, item, startIndex, sizeInBytes) {
  let b;
  for (let i = 0; i < sizeInBytes; i++) {
    b = item & 0xff;
    buf.writeUInt8(b, startIndex + i);
    item = (item - b) / 256;
  }
};

Hex.readLarge = function(buf, startIndex, sizeInBytes, itemType) {

  switch(itemType) {
    case 'ASCII':
      return readAscii(buf, startIndex, sizeInBytes);
    case 'UUID':
      return readUuid(buf, startIndex, sizeInBytes);
    default:
      return readUIntLE(buf, startIndex, sizeInBytes);
  }

};

function readUIntLE (buf, startIndex, sizeInBytes) {

  let bytes = new Array(sizeInBytes);

  // read a byte at a time and put the digits in an array
  for (let i = sizeInBytes - 1; i >= 0; i--) { 
    let b = buf.readUInt8(startIndex).toString(16).lpad('0', 2);
    bytes[i] = b;
    startIndex += 1;
  }

  return parseInt(bytes.join(''), 16);

}; 

function readAscii(buf, startIndex, sizeInBytes) {
  
  let bytes = new Array(sizeInBytes);


  // read a byte at a time and look for null
  for (let i = 0; i < sizeInBytes; i++) {
    let b = buf.readUInt8(startIndex);
    if (b !== 0) {
      b = String.fromCharCode(b);
      bytes[i] = b;
      startIndex += 1;
    } else {
      break;
    }
  }

  return bytes.join('');

}

function readUuid(buf, startIndex, sizeInBytes) {
  let bytes = new Array(sizeInBytes);

  // read a byte at a time and put the digits in an array
  for (let i = sizeInBytes - 1; i >= 0; i--) { let b = buf.readUInt8(startIndex).toString(16).lpad('0', 2);
    bytes[i] = b;
    startIndex += 1;
  }

  return bytes.join('');

}

module.exports = Hex;

