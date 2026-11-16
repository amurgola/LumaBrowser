const StructuralSummaryScript = require('../extraction/StructuralSummaryScript');
const SemanticTreeScript = require('../extraction/SemanticTreeScript');
const PageAnalysisScript = require('./PageAnalysisScript');

class PageSourceScripts {
  static DEFAULT_TYPE = 'clean';

  static DOCUMENT_ROOTS = '[document.documentElement]';
  static BODY_ROOTS = '[document.body || document.documentElement]';

  static FULL = 'document.documentElement.outerHTML';

  static MARKDOWN = PageSourceScripts._html(PageSourceScripts.BODY_ROOTS);

  static TEXT = PageSourceScripts._text(PageSourceScripts.BODY_ROOTS, true);

  static CLEAN = PageSourceScripts._clean(PageSourceScripts.DOCUMENT_ROOTS);

  static MINIMAL = PageSourceScripts._minimal(PageSourceScripts.DOCUMENT_ROOTS);

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

  static SCOPED = {
    full: (roots) => PageSourceScripts._html(roots),
    markdown: (roots) => PageSourceScripts._html(roots),
    text: (roots) => PageSourceScripts._text(roots, false),
    clean: (roots) => PageSourceScripts._clean(roots),
    minimal: (roots) => PageSourceScripts._minimal(roots),
  };

  static forType(type, selector = null) {
    const known = Object.prototype.hasOwnProperty.call(PageSourceScripts.BY_TYPE, type);
    const resolved = known ? type : PageSourceScripts.DEFAULT_TYPE;
    if (!selector || !PageSourceScripts.canScope(resolved)) return PageSourceScripts.BY_TYPE[resolved];
    return PageSourceScripts.SCOPED[resolved](`Array.from(document.querySelectorAll(${JSON.stringify(selector)}))`);
  }

  static canScope(type) {
    return Object.prototype.hasOwnProperty.call(PageSourceScripts.SCOPED, type);
  }

  static matchCount(selector) {
    return `(function(){try{return {count:document.querySelectorAll(${JSON.stringify(selector)}).length};}catch(error){return {error:error.message};}})();`;
  }

  static _html(roots) {
    return `(function(){try{return ${roots}.map(function(el){return el.outerHTML||'';}).join('\\n');}catch(e){return document.documentElement.outerHTML||'';}})();`;
  }

  static _text(roots, withTitle) {
    return `
(function() {
  try {
    const parts = ${roots}.map(el => el.innerText || el.textContent || '');
    if (${JSON.stringify(!!withTitle)} && document.title) parts.unshift(document.title);
    return parts.join('\\n\\n')
      .replace(/[\\t ]+/g, ' ')
      .replace(/ *\\n/g, '\\n')
      .replace(/\\n{3,}/g, '\\n\\n')
      .trim();
  } catch (error) { return 'Error extracting text: ' + error.message; }
})();`.trim();
  }

  static _clean(roots) {
    return `
(function() {
  try {
    const cleaned = ${roots}.map(root => {
      const html = root.cloneNode(true);
      const head = html.querySelector('head');
      if (head) head.remove();
      const unwantedTags = ['script', 'style', 'noscript', 'meta', 'link'];
      unwantedTags.forEach(tagName => { html.querySelectorAll(tagName).forEach(el => el.remove()); });
      const allowedAttributes = ['id', 'class', 'href', 'src', 'alt', 'title', 'type', 'name', 'placeholder', 'value', 'for', 'aria-label', 'role', 'action', 'method'];
      [html].concat(Array.from(html.querySelectorAll('*'))).forEach(element => {
        for (let i = element.attributes.length - 1; i >= 0; i--) {
          const attr = element.attributes[i];
          if (!allowedAttributes.includes(attr.name.toLowerCase())) element.removeAttribute(attr.name);
        }
        if (element.hasAttribute('href') && element.getAttribute('href').startsWith('data:image')) element.removeAttribute('href');
        if (element.hasAttribute('src') && element.getAttribute('src').startsWith('data:image')) element.removeAttribute('src');
      });
      const walker = document.createTreeWalker(html, NodeFilter.SHOW_COMMENT, null, false);
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
      return html.outerHTML || html.innerHTML || '';
    });
    return cleaned.join(' ').replace(/\\r\\n|\\n|\\r/g, ' ').replace(/\\s+/g, ' ').trim();
  } catch (error) { return 'Error extracting HTML: ' + error.message; }
})();`.trim();
  }

  static _minimal(roots) {
    return `
(function() {
  try {
    const stripped = ${roots}.map(root => {
      const html = root.cloneNode(true);
      const head = html.querySelector('head');
      if (head) head.remove();
      ['script', 'style', 'noscript', 'meta', 'link', 'nav', 'footer', 'aside'].forEach(tag => {
        html.querySelectorAll(tag).forEach(el => el.remove());
      });
      [html].concat(Array.from(html.querySelectorAll('*'))).forEach(element => {
        const allowed = ['id', 'class'];
        for (let i = element.attributes.length - 1; i >= 0; i--) {
          const attr = element.attributes[i];
          if (!allowed.includes(attr.name.toLowerCase())) element.removeAttribute(attr.name);
        }
      });
      return html.outerHTML || html.innerHTML || '';
    });
    return stripped.join(' ').replace(/\\s+/g, ' ').replace(/> </g, '>\\n<').trim();
  } catch (error) { return 'Error extracting HTML: ' + error.message; }
})();`.trim();
  }
}

module.exports = PageSourceScripts;
