const StructuralSummaryScript = require('../extraction/StructuralSummaryScript');
const SemanticTreeScript = require('../extraction/SemanticTreeScript');
const PageAnalysisScript = require('./PageAnalysisScript');

class PageSourceScripts {
  static DEFAULT_TYPE = 'clean';

  static FULL = 'document.documentElement.outerHTML';

  static MARKDOWN = `(function(){try{var b=document.body;return (b?b.outerHTML:document.documentElement.outerHTML)||'';}catch(e){return document.documentElement.outerHTML||'';}})();`;

  static TEXT = `
(function() {
  try {
    const doc = document.cloneNode(true);
    const root = doc.documentElement || doc;
    const unwanted = root.querySelectorAll('script, style, noscript, link, meta');
    unwanted.forEach(el => el.remove());
    const textContent = root.innerText || root.textContent || '';
    return textContent
      .replace(/[\\t ]+/g, ' ')
      .replace(/ *\\n/g, '\\n')
      .replace(/\\n{3,}/g, '\\n\\n')
      .trim();
  } catch (error) { return 'Error extracting text: ' + error.message; }
})();`.trim();

  static CLEAN = `
(function() {
  try {
    const doc = document.cloneNode(true);
    const html = doc.documentElement || doc;
    const head = html.querySelector('head');
    if (head) head.remove();
    const unwantedTags = ['script', 'style', 'noscript', 'meta', 'link'];
    unwantedTags.forEach(tagName => { html.querySelectorAll(tagName).forEach(el => el.remove()); });
    html.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    const allowedAttributes = ['id', 'class', 'href', 'src', 'alt', 'title', 'type', 'name', 'placeholder', 'value', 'for', 'aria-label', 'role', 'action', 'method'];
    html.querySelectorAll('*').forEach(element => {
      for (let i = element.attributes.length - 1; i >= 0; i--) {
        const attr = element.attributes[i];
        if (!allowedAttributes.includes(attr.name.toLowerCase())) element.removeAttribute(attr.name);
      }
      if (element.hasAttribute('href') && element.getAttribute('href').startsWith('data:image')) element.removeAttribute('href');
      if (element.hasAttribute('src') && element.getAttribute('src').startsWith('data:image')) element.removeAttribute('src');
    });
    const walker = doc.createTreeWalker(html, NodeFilter.SHOW_COMMENT, null, false);
    const comments = [];
    let comment;
    while (comment = walker.nextNode()) comments.push(comment);
    comments.forEach(c => c.remove());
    const voidTags = new Set(['input', 'img', 'br', 'hr', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr', 'textarea', 'select']);
    let emptyTagsRemoved;
    do {
      emptyTagsRemoved = false;
      html.querySelectorAll('*').forEach(element => {
        if (voidTags.has(element.tagName.toLowerCase())) return;
        if (!element.innerHTML.trim() && element.parentNode) { element.remove(); emptyTagsRemoved = true; }
      });
    } while (emptyTagsRemoved);
    return (html.outerHTML || html.innerHTML || '').replace(/\\r\\n|\\n|\\r/g, ' ').replace(/\\s+/g, ' ').trim();
  } catch (error) { return 'Error extracting HTML: ' + error.message; }
})();`.trim();

  static MINIMAL = `
(function() {
  try {
    const doc = document.cloneNode(true);
    const html = doc.documentElement || doc;
    const head = html.querySelector('head');
    if (head) head.remove();
    ['script', 'style', 'noscript', 'meta', 'link', 'nav', 'footer', 'aside'].forEach(tag => {
      html.querySelectorAll(tag).forEach(el => el.remove());
    });
    html.querySelectorAll('*').forEach(element => {
      const allowed = ['id', 'class'];
      for (let i = element.attributes.length - 1; i >= 0; i--) {
        const attr = element.attributes[i];
        if (!allowed.includes(attr.name.toLowerCase())) element.removeAttribute(attr.name);
      }
    });
    return (html.outerHTML || html.innerHTML || '').replace(/\\s+/g, ' ').replace(/> </g, '>\\n<').trim();
  } catch (error) { return 'Error extracting HTML: ' + error.message; }
})();`.trim();

  static BY_TYPE = {
    structural: StructuralSummaryScript.SOURCE,
    semanticTree: SemanticTreeScript.SOURCE,
    full: PageSourceScripts.FULL,
    markdown: PageSourceScripts.MARKDOWN,
    text: PageSourceScripts.TEXT,
    clean: PageSourceScripts.CLEAN,
    minimal: PageSourceScripts.MINIMAL,
    analyze: PageAnalysisScript.SOURCE,
  };

  static forType(type) {
    const known = Object.prototype.hasOwnProperty.call(PageSourceScripts.BY_TYPE, type);
    return PageSourceScripts.BY_TYPE[known ? type : PageSourceScripts.DEFAULT_TYPE];
  }
}

module.exports = PageSourceScripts;
