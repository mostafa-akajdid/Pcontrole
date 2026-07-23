import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'sub', 'sup', 'small', 'mark',
  'code', 'kbd', 'samp', 'var', 'abbr', 'cite', 'q',
  'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main',
  'video', 'source', 'iframe', 'picture',
  'input', 'label', 'select', 'option', 'textarea',
  'details', 'summary',
  'center', 'u',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'title', 'alt', 'src', 'srcset', 'sizes', 'loading',
  'width', 'height', 'class', 'id', 'style',
  'colspan', 'rowspan', 'scope', 'headers', 'align', 'valign',
  'type', 'value', 'checked', 'disabled', 'placeholder',
  'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload',
  'frameborder', 'allowfullscreen', 'allow',
  'data-type', 'data-checked',
];

const FORBID_TAGS = ['script', 'style', 'iframe', 'form', 'textarea', 'select', 'button', 'object', 'embed', 'applet'];
const FORBID_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'onkeydown', 'onkeyup', 'onkeypress'];

purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
  if (node.tagName === 'IMG') {
    if (!node.getAttribute('alt')) {
      node.setAttribute('alt', '');
    }
  }
});

export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return dirty;
  return purify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS,
    FORBID_ATTR,
    ADD_ATTR: ['target'],
    ADD_URI_SAFE_ATTR: ['src', 'href'],
  });
}

export function stripHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  return purify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
