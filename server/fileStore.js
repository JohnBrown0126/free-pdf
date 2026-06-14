'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { UPLOAD_DIR } = require('./config');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
}

function resolveUpload(fileId) {
  if (!/^[a-f0-9]{64}$/.test(fileId)) return null;
  return path.join(UPLOAD_DIR, fileId);
}

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function saveUpload(hash, buffer) {
  fs.writeFileSync(path.join(UPLOAD_DIR, hash), buffer);
}

function readPdf(filePath) {
  return fs.readFileSync(filePath);
}

function pdfExists(filePath) {
  return fs.existsSync(filePath);
}

module.exports = { ensureUploadDir, resolveUpload, hashBuffer, saveUpload, readPdf, pdfExists };
