'use strict';

const { resolveUpload, pdfExists } = require('./fileStore');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function validateFileId(req, res, next) {
  const filePath = resolveUpload(req.params.fileId);
  if (!filePath)            return res.status(400).json({ error: 'Invalid file id' });
  if (!pdfExists(filePath)) return res.status(404).json({ error: 'File not found' });
  req.filePath = filePath;
  next();
}

function errorHandler(err, _req, res, _next) {
  console.error(err);
  res.status(500).json({ error: 'Failed to process PDF' });
}

module.exports = { asyncHandler, validateFileId, errorHandler };
