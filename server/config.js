'use strict';

const path = require('path');

const PORT = 3000;
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

module.exports = { PORT, UPLOAD_DIR, MAX_FILE_SIZE_BYTES };
