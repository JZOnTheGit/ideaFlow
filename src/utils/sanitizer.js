import DOMPurify from 'dompurify';

export const sanitizeContent = (content) => {
  if (typeof content !== 'string') return '';
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // Strip all HTML
    ALLOWED_ATTR: []
  }).trim();
};

export const sanitizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return '';
  }
}; 