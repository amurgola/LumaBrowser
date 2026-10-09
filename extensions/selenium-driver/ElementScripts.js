class ElementScripts {
  static finder({ using, value, scopeSelector }) {
    return `
    (function() {
      const scopeSel = ${scopeSelector ? JSON.stringify(scopeSelector) : 'null'};
      const using = ${JSON.stringify(using)};
      const value = ${JSON.stringify(value)};
      const root = scopeSel ? document.querySelector(scopeSel) : document;
      if (!root) return { ok: false, reason: 'scope-missing' };
      let matches = [];
      try {
        if (using === 'css selector' || using === 'tag name') {
          matches = Array.from(root.querySelectorAll(value));
        } else if (using === 'link text' || using === 'partial link text') {
          matches = Array.from(root.querySelectorAll('a')).filter(a => {
            const t = (a.textContent || '').trim();
            return using === 'link text' ? t === value : t.includes(value);
          });
        } else if (using === 'xpath') {
          const result = document.evaluate(value, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          for (let i = 0; i < result.snapshotLength; i++) matches.push(result.snapshotItem(i));
        } else {
          return { ok: false, reason: 'unsupported-strategy' };
        }
      } catch (e) {
        return { ok: false, reason: 'invalid-selector', message: e.message };
      }
      return { ok: true, count: matches.length };
    })()
  `;
  }

  static encode(using, value, scopeSelector, index) {
    return JSON.stringify({ __lb: true, using, value, scopeSelector, index });
  }

  static query(encodedSelector) {
    return `
    (function(enc){
      const d = JSON.parse(enc);
      const root = d.scopeSelector ? document.querySelector(d.scopeSelector) : document;
      if (!root) return null;
      if (d.using === 'css selector' || d.using === 'tag name') {
        return root.querySelectorAll(d.value)[d.index] || null;
      }
      if (d.using === 'link text' || d.using === 'partial link text') {
        const as = Array.from(root.querySelectorAll('a'));
        const filtered = as.filter(a => {
          const t = (a.textContent || '').trim();
          return d.using === 'link text' ? t === d.value : t.includes(d.value);
        });
        return filtered[d.index] || null;
      }
      if (d.using === 'xpath') {
        const r = document.evaluate(d.value, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return r.snapshotItem(d.index) || null;
      }
      return null;
    })(${JSON.stringify(encodedSelector)})
  `;
  }

  static onElement(encodedSelector, body) {
    return `(function(){ const el = ${ElementScripts.query(encodedSelector)}; ${body} })()`;
  }
}

module.exports = ElementScripts;
