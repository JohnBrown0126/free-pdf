const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const app = express();
const PORT = 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

function resolveUpload(fileId) {
  if (!/^[a-f0-9]{64}$/.test(fileId)) return null;
  return path.join('uploads', fileId);
}

app.post('/api/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  const dest = path.join('uploads', hash);
  fs.writeFileSync(dest, req.file.buffer);
  res.json({ fileId: hash, originalName: req.file.originalname });
});

app.get('/api/pdf/:fileId', (req, res) => {
  const filePath = resolveUpload(req.params.fileId);
  if (!filePath) return res.status(400).json({ error: 'Invalid file id' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.resolve(filePath));
});

app.post('/api/fill/:fileId', async (req, res) => {
  const filePath = resolveUpload(req.params.fileId);
  if (!filePath) return res.status(400).json({ error: 'Invalid file id' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  try {
    const { fields } = req.body;
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    for (const [fieldName, value] of Object.entries(fields || {})) {
      try {
        const field = form.getTextField(fieldName);
        field.setText(String(value));
      } catch {
        // field not found or wrong type — skip
      }
    }

    const filledBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="filled.pdf"');
    res.send(Buffer.from(filledBytes));
  } catch {
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

app.get('/api/fields/:fileId', async (req, res) => {
  const filePath = resolveUpload(req.params.fileId);
  if (!filePath) return res.status(400).json({ error: 'Invalid file id' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields().map(f => ({
      name: f.getName(),
      type: f.constructor.name,
    }));

    res.json({ fields });
  } catch {
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

// overlays: array of text overlays and shape overlays
app.post('/api/overlay/:fileId', async (req, res) => {
  const filePath = resolveUpload(req.params.fileId);
  if (!filePath) return res.status(400).json({ error: 'Invalid file id' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

  try {
    const { overlays } = req.body;
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const fontCache = {};

    function hexToRgb(hex) {
      const h = /^#?([0-9a-f]{6})$/i.exec(hex)?.[1] ?? '000000';
      return rgb(parseInt(h.slice(0,2),16)/255, parseInt(h.slice(2,4),16)/255, parseInt(h.slice(4,6),16)/255);
    }

    for (const ov of overlays || []) {
      const page = pages[ov.page - 1];
      if (!page) continue;

      const s     = ov.style || {};
      const color = hexToRgb(s.color || '#000000');

      if (ov.type === 'shape') {
        const { pdfX: x, pdfY: y, pdfW: w, pdfH: h, shape } = ov;
        const bw = 1.5;
        if (shape === 'rect') {
          page.drawRectangle({ x, y, width: w, height: h, borderColor: color, borderWidth: bw });
        } else if (shape === 'rect-round') {
          const r = Math.min(8, w * 0.15, h * 0.15);
          const path = `M ${x+r} ${y} L ${x+w-r} ${y} Q ${x+w} ${y} ${x+w} ${y+r} L ${x+w} ${y+h-r} Q ${x+w} ${y+h} ${x+w-r} ${y+h} L ${x+r} ${y+h} Q ${x} ${y+h} ${x} ${y+h-r} L ${x} ${y+r} Q ${x} ${y} ${x+r} ${y} Z`;
          page.drawSvgPath(path, { borderColor: color, borderWidth: bw });
        } else if (shape === 'circle') {
          page.drawEllipse({ x: x+w/2, y: y+h/2, xScale: w/2-bw/2, yScale: h/2-bw/2, borderColor: color, borderWidth: bw });
        } else if (shape === 'cross') {
          page.drawLine({ start:{x, y:y+h}, end:{x:x+w, y},     color, thickness: bw });
          page.drawLine({ start:{x:x+w, y:y+h}, end:{x, y},     color, thickness: bw });
        } else if (shape === 'check') {
          page.drawLine({ start:{x, y:y+h*0.45},          end:{x:x+w*0.35, y:y+h*0.05}, color, thickness: bw });
          page.drawLine({ start:{x:x+w*0.35, y:y+h*0.05}, end:{x:x+w, y:y+h*0.9},       color, thickness: bw });
        }
        continue;
      }

      if (ov.type === 'signature') {
        if (!ov.dataUrl) continue;
        const base64 = ov.dataUrl.split(',')[1];
        if (!base64) continue;
        const pngBytes = Buffer.from(base64, 'base64');
        const image = await pdfDoc.embedPng(pngBytes);
        page.drawImage(image, { x: ov.pdfX, y: ov.pdfY, width: ov.pdfW, height: ov.pdfH });
        continue;
      }

      // text / date overlays
      if (!ov.text?.trim()) continue;
      const fontSize = ov.pdfFontSize || (s.fontSize || 11) / 1.5;
      let fontKey = StandardFonts.Helvetica;
      if (s.bold && s.italic) fontKey = StandardFonts.HelveticaBoldOblique;
      else if (s.bold)        fontKey = StandardFonts.HelveticaBold;
      else if (s.italic)      fontKey = StandardFonts.HelveticaOblique;
      if (!fontCache[fontKey]) fontCache[fontKey] = await pdfDoc.embedFont(fontKey);

      page.drawText(ov.text, {
        x: ov.pdfX + 2,
        y: ov.pdfY + ov.pdfH - fontSize - 2,
        size: fontSize,
        font: fontCache[fontKey],
        color,
        maxWidth: ov.pdfW - 4,
        lineHeight: fontSize * 1.3,
      });
    }

    const filledBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="filled.pdf"');
    res.send(Buffer.from(filledBytes));
  } catch {
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

app.listen(PORT, () => {
  console.log(`free-pdf running at http://localhost:${PORT}`);
});
