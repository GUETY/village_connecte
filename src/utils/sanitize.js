import DOMPurify from 'dompurify';

// Encapsule DOMPurify pour usage simple dans l'app
export function sanitizeHtml(dirty, options = {}) {
  if (!dirty && dirty !== 0) return "";
  try {
    // default options: allow basic formatting but strip scripts/events
    return DOMPurify.sanitize(String(dirty), {
      ALLOWED_TAGS: ['b','i','em','strong','a','p','ul','ol','li','br','span','div','h1','h2','h3','h4','h5','h6','img'],
      ALLOWED_ATTR: ['href','src','alt','title','rel','target','class','style'],
      FORCE_BODY: true,
      ...options,
    });
  } catch (e) {
    console.error('sanitizeHtml error', e);
    return String(dirty);
  }
}
