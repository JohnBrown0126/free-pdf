'use strict';

const { createApp } = require('./server/app');
const { PORT } = require('./server/config');

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

createApp().listen(PORT, () => {
  console.log(`free-pdf running at http://localhost:${PORT}`);
});
