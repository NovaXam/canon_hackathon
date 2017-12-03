'use strict';

function noOp() {}

module.exports.set = function(callback) {

  callback = callback || noOp;
  process.on('cleanup', callback);

  process.on('exit', function() {
    process.emit('cleanup');
  });

  process.on('SIGINT', function() {
    console.log('Ctrl-C...');
    process.exit(2);
  });

  process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
    process.exit(99);
  });
};
