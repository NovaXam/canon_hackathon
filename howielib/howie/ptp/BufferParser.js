'use strict';

const Hex = require('../util/hex');

const logger = require('../util/logger');


const FieldSize = {
  UnicodeChar: 4,
  ArrayLength: 4
};


/*------------------------------------------------------------------
 * Public functions
 *-----------------------------------------------------------------*/
const BufferParser = {};

/* definition looks like this:
 * [
 *    {field: 'field1', size: 4},
 *    {field: 'field2', size: 8}, 
 *    {field: 'field2', size: 16},
 *    {field: 'field3', size: null},
 *    {field: 'field4', size: 2}
 * ];
 * */

/*
 * Parse an 'Object' type of dataset, including any nested datasets
 */
BufferParser.parseObject = function(buf, def) {

  logger.debug.blue('parseObject() received buffer with def:');
  logger.debug.dir(def);

  let parsedObj = {
    buf: buf
  };

  let bufIndex = 0, defIndex = 0;

  let binSize = 0;

  while (defIndex < def.length && bufIndex < buf.length) {


    let fieldDef = def[defIndex];
    logger.debug.cyan('parsing field: ');
    logger.debug.dir(fieldDef);
    let field;


    if (fieldDef.type === 'Binary') {

      logger.debug.cyan('parsing binary field');
      logger.debug.magenta('binSize: ' + binSize);
      field = parseBinaryField(buf, bufIndex, binSize, fieldDef);

    } else {

      field = parseField(buf, bufIndex, fieldDef);

      if (fieldDef.field === 'DatasetLength') {
        // store the binary size for future use
        binSize = field.value - def.sum('size');
      }

    }

    parsedObj[field.name] = field.value;
    let fieldSize = getItemSize(field);
    bufIndex += fieldSize;

    logger.debug.yellow('\t' + def[defIndex].field + ': ' + field + ' (size=' + fieldSize + ', next_index=' + bufIndex + ')');

    defIndex++;

  }
  parsedObj.size = bufIndex;
  logger.debug.green('parsed an object:');
  logger.debug.dir(def);
  return parsedObj;
};

/*
 * Parse an 'Array' type of dataset
 */
BufferParser.parseArray = function(buf, def) {

  let parsedArr = [];

  let bufIndex = 0, defIndex = 0;

  let numElements= buf.readUInt32LE(bufIndex);
  //logger.debug.dir(buf);
  logger.debug.cyan(numElements);

  if (numElements === 0) {
    logger.debug.yellow('array has 0 elements');
    return parsedArr;
  }

  bufIndex += FieldSize.ArrayLength;

  while (bufIndex < buf.length && parsedArr.length < numElements) {


    let objBuffer = buf.slice(bufIndex, bufIndex + def.sum('size'));
    let parsedObj = BufferParser.parseObject(objBuffer, def);
    parsedArr.push(parsedObj);

    logger.debug.yellow('\titem #' + (parsedArr.length - 1));
    bufIndex += parsedObj.size;
    
  }

  return parsedArr;
};


/*
 * Parse a 'Binary' type of dataset
 */
BufferParser.parseBinary = function(buf, def) {
  return buf;
};

BufferParser.getParseFunction = function(def) {
  let parseFunctionKey = 'parse' + def.type;
  let parseFunction = BufferParser[parseFunctionKey];
  if (parseFunction !== undefined && typeof parseFunction == 'function') {
    return parseFunction;
  }
  return undefined;
};


/*------------------------------------------------------------------
 * Exports 
 *-----------------------------------------------------------------*/
module.exports = BufferParser;

/*------------------------------------------------------------------
 * Private functions
 *-----------------------------------------------------------------*/
function parseBinaryField(buf, bufIndex, binSize, def) {

  let item = {
    name: def.field,
    type: def.type,
    value: buf.slice(bufIndex, bufIndex + binSize),
    size: binSize
  };

  return item;
}

function parseField(buf, bufIndex, def) {

  let item = {
    name: def.field,
    type: def.type,
    value: undefined,
    size: def.size
  };

  item.buf = buf.slice(bufIndex, bufIndex+item.size);

  // Apply transform or lookup string values
  if (typeof def.transform === 'function') {
    item.value = def.transform(item.buf);
    return item;
  } 

  switch(item.size) {

    // Parse Object, Array, or Binary
    case undefined:

      logger.debug.cyan('nesting deeper');
      if (item.type !== undefined) {
        let parseFunction = BufferParser.getParseFunction(def);
        if (parseFunction !== undefined) {
          let parsedData = parseFunction(buf.slice(bufIndex), def.definition);
          item.value = parsedData;
          item.size = getItemSize(parsedData);
        }
      }
      break;

    // Parse null-terminated string
    case null:

      //read until we receive four zeros (unicode NULL)
      let uni = 1;
      item.value = '';
      item.size = 0;
      while (uni !== 0)  {
        uni = buf.readUInt16LE(bufIndex + item.size);
        logger.debug.red(uni.toString(16));
        item.value += uni.toString(16);
        item.size += FieldSize.UnicodeChar;
      }
      break;

    // Read Little-Endian integer
    case 1: item.value = buf.readUInt8(bufIndex);
            break;
    case 2: item.value = buf.readUInt16LE(bufIndex);
            break;
    case 4: item.value = buf.readUInt32LE(bufIndex);
            break;

    // Read a number greater than 4 bytes. 
    default:
      item.value = Hex.readLarge(buf, bufIndex, item.size, item.type);
      break;

  }

  item.value = attemptStringify(item.value, def.values);
  return item;

}

// Extend the <Array> prototype with a sum function
Array.prototype.sum = function (prop) {
  var total = 0;
  for (let i = 0, _len = this.length; i < _len; i++) {
    let n = this[i][prop];
    if (n !== null && n !== undefined) {
      total += n
    }
  }
  return total;

}

// Calculate the size of an item
function getItemSize(item) {
  if (item.size !== undefined) {
    return item.size;
  }
  if (Buffer.isBuffer(item)) {
    return item.length;
  } 
  if (Array.isArray(item)) {
    return item.sum('size') + FieldSize.ArrayLength;
  }
  logger.debug.red('WARNING! getItemSize() return undefined');
  return undefined;
}

function attemptStringify(value, options) {

  if (options === undefined || typeof options !== 'object') {
    return value;
  }

  for (let key in options) {

    // See if it is the target
    if (value === options[key]) {
      logger.debug.green('\t{' + key + ': ' + options[key] + '}\n');

      return key;
    } else {
      logger.debug.cyan('\t{' + key + ': ' + options[key] + '}');
    }
  }


  logger.debug.red('no match - value was ' + value);
  return 'Unknown (' + value + ')';
}
