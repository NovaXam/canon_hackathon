module.exports = (function () {
  function socketManager(io) {
    this.io = io;
    this.listen();
  };

  socketManager.prototype.listen = function () {
    this.io.on('connection', function (socket) {
      console.log('a client connected');
      // send the client their own id so we can send messages to onlt that client.
      socket.emit('connect', {
        id: socket.id,
        message: 'connected to server.',
      });

      // log the id of the new connected client.
      socket.on('sendStatus', function (data) {
        console.log(`client id is ${data.id}`);
      });

      socket.on('disconnect', function () {
        console.log('client disconnected');
      });
    });
  }

  // expore socketManager module
  return socketManager;
})();