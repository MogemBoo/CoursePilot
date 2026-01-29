function normalizeWhitespace(s) {
  return (s || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitByParagraph(text) {
  return normalizeWhitespace(text)
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

function chunkText(text, { maxChars = 900, overlapChars = 120 } = {}) {
  const paras = splitByParagraph(text);
  const chunks = [];
  let current = '';

  for (const p of paras) {
    if (!current) {
      current = p;
      continue;
    }

    if ((current + '\n\n' + p).length <= maxChars) {
      current += '\n\n' + p;
      continue;
    }

    chunks.push(current);
    const overlap = current.slice(Math.max(0, current.length - overlapChars));
    current = overlap + '\n\n' + p;

    // hard limit if paragraph is gigantic
    while (current.length > maxChars * 1.6) {
      chunks.push(current.slice(0, maxChars));
      current = current.slice(maxChars - overlapChars);
    }
  }

  if (current) chunks.push(current);

  return chunks.map((t) => t.trim()).filter(Boolean);
}

module.exports = { chunkText };

