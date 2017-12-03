require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  SERVER_URL: process.env.HOST || `http://0.0.0.0:${this.PORT}`,
};