'use strict';

const express = require('express');
const { ensureUploadDir } = require('./fileStore');
const { errorHandler } = require('./middleware');
const routes = require('./routes');

function createApp() {
  ensureUploadDir();
  const app = express();
  app.use(express.static('public'));
  app.use(express.json({ limit: '50mb' }));
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
