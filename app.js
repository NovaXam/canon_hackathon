const express = require('express');
const app = express();
const server = require('http').Server(app);
const socketIO = require('socket.io');

// rest modules
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

// sockets setup
const config = require('./config');
const socketManager = require('./socketManager');
const CameraManager = require('./cameraManager');
const ClientManager = require('./clientManager');
const Camera = require('./howielib/howie').MMCamera;

let camera;
let cameraManager;
let clientManager;

(function restSetup() {
  server.listen(config.PORT, () => {
    console.log(`app is listening on port ${config.PORT}`);
  });

  app.use(logger('dev'));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(express.static(path.resolve(__dirname, 'client')));

  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
  });

  app.get('/camera/snap', (req, res) => {
    cameraManager.getImage(1)
      .then(data => {
        clientManager.uploadImage(data, (err, result) => {
          console.log('result', result);
          return clientManager.sendToCloud(url);
        });
      })
      .then(data => {
        console.log('data', data);
        clientManager.sendData(data);
      })
      .catch(res => console.error(res));
  });

  app.get('*', (req, res) => {
    res.json({
      message: 'Page Not Found',
    });
  });
})();

(function socketSetup() {
  const io = socketIO(server);
  const checkInSocket = new socketManager(io);

  camera = new Camera();
  // handle camera socket connections.
  cameraManager = new CameraManager(camera);
  cameraManager.listen(io, {
    ip: '',
    port: '',
  });

  // handle client socket connections.
  clientManager = new ClientManager(io);
})();