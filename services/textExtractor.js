const pdfParseImport = require('pdf-parse');

function extOf(fileName) {
  const parts = (fileName || '').split('.');
  return (parts[parts.length - 1] || '').toLowerCase();
}

async function extractText({ buffer, fileName, mimeType }) {
  const ext = extOf(fileName);
  const binary = Buffer.isBuffer(buffer) ? new Uint8Array(buffer) : buffer;

  function ensureString(v) {
    if (typeof v === 'string') return v;
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(ensureString).join('\n');
    if (typeof v === 'object') {
      if (typeof v.text === 'string') return v.text;
      if (Array.isArray(v.text)) return v.text.map(ensureString).join('\n');
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
  }

  // PDF
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    // pdf-parse v1 exports a function; v2 exports a PDFParse class
    if (typeof pdfParseImport === 'function') {
      const data = await pdfParseImport(binary);
      return { text: ensureString(data && data.text), kind: 'pdf' };
    }

    if (pdfParseImport && typeof pdfParseImport.PDFParse === 'function') {
      const parser = new pdfParseImport.PDFParse(binary);
      await parser.load();
      const raw = await parser.getText();
      return { text: ensureString(raw), kind: 'pdf' };
    }

    throw new Error('pdf-parse export not supported in this environment');
  }

  // Plain text / markdown / code
  if (
    mimeType?.startsWith('text/') ||
    ['md', 'markdown', 'txt', 'py', 'js', 'ts', 'java', 'cpp', 'c', 'cs', 'go', 'rs'].includes(ext)
  ) {
    return { text: buffer.toString('utf8'), kind: 'text' };
  }

  // PPTX: not supported in this lightweight build
  if (['ppt', 'pptx'].includes(ext)) {
    return { text: '', kind: 'pptx', warning: 'PPTX extraction not implemented yet. Upload PDFs/notes/code for best results.' };
  }

  return { text: buffer.toString('utf8'), kind: 'unknown' };
}

module.exports = { extractText };

