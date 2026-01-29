const pdfParse = require('pdf-parse');

function extOf(fileName) {
  const parts = (fileName || '').split('.');
  return (parts[parts.length - 1] || '').toLowerCase();
}

async function extractText({ buffer, fileName, mimeType }) {
  const ext = extOf(fileName);

  // PDF
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const data = await pdfParse(buffer);
    return { text: data.text || '', kind: 'pdf' };
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

