const createSamplePdf = require('./create-pdf.js');

module.exports = async function globalSetup() {
  await createSamplePdf();
};
