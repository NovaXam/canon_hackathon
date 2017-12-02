const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const path = require('path');
const config = require('./config');

const app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.get('*', (req, res) => {
  res.json({
    message: 'Page Not Found',
  });
});

app.listen(config.PORT, () => {
  console.log(`app is listening on port ${config.PORT}`);
});