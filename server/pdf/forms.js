'use strict';

const { PDFDocument } = require('pdf-lib');

async function fillForm(pdfBytes, fields) {
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

  return pdfDoc.save();
}

async function listFields(pdfBytes) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  return form.getFields().map(f => ({
    name: f.getName(),
    type: f.constructor.name,
  }));
}

module.exports = { fillForm, listFields };
