'use strict';

const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const { MAX_FILE_SIZE_BYTES } = require('./config');
const { hashBuffer, saveUpload, readPdf } = require('./fileStore');
const { asyncHandler, validateFileId } = require('./middleware');
const { fillForm, listFields } = require('./pdf/forms');
const { applyOverlays } = require('./pdf/overlays');
const { createFontLoader } = require('./pdf/fonts');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

function sendPdf(res, bytes, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(bytes));
}

router.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const hash = hashBuffer(req.file.buffer);
  saveUpload(hash, req.file.buffer);
  res.json({ fileId: hash, originalName: req.file.originalname });
});

router.get('/pdf/:fileId', validateFileId, (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(req.filePath);
});

router.post('/fill/:fileId', validateFileId, asyncHandler(async (req, res) => {
  const filledBytes = await fillForm(readPdf(req.filePath), req.body.fields);
  sendPdf(res, filledBytes, 'filled.pdf');
}));

router.get('/fields/:fileId', validateFileId, asyncHandler(async (req, res) => {
  const fields = await listFields(readPdf(req.filePath));
  res.json({ fields });
}));

router.post('/overlay/:fileId', validateFileId, asyncHandler(async (req, res) => {
  const pdfDoc = await PDFDocument.load(readPdf(req.filePath));
  await applyOverlays(pdfDoc, req.body.overlays, createFontLoader(pdfDoc));
  sendPdf(res, await pdfDoc.save(), 'filled.pdf');
}));

module.exports = router;
