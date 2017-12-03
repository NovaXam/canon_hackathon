'use strict';

const logger = require('../util/logger');
const Hex = require('../util/hex');

function getTotalDataSize(itemSizes) {
  return itemSizes.reduce((a, b) => a + b);
}

const FieldSize = {
  Length: 4
};

function BufferBuilder() {
  this.items = [];
  this.itemSizes = [];
  this.itemTypes = [];
}

/* Append numbers, strings, and buffer objects to the
 * buffer
 *
 * size is in bytes and will be inferred for buffers.
 * if size is not specified for strings, it will be assumed to be a null-terminated, variable length string
 * if size is not specified for numbers, you will have problems
*/ 
BufferBuilder.prototype.append = function(item, size) {

  this.items.push(item);

  switch(typeof item) {

    case 'number':

      this.itemTypes.push('number');
      this.itemSizes.push(size);
      break;

    case 'string':

      if (typeof size === 'number') {

        this.itemTypes.push('fixed');
        this.itemSizes.push(size);

      } else if (item.length === 0) {

        this.itemTypes.push('variable');
        this.itemSizes.push(1);

      } else {

        this.itemTypes.push('variable');
        this.itemSizes.push(item.length + 1);

      }
      break;

    default:

      if (Buffer.isBuffer(item)) {
        this.itemTypes.push('buffer');
        this.itemSizes.push(item.length);

      } else {
        logger.debug.red('WARNING! received incompatible data type in BufferBuilder.append(): ' + item);
      }

      break;
  }
};

BufferBuilder.prototype.from = function(templateArray) {
  for (let item of templateArray) {
    logger.debug.cyan('adding ' + item[0]);
    this.append(item[1].value, item[1].size);
  }
}

BufferBuilder.prototype.build = function() {

  let size = getTotalDataSize(this.itemSizes) + FieldSize.Length;
  let buffer = new Buffer(size);
  let bufIndex = 0;
  let item, itemSize, itemType;

  // Write the length as the first 4 bytes
  buffer.writeUInt32LE(size, bufIndex);
  bufIndex+=FieldSize.Length;

  for (let i = 0; i < this.items.length; i++) {

    item = this.items[i];
    itemSize = this.itemSizes[i];
    itemType = this.itemTypes[i];

    if (Buffer.isBuffer(item)) {
      buffer.fill(item, bufIndex, bufIndex + itemSize);
    } else if (typeof item === 'string') {
      if (itemType === 'fixed') {
        logger.debug.yellow('writing fixed string');
        writeStringFixed(item, itemSize, buffer, bufIndex);
      } else if (itemType === 'variable'){
        logger.debug.yellow('writing variable string');
        writeStringVariable(item, buffer, bufIndex);
      }
    } else {
      switch(itemSize) {
        case 1:
          buffer.writeUInt8(item, bufIndex);
          break;
        case 2:
          buffer.writeUInt16LE(item, bufIndex);
          break;
        case 4:
          buffer.writeUInt32LE(item, bufIndex);
          break;
        default:
          Hex.writeLargeLE(buffer, item, bufIndex, itemSize);
          break;
      }
    }
    bufIndex += itemSize;
  }

  return buffer;
};

/* return the number of characters written to the buffer */
function writeStringVariable(item, buf, bufIndex) {

  // write the string size
  buf.writeUInt8(item.length, bufIndex);

  if (item.length === 0) {
    return 1;
  }

  let i, charCode;
  for (i = 0; i < item.length; i++) {
    charCode = item.charCodeAt(i);
    if (isNaN(charCode)) {
      charCode = 0x00;
    } 
    buf.writeUInt8(charCode, bufIndex + i);
  }
  // null-terminator
  buf.writeUInt8(0x00, bufIndex + i);
  return i + i;
}

/* return the number of characters written to the buffer */
function writeStringFixed(item, fixedSize, buf, bufIndex) {

  let i, charCode;
  for (i = 0; i < fixedSize; i++) {
    charCode = item.charCodeAt(i);
    if (isNaN(charCode)) {
      buf.writeUInt8(0x00, bufIndex + i);
    }
    buf.writeUInt8(charCode, bufIndex + i);
  }

  /*
  for ( ; i < fixedSize; i++) {
    // write null-padding
    buf.writeUInt8(0x00, bufIndex + i);
  }
  */
  return i;

}

module.exports = BufferBuilder;
