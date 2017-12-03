'use strict';


module.exports = function(value, options) {
  let name = undefined;
  Object.keys(options).forEach(function(key, index) {
    if (value === options[key]) {
      name = key;
      return;
    } 
  });
  return name;
};



