/**
 * Utility functions for cleaning and sanitizing test questions, options, and PDF/scraped text artifacts.
 */

export function sanitizeOptionText(rawOpt: string): string {
  if (!rawOpt) return '';
  let text = String(rawOpt).trim();

  // 1. Remove leading option prefixes like "A.", "A)", "(A)", "1.", etc.
  text = text.replace(/^(\(?[A-Da-d1-4][\.\)]|\b[A-Da-d1-4][:.\s\-])\s*/, '').trim();

  // 2. Remove PDF source text, page headers/footers, and answer key notices
  const artifactPatterns = [
    /--\s*\d+\s*of\s*\d+\s*--.*$/gi,
    /O\s*Level\s*M[1-4]\s*[-—].*$/gi,
    /Programming\s+and\s+Problem\s+Solving\s+through\s+Python.*$/gi,
    /Page\s+\d+\s*ANSWER\s*KEY.*$/gi,
    /Check\s+your\s+answers\s+after\s+completing.*$/gi,
    /ANSWER\s*KEY.*$/gi,
    /Page\s+\d+/gi
  ];

  for (const pattern of artifactPatterns) {
    text = text.replace(pattern, '').trim();
  }

  // 3. Remove broken repeated characters like "B. B.", "A. A.", etc.
  if (/^[A-Za-z]\.\s*[A-Za-z]\.?$/.test(text) || /^([A-Za-z])\.\s*\1\.?$/i.test(text)) {
    // If it's a broken placeholder like "B. B.", fallback or clean
    text = '';
  }

  return text.trim();
}

export function sanitizeQuestionText(rawText: string): string {
  if (!rawText) return '';
  let text = String(rawText).trim();

  const artifactPatterns = [
    /--\s*\d+\s*of\s*\d+\s*--.*$/gi,
    /O\s*Level\s*M[1-4]\s*[-—].*$/gi,
    /Page\s+\d+\s*ANSWER\s*KEY.*$/gi,
    /Check\s+your\s+answers\s+after\s+completing.*$/gi
  ];

  for (const pattern of artifactPatterns) {
    text = text.replace(pattern, '').trim();
  }

  return text;
}
